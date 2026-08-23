const Offer = require('../models/Offer');
const Demand = require('../models/Demand');
const Crop = require('../models/Crop');
const User = require('../models/User');
const { createOrUpdateTaskFromOffer } = require('./taskController');

// Get all offers (with role filtering)
// GET /api/offers
exports.getOffers = async (req, res, next) => {
  try {
    const filter = {};

    if (req.user.role === 'farmer') {
      filter.farmer = req.user.id;
    } else if (req.user.role === 'buyer') {
      const demands = await Demand.find({
        $or: [
          { buyer: req.user.id },
          { buyer: null }
        ]
      });
      const demandIds = demands.map(d => d._id);
      filter.demand = { $in: demandIds };
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied: Insufficient permissions' });
    }

    if (req.query.demand) {
      if (req.user.role === 'buyer') {
        const demand = await Demand.findById(req.query.demand);
        if (!demand || (demand.buyer && demand.buyer.toString() !== req.user.id)) {
          return res.status(403).json({ success: false, message: 'Access denied: Cannot view offers for this demand' });
        }
      }
      filter.demand = req.query.demand;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const offers = await Offer.find(filter)
      .populate('farmer', 'name photo')
      .populate('crop', 'name category location unit price')
      .populate('demand')
      .populate('createdBy', 'name photo role')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: offers.length, data: offers });
  } catch (error) {
    next(error);
  }
};

// Get single offer by ID
// GET /api/offers/:id
exports.getOfferById = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id)
      .populate('farmer', 'name photo')
      .populate('crop', 'name category location unit price')
      .populate('demand')
      .populate('createdBy', 'name photo role');

    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }

    // Access authorization check
    if (req.user.role === 'admin') {
      // Allow admin
    } else if (req.user.role === 'farmer') {
      if (offer.farmer._id.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied: Cannot access other farmers\' offers' });
      }
    } else if (req.user.role === 'buyer') {
      if (offer.demand.buyer && offer.demand.buyer.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied: Cannot access offers for other buyers\' demands' });
      }
    } else {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    return res.status(200).json({ success: true, data: offer });
  } catch (error) {
    next(error);
  }
};

// Create a new offer (initial or counter)
// POST /api/offers
exports.createOffer = async (req, res, next) => {
  try {
    const { demand: demandId, crop: cropId, quantity, pricePerUnit, message, parentOffer: parentOfferId } = req.body;

    const numQty = parseFloat(quantity);
    const numPrice = parseFloat(pricePerUnit);

    if (isNaN(numQty) || numQty <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive number' });
    }
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ success: false, message: 'Price per unit must be a non-negative number' });
    }

    let demand = await Demand.findById(demandId);
    if (!demand && parentOfferId) {
      const parent = await Offer.findById(parentOfferId);
      if (parent) {
        demand = await Demand.findById(parent.demand);
      }
    }

    if (!demand) {
      return res.status(404).json({ success: false, message: 'Demand not found' });
    }

    if (demand.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Demand is completed and not eligible for offers' });
    }

    if (!parentOfferId) {
      // INITIAL OFFER
      if (req.user.role !== 'farmer') {
        return res.status(403).json({ success: false, message: 'Access denied: Only farmers can submit initial offers' });
      }

      if (cropId) {
        const crop = await Crop.findById(cropId);
        if (!crop) {
          return res.status(404).json({ success: false, message: 'Crop not found' });
        }
        if (crop.farmer.toString() !== req.user.id) {
          return res.status(403).json({ success: false, message: 'Access denied: Crop does not belong to you' });
        }
        if (crop.availableQuantity < numQty) {
          return res.status(400).json({ success: false, message: 'Crop does not have enough available quantity' });
        }
      }

      const duplicateOffer = await Offer.findOne({
        demand: demand._id,
        farmer: req.user.id,
        status: 'pending'
      });
      if (duplicateOffer) {
        return res.status(400).json({ success: false, message: 'You already have an active pending offer for this demand' });
      }

      const offer = await Offer.create({
        demand: demand._id,
        farmer: req.user.id,
        crop: cropId || null,
        quantity: numQty,
        pricePerUnit: numPrice,
        message,
        status: 'pending',
        createdBy: req.user.id
      });

      return res.status(201).json({ success: true, data: offer });

    } else {
      // COUNTER OFFER
      const parentOffer = await Offer.findById(parentOfferId);
      if (!parentOffer) {
        return res.status(404).json({ success: false, message: 'Parent offer not found' });
      }

      if (parentOffer.status !== 'pending') {
        return res.status(400).json({ success: false, message: 'Parent offer is no longer active' });
      }

      if (parentOffer.demand.toString() !== demand._id.toString()) {
        return res.status(400).json({ success: false, message: 'Parent offer does not match demand' });
      }

      if (parentOffer.createdBy.toString() === req.user.id) {
        return res.status(400).json({ success: false, message: 'You cannot counter your own offer' });
      }

      let isBuyer = false;
      let isFarmer = false;

      if (req.user.role === 'buyer') {
        if (demand.buyer && demand.buyer.toString() !== req.user.id) {
          return res.status(403).json({ success: false, message: 'Access denied: This demand belongs to another buyer' });
        }
        isBuyer = true;
      } else if (req.user.role === 'farmer') {
        if (parentOffer.farmer.toString() !== req.user.id) {
          return res.status(403).json({ success: false, message: 'Access denied: You are not the farmer for this negotiation' });
        }
        isFarmer = true;
      } else {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      if (cropId) {
        const crop = await Crop.findById(cropId);
        if (!crop) {
          return res.status(404).json({ success: false, message: 'Crop not found' });
        }
        if (isFarmer && crop.farmer.toString() !== req.user.id) {
          return res.status(403).json({ success: false, message: 'Access denied: Crop does not belong to you' });
        }
        if (isBuyer && crop.farmer.toString() !== parentOffer.farmer.toString()) {
          return res.status(403).json({ success: false, message: 'Access denied: Crop does not belong to the farmer' });
        }
        if (crop.availableQuantity < numQty) {
          return res.status(400).json({ success: false, message: 'Crop does not have enough available quantity' });
        }
      }

      parentOffer.status = 'countered';
      await parentOffer.save();

      const offer = await Offer.create({
        demand: demand._id,
        farmer: parentOffer.farmer._id || parentOffer.farmer,
        crop: cropId || (parentOffer.crop ? (parentOffer.crop._id || parentOffer.crop) : null),
        quantity: numQty,
        pricePerUnit: numPrice,
        message,
        status: 'pending',
        parentOffer: parentOffer._id,
        createdBy: req.user.id
      });

      if (isBuyer && !demand.buyer) {
        demand.buyer = req.user.id;
        await demand.save();
      }

      return res.status(201).json({ success: true, data: offer });
    }

  } catch (error) {
    next(error);
  }
};

