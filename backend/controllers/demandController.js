const Demand = require('../models/Demand');

// Get all demands
// GET /api/demands
exports.getDemands = async (req, res, next) => {
  try {
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

// Update store demand status
// PUT /api/demands/:id
exports.updateDemand = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status || !['pending', 'assigned', 'completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid status' });
    }

    const demand = await Demand.findById(req.params.id);
    if (!demand) {
      return res.status(404).json({ success: false, message: 'Demand not found' });
    }

    demand.status = status;
    await demand.save();

    return res.status(200).json({ success: true, data: demand });
  } catch (error) {
    next(error);
  }
};
