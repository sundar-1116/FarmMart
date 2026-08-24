const Task = require('../models/Task');
const Demand = require('../models/Demand');
const User = require('../models/User');

// Get all tasks (can filter by assignedUser or farmerId)
// GET /api/tasks
exports.getTasks = async (req, res, next) => {
  try {
    const filter = {};
    const queryUser = req.query.assignedUser || req.query.farmerId;

    if (req.user.role === 'admin') {
      if (queryUser) {
        filter.$or = [{ assignedUser: queryUser }, { farmerId: queryUser }];
      }
    } else if (req.user.role === 'farmer') {
      if (queryUser && queryUser.toString() !== req.user.id.toString()) {
        const error = new Error('Access denied: Cannot view other users\' tasks');
        error.statusCode = 403;
        error.code = 'FORBIDDEN';
        return next(error);
      }
      // Auto-backfill farmerId for legacy tasks matching farmer name
      await Task.updateMany(
        { $or: [{ farmerId: null }, { farmerId: { $exists: false } }], 'farmer.name': req.user.name },
        { $set: { farmerId: req.user.id } }
      );
      filter.$or = [
        { farmerId: req.user.id },
        { 'farmer.name': req.user.name }
      ];
    } else {
      // Buyer / normal user: defaults to own tasks
      if (queryUser && queryUser.toString() !== req.user.id.toString()) {
        const error = new Error('Access denied: Cannot view other users\' tasks');
        error.statusCode = 403;
        error.code = 'FORBIDDEN';
        return next(error);
      }
      filter.assignedUser = req.user.id;
    }

    const tasks = await Task.find(filter)
      .populate('assignedUser', 'name email photo phone gender age')
      .populate('farmerId', 'name email photo phone gender age')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    next(error);
  }
};

// Create a new task (Admin assigned or User claimed)
// POST /api/tasks
exports.createTask = async (req, res, next) => {
  const mongoose = require('mongoose');
  let demandUpdated = false;
  let taskId = null;
  const { demandId } = req.body;
  try {
    const {
      assignedUser,
      type,
      storeName,
      itemName,
      quantity,
      farmer,
      purchasePrice,
      deliveryPrice,
      deliveryCharges,
      deadline
    } = req.body;

    if (!assignedUser || !storeName || !itemName || !quantity || !deadline) {
      return res.status(400).json({ success: false, message: 'Please provide assigned user, store, item, quantity, and deadline' });
    }

    // Role check: Normal users can only assign tasks to themselves
    if (req.user.role !== 'admin' && assignedUser !== req.user.id) {
      const error = new Error('Access denied: Cannot assign tasks to other users');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      return next(error);
    }

    // Numeric validations
    const numQty = parseFloat(quantity);
    const numPP = parseFloat(purchasePrice) || 0;
    const numDP = parseFloat(deliveryPrice) || 0;
    const numDC = parseFloat(deliveryCharges) || 0;

    if (numQty <= 0 || numPP < 0 || numDP < 0 || numDC < 0) {
      return res.status(400).json({ success: false, message: 'Prices and quantities must be non-negative values' });
    }

    const user = await User.findById(assignedUser);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Assigned user not found' });
    }

    // Pre-generate unique task identifier to track demand reservation ownership
    taskId = new mongoose.Types.ObjectId();

    // Atomic Demand claim status check & update
    if (demandId) {
      const updatedDemand = await Demand.findOneAndUpdate(
        { _id: demandId, status: 'pending' },
        { $set: { status: 'assigned', claimedByTask: taskId, buyer: req.user.id } },
        { new: true }
      );
      if (!updatedDemand) {
        return res.status(409).json({ success: false, message: 'Demand has already been claimed or is unavailable.' });
      }
      demandUpdated = true;
    }

    // Create the task
    const task = await Task.create({
      _id: taskId,
      assignedUser,
      type: type || 'procurement',
      storeName,
      itemName,
      quantity: numQty,
      farmer: farmer || { name: '', category: '' },
      purchasePrice: numPP,
      deliveryPrice: numDP,
      deliveryCharges: numDC,
      paymentStatus: 'pending',
      deliveryStatus: 'pending',
      deadline: new Date(deadline)
    });

    // Security Logging
    console.log(`[SECURITY] Task created successfully by user: ${req.user.email} (Assigned to user: ${user.email})`);

    return res.status(201).json({ success: true, data: task });
  } catch (error) {
    if (demandId && demandUpdated && taskId) {
      await Demand.updateOne(
        { _id: demandId, claimedByTask: taskId },
        { $set: { status: 'pending', claimedByTask: null } }
      );
    }
    next(error);
  }
};

