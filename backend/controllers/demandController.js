const Demand = require('../models/Demand');

// Get all demands
// GET /api/demands
exports.getDemands = async (req, res, next) => {
  try {
    const Task = require('../models/Task');
    const completedTasks = await Task.find({ paymentStatus: 'paid', deliveryStatus: 'delivered' });
    if (completedTasks.length > 0) {
      for (const t of completedTasks) {
        await Demand.updateMany(
          {
            status: { $ne: 'completed' },
            $or: [
              { claimedByTask: t._id },
              { storeName: t.storeName, itemName: t.itemName, buyer: t.assignedUser }
            ]
          },
          { $set: { status: 'completed' } }
        );
      }
    }

    const demands = await Demand.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: demands.length, data: demands });
  } catch (error) {
    next(error);
  }
};

// Create a new store demand
// POST /api/demands
exports.createDemand = async (req, res, next) => {
  try {
    const { storeName, itemName, quantity } = req.body;

    if (!storeName || !itemName || !quantity) {
      return res.status(400).json({ success: false, message: 'Please provide store name, item name, and quantity' });
    }

    const numQuantity = parseFloat(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive number' });
    }

    const demand = await Demand.create({
      storeName,
      itemName,
      quantity: numQuantity,
      status: 'pending'
    });

    return res.status(201).json({ success: true, data: demand });
  } catch (error) {
    next(error);
  }
};

// Update store demand (storeName, itemName, quantity, status)
// PUT /api/demands/:id
exports.updateDemand = async (req, res, next) => {
  try {
    const { storeName, itemName, quantity, status } = req.body;

    const demand = await Demand.findById(req.params.id);
    if (!demand) {
      return res.status(404).json({ success: false, message: 'Demand not found' });
    }

    if (storeName !== undefined && storeName !== null && storeName !== '') {
      if (!storeName.toString().trim()) return res.status(400).json({ success: false, message: 'Store name cannot be empty' });
      demand.storeName = storeName.toString().trim();
    }
    if (itemName !== undefined && itemName !== null && itemName !== '') {
      if (!itemName.toString().trim()) return res.status(400).json({ success: false, message: 'Item name cannot be empty' });
      demand.itemName = itemName.toString().trim();
    }
    if (quantity !== undefined && quantity !== null && quantity !== '') {
      const numQuantity = parseFloat(quantity);
      if (isNaN(numQuantity) || numQuantity <= 0) {
        return res.status(400).json({ success: false, message: 'Quantity must be a positive number' });
      }
      demand.quantity = numQuantity;
    }
    if (status !== undefined && status !== null && status !== '') {
      if (!['pending', 'assigned', 'completed'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Please provide a valid status' });
      }
      demand.status = status;
    }

    await demand.save();
    return res.status(200).json({ success: true, data: demand });
  } catch (error) {
    next(error);
  }
};

// Delete store demand (admin only)
// DELETE /api/demands/:id
exports.deleteDemand = async (req, res, next) => {
  try {
    const demand = await Demand.findById(req.params.id);
    if (!demand) {
      return res.status(404).json({ success: false, message: 'Demand not found' });
    }

    const Offer = require('../models/Offer');
    await Offer.deleteMany({ demand: demand._id });

    await demand.deleteOne();
    return res.status(200).json({ success: true, message: 'Demand deleted successfully' });
  } catch (error) {
    next(error);
  }
};
