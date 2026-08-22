const Crop = require('../models/Crop');
const User = require('../models/User');

// Get all crops (with optional filtering)
// GET /api/crops
exports.getCrops = async (req, res, next) => {
  try {
    const filter = {};

    // Support optional filters: farmer, category, status
    if (req.query.farmer) {
      if (req.user.role === 'farmer' && req.query.farmer.toString() !== req.user.id.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied: Farmers can only query their own inventory' });
      }
      filter.farmer = req.query.farmer;
    }
    if (req.query.category) {
      filter.category = req.query.category;
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Security: Only admins and the owner themselves can retrieve unavailable crops.
    if (req.user.role !== 'admin') {
      if (req.user.role === 'buyer') {
        filter.status = 'available';
      } else if (req.user.role === 'farmer') {
        if (!filter.farmer || filter.farmer.toString() !== req.user.id.toString()) {
          filter.status = 'available';
        }
      }
    }

    const crops = await Crop.find(filter)
      .populate('farmer', 'name photo')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: crops.length, data: crops });
  } catch (error) {
    next(error);
  }
};

// Get single crop by ID
// GET /api/crops/:id
exports.getCropById = async (req, res, next) => {
  try {
    const crop = await Crop.findById(req.params.id).populate('farmer', 'name photo');
    if (!crop) {
      return res.status(404).json({ success: false, message: 'Crop not found' });
    }
    return res.status(200).json({ success: true, data: crop });
  } catch (error) {
    next(error);
  }
};

// Create a new crop
// POST /api/crops
exports.createCrop = async (req, res, next) => {
  try {
    const { name, category, quantity, availableQuantity, unit, price, location, status } = req.body;
    let farmerId = req.body.farmer;

    if (req.user.role === 'farmer') {
      // Farmers can only create crops for themselves
      if (farmerId && farmerId.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied: Farmers cannot create inventory for other users' });
      }
      farmerId = req.user.id;
    } else if (req.user.role === 'admin') {
      // Admins must specify a farmer ID
      if (!farmerId) {
        return res.status(400).json({ success: false, message: 'Please provide a farmer ID' });
      }
    } else {
      // Buyers are forbidden
      return res.status(430).json({ success: false, message: 'Access denied: Buyers cannot create crops' });
    }

    // Validate that the referenced farmer exists and is indeed a farmer
    const farmerUser = await User.findById(farmerId);
    if (!farmerUser) {
      return res.status(404).json({ success: false, message: 'Referenced farmer user not found' });
    }
    if (farmerUser.role !== 'farmer') {
      return res.status(400).json({ success: false, message: 'Referenced user must have a farmer role' });
    }

    const crop = await Crop.create({
      farmer: farmerId,
      name,
      category,
      quantity,
      availableQuantity: availableQuantity !== undefined ? availableQuantity : quantity,
      unit,
      price,
      location,
      status
    });

    return res.status(201).json({ success: true, data: crop });
  } catch (error) {
    if (error.name === 'ValidationError') {
      error.statusCode = 400;
    }
    next(error);
  }
};

// Update a crop
// PUT /api/crops/:id
exports.updateCrop = async (req, res, next) => {
  try {
    const crop = await Crop.findById(req.params.id);
    if (!crop) {
      return res.status(404).json({ success: false, message: 'Crop not found' });
    }

    // Authorization checks
    if (req.user.role === 'farmer') {
      // Farmers can only update their own crops
      if (crop.farmer.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied: Cannot modify other farmers\' crops' });
      }
      // Farmers cannot change the owner (farmer reference) of the crop
      if (req.body.farmer && req.body.farmer.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied: Cannot change crop ownership' });
      }
      // Strip out farmer changes
      delete req.body.farmer;
    } else if (req.user.role === 'admin') {
      // If admin updates the farmer reference, validate it
      if (req.body.farmer) {
        const newFarmer = await User.findById(req.body.farmer);
        if (!newFarmer) {
          return res.status(404).json({ success: false, message: 'New farmer user not found' });
        }
        if (newFarmer.role !== 'farmer') {
          return res.status(400).json({ success: false, message: 'New user must have a farmer role' });
        }
      }
    } else {
      // Buyers cannot update crops
      return res.status(403).json({ success: false, message: 'Access denied: Buyers cannot update crops' });
    }

    // Set updated fields and save to trigger Mongoose validations
    crop.set(req.body);
    await crop.save();

    return res.status(200).json({ success: true, data: crop });
  } catch (error) {
    if (error.name === 'ValidationError') {
      error.statusCode = 400;
    }
    next(error);
  }
};

// Delete a crop
// DELETE /api/crops/:id
exports.deleteCrop = async (req, res, next) => {
  try {
    const crop = await Crop.findById(req.params.id);
    if (!crop) {
      return res.status(404).json({ success: false, message: 'Crop not found' });
    }

    // Authorization checks
    if (req.user.role === 'farmer') {
      // Farmers can only delete their own crops
      if (crop.farmer.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied: Cannot delete other farmers\' crops' });
      }
    } else if (req.user.role !== 'admin') {
      // Buyers or other roles cannot delete crops
      return res.status(403).json({ success: false, message: 'Access denied: Buyers cannot delete crops' });
    }

    await crop.deleteOne();

    return res.status(200).json({ success: true, message: 'Crop deleted successfully' });
  } catch (error) {
    next(error);
  }
};