// Clear payment for a task
// PUT /api/tasks/:id/payment
exports.updateTaskPayment = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Authorization: User must be assigned to task OR must be an admin
    if (req.user.role !== 'admin' && task.assignedUser.toString() !== req.user.id) {
      const error = new Error('Access denied: Cannot update payment for other users\' tasks');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      return next(error);
    }

    task.paymentStatus = 'paid';
    await task.save();

    // Auto-complete associated demand if both payment and delivery are completed
    if (task.paymentStatus === 'paid' && task.deliveryStatus === 'delivered') {
      await Demand.updateMany(
        {
          $or: [
            { claimedByTask: task._id },
            { storeName: task.storeName, itemName: task.itemName, buyer: task.assignedUser }
          ]
        },
        { $set: { status: 'completed' } }
      );
    }

    console.log(`[SECURITY] Task payment cleared by user: ${req.user.email} for task ID: ${task._id}`);

    return res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// Mark task as procured (Farmer action)
// PUT /api/tasks/:id/procure
exports.updateTaskProcurement = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Authorization: ONLY the assigned farmer (task.farmerId) can mark as procured
    const isAssignedFarmer = task.farmerId && task.farmerId.toString() === req.user.id;
    if (!isAssignedFarmer) {
      const error = new Error('Access denied: Only the assigned farmer can mark this task as procured');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      return next(error);
    }

    task.procurementStatus = 'procured';
    await task.save();

    console.log(`[SECURITY] Task procurement marked by user: ${req.user.email} for task ID: ${task._id}`);

    return res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// Mark task as delivered
// PUT /api/tasks/:id/delivery
// Rule: Enforce that deliveries must be done in order of pending payments and after farmer procurement.
exports.updateTaskDelivery = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Authorization: User must be assigned to task OR must be an admin
    if (req.user.role !== 'admin' && task.assignedUser.toString() !== req.user.id) {
      const error = new Error('Access denied: Cannot update delivery status for other users\' tasks');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      return next(error);
    }

    // 1. Enforce that crop procurement must be confirmed by the farmer if assigned
    if (task.farmerId && task.procurementStatus !== 'procured') {
      return res.status(400).json({
        success: false,
        message: `Cannot deliver: Crop procurement for "${task.itemName}" has not been confirmed by the farmer.`
      });
    }

    // 2. Enforce that this task itself must be paid first
    if (task.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: `Cannot deliver: Payment for "${task.itemName}" (${task.storeName}) must be cleared first.`
      });
    }

    task.deliveryStatus = 'delivered';
    await task.save();

    // Auto-complete associated demand if both payment and delivery are completed
    if (task.paymentStatus === 'paid' && task.deliveryStatus === 'delivered') {
      await Demand.updateMany(
        {
          $or: [
            { claimedByTask: task._id },
            { storeName: task.storeName, itemName: task.itemName, buyer: task.assignedUser }
          ]
        },
        { $set: { status: 'completed' } }
      );
    }

    console.log(`[SECURITY] Task delivery marked by user: ${req.user.email} for task ID: ${task._id}`);

    return res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// Get stats summary (for admin and users)