// Update an offer status (accepted, rejected, withdrawn)
// PUT /api/offers/:id
exports.updateOffer = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status || !['accepted', 'rejected', 'withdrawn'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status update' });
    }

    const offer = await Offer.findById(req.params.id).populate('demand');
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }

    if (offer.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Cannot change status: Offer is already ${offer.status}` });
    }

    const demand = offer.demand;

    if (status === 'withdrawn') {
      if (req.user.role !== 'farmer' || offer.farmer.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied: Only the owner farmer can withdraw this offer' });
      }
      offer.status = 'withdrawn';
      await offer.save();
      return res.status(200).json({ success: true, data: offer });
    }

    if (status === 'rejected') {
      if (req.user.role !== 'buyer' || (demand.buyer && demand.buyer.toString() !== req.user.id)) {
        return res.status(403).json({ success: false, message: 'Access denied: Only the buyer of this demand can reject offers' });
      }
      offer.status = 'rejected';
      await offer.save();
      return res.status(200).json({ success: true, data: offer });
    }

    if (status === 'accepted') {
      let isBuyer = req.user.role === 'buyer';
      let isFarmer = req.user.role === 'farmer';

      if (!isBuyer && !isFarmer) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      if (isBuyer) {
        if (offer.createdBy.toString() === req.user.id) {
          return res.status(400).json({ success: false, message: 'You cannot accept your own counter-offer' });
        }
        if (demand.buyer && demand.buyer.toString() !== req.user.id) {
          return res.status(403).json({ success: false, message: 'Access denied: Demand belongs to another buyer' });
        }
      }

      if (isFarmer) {
        if (offer.createdBy.toString() === req.user.id) {
          return res.status(400).json({ success: false, message: 'You cannot accept your own offer' });
        }
        if (offer.farmer.toString() !== req.user.id) {
          return res.status(403).json({ success: false, message: 'Access denied: You are not the farmer for this offer' });
        }
      }

      if (offer.crop) {
        const crop = await Crop.findById(offer.crop);
        if (crop && crop.availableQuantity < offer.quantity) {
          return res.status(400).json({ success: false, message: 'Crop does not have enough available quantity' });
        }
      }

      const buyerId = isBuyer ? req.user.id : offer.createdBy.toString();
      const farmerUser = await User.findById(offer.farmer);

      offer.status = 'accepted';
      await offer.save();

      await Offer.updateMany(
        { demand: demand._id, _id: { $ne: offer._id }, status: 'pending' },
        { $set: { status: 'rejected' } }
      );

      const task = await createOrUpdateTaskFromOffer(buyerId, demand, offer, farmerUser);

      return res.status(200).json({ success: true, data: { offer, task } });
    }

  } catch (error) {
    next(error);
  }
};

// Delete an offer (admin only)
// DELETE /api/offers/:id
exports.deleteOffer = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied: Only admins can delete offers' });
    }

    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }

    await offer.deleteOne();
    return res.status(200).json({ success: true, message: 'Offer deleted successfully' });
  } catch (error) {
    next(error);
  }
};