// GET /api/tasks/stats
exports.getTaskStats = async (req, res, next) => {
  try {
    const filter = {};
    const queryUser = req.query.assignedUser;

    if (req.user.role === 'admin') {
      if (queryUser) {
        filter.assignedUser = queryUser;
      }
    } else {
      // Normal user: Can ONLY see stats for their own tasks
      // Requesting overall system stats without a filter is restricted to administrators
      if (!queryUser) {
        const error = new Error('Access denied: Omitted assignedUser filter is restricted to administrators');
        error.statusCode = 403;
        error.code = 'FORBIDDEN';
        return next(error);
      }

      if (queryUser !== req.user.id) {
        const error = new Error('Access denied: Cannot view other users\' stats');
        error.statusCode = 403;
        error.code = 'FORBIDDEN';
        return next(error);
      }

      filter.assignedUser = req.user.id;
    }

    const totalPendingPayments = await Task.countDocuments({ ...filter, paymentStatus: 'pending' });
    const totalPendingDeliveries = await Task.countDocuments({ ...filter, deliveryStatus: 'pending' });
    const totalCompleted = await Task.countDocuments({ ...filter, deliveryStatus: 'delivered', paymentStatus: 'paid' });
    const totalTasks = await Task.countDocuments(filter);

    // Completion percentage
    const completionPercent = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalPendingPayments,
        totalPendingDeliveries,
        totalCompleted,
        totalTasks,
        completionPercent
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update task details (farmer and prices)
// PUT /api/tasks/:id
exports.updateTask = async (req, res, next) => {
  try {
    const { farmer, purchasePrice, deliveryPrice, deliveryCharges } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Authorization: User must be assigned to task OR must be an admin
    if (req.user.role !== 'admin' && task.assignedUser.toString() !== req.user.id) {
      const error = new Error('Access denied: Cannot update task details for other users\' tasks');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      return next(error);
    }

    // Lock check: prevent modification if paid or delivered
    if (task.paymentStatus === 'paid' || task.deliveryStatus === 'delivered') {
      return res.status(400).json({ success: false, message: 'Cannot modify details of a paid or delivered procurement task.' });
    }

    if (farmer) task.farmer = farmer;

    // Validate prices if updated
    if (purchasePrice !== undefined) {
      const numPP = parseFloat(purchasePrice);
      if (isNaN(numPP) || numPP < 0) return res.status(400).json({ success: false, message: 'Invalid purchase price' });
      task.purchasePrice = numPP;
    }
    if (deliveryPrice !== undefined) {
      const numDP = parseFloat(deliveryPrice);
      if (isNaN(numDP) || numDP < 0) return res.status(400).json({ success: false, message: 'Invalid delivery price' });
      task.deliveryPrice = numDP;
    }
    if (deliveryCharges !== undefined) {
      const numDC = parseFloat(deliveryCharges);
      if (isNaN(numDC) || numDC < 0) return res.status(400).json({ success: false, message: 'Invalid delivery charges' });
      task.deliveryCharges = numDC;
    }

    await task.save();
    return res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// Helper function to create or update task from accepted offer
exports.createOrUpdateTaskFromOffer = async (buyerId, demand, offer, farmerUser) => {
  const mongoose = require('mongoose');
  const Crop = require('../models/Crop');

  let task = null;
  // If the demand is already claimed by a task, let's update it
  if (demand.claimedByTask) {
    task = await Task.findById(demand.claimedByTask);
  }

  // Find crop category to pre-fill farmer category
  let category = 'vegetables';
  if (offer.crop) {
    const crop = await Crop.findById(offer.crop);
    if (crop) {
      category = crop.category;
    }
  }

  if (task) {
    // Lock check: if already paid or delivered, don't mutate terms
    if (task.paymentStatus !== 'paid' && task.deliveryStatus !== 'delivered') {
      task.farmerId = farmerUser?._id || farmerUser?.id || offer.farmer;
      task.farmer = {
        name: farmerUser?.name || task.farmer?.name || 'Farmer',
        category: category
      };
      task.purchasePrice = offer.totalPrice;
      task.quantity = offer.quantity;
      await task.save();
    }
  } else {
    // Create new task
    const taskId = new mongoose.Types.ObjectId();
    const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days default

    task = await Task.create({
      _id: taskId,
      assignedUser: buyerId,
      farmerId: farmerUser?._id || farmerUser?.id || offer.farmer,
      type: 'procurement',
      storeName: demand.storeName,
      itemName: demand.itemName,
      quantity: offer.quantity,
      farmer: {
        name: farmerUser?.name || 'Farmer',
        category: category
      },
      purchasePrice: offer.totalPrice,
      deliveryPrice: 0,
      deliveryCharges: 0,
      procurementStatus: 'pending',
      paymentStatus: 'pending',
      deliveryStatus: 'pending',
      deadline: deadline
    });

    demand.claimedByTask = taskId;
  }

  demand.status = 'assigned';
  demand.buyer = buyerId;
  await demand.save();

  return task;
};
