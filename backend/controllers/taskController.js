const Task = require('../models/Task');
const Demand = require('../models/Demand');
const User = require('../models/User');

// Get all tasks (can filter by assignedUser)
// GET /api/tasks
exports.getTasks = async (req, res) => {
  try {
    const filter = {};
    if (req.query.assignedUser) {
      filter.assignedUser = req.query.assignedUser;
    }

    const tasks = await Task.find(filter)
      .populate('assignedUser', 'name email photo phone gender age')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    console.error(`Error in getTasks: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Server error retrieving tasks' });
  }
};

// Create a new task (Admin assigned or User claimed)
// POST /api/tasks
exports.createTask = async (req, res) => {
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
      deadline,
      demandId
    } = req.body;

    if (!assignedUser || !storeName || !itemName || !quantity || !deadline) {
      return res.status(400).json({ success: false, message: 'Please provide assigned user, store, item, quantity, and deadline' });
    }

    const user = await User.findById(assignedUser);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Assigned user not found' });
    }

    // Create the task
    const task = await Task.create({
      assignedUser,
      type: type || 'procurement',
      storeName,
      itemName,
      quantity,
      farmer: farmer || { name: '', category: '' },
      purchasePrice: purchasePrice || 0,
      deliveryPrice: deliveryPrice || 0,
      deliveryCharges: deliveryCharges || 0,
      paymentStatus: 'pending',
      deliveryStatus: 'pending',
      deadline: new Date(deadline)
    });

    // If this was linked to a store demand, update the demand status
    if (demandId) {
      const demand = await Demand.findById(demandId);
      if (demand) {
        demand.status = 'assigned';
        await demand.save();
      }
    }

    return res.status(201).json({ success: true, data: task });
  } catch (error) {
    console.error(`Error in createTask: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Server error creating task' });
  }
};

// Clear payment for a task
// PUT /api/tasks/:id/payment
exports.updateTaskPayment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    task.paymentStatus = 'paid';
    await task.save();

    return res.status(200).json({ success: true, data: task });
  } catch (error) {
    console.error(`Error in updateTaskPayment: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Server error updating payment status' });
  }
};

// Mark task as delivered
// PUT /api/tasks/:id/delivery
// Rule: Enforce that deliveries must be done in order of pending payments.
exports.updateTaskDelivery = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // 1. Enforce that this task itself must be paid first
    if (task.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: `Cannot deliver: Payment for "${task.itemName}" (${task.storeName}) must be cleared first.`
      });
    }

    // 2. Enforce that there are no older unpaid tasks for this user
    const olderUnpaidTask = await Task.findOne({
      assignedUser: task.assignedUser,
      paymentStatus: 'pending',
      createdAt: { $lt: task.createdAt }
    });

    if (olderUnpaidTask) {
      return res.status(400).json({
        success: false,
        message: `Cannot deliver: There is an older unpaid procurement for "${olderUnpaidTask.itemName}" (${olderUnpaidTask.storeName}) that must be cleared first.`
      });
    }

    task.deliveryStatus = 'delivered';
    await task.save();

    // If this task was associated with a store demand, check if all items are completed
    // (For this mock/simplified implementation, marking a task as delivered completes it)
    return res.status(200).json({ success: true, data: task });
  } catch (error) {
    console.error(`Error in updateTaskDelivery: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Server error updating delivery status' });
  }
};

// Get stats summary (for admin and users)
// GET /api/tasks/stats
exports.getTaskStats = async (req, res) => {
  try {
    const filter = {};
    if (req.query.assignedUser) {
      filter.assignedUser = req.query.assignedUser;
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
    console.error(`Error in getTaskStats: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Server error retrieving stats' });
  }
};

// Update task details (farmer and prices)
// PUT /api/tasks/:id
exports.updateTask = async (req, res) => {
  try {
    const { farmer, purchasePrice, deliveryPrice, deliveryCharges } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (farmer) task.farmer = farmer;
    if (purchasePrice !== undefined) task.purchasePrice = purchasePrice;
    if (deliveryPrice !== undefined) task.deliveryPrice = deliveryPrice;
    if (deliveryCharges !== undefined) task.deliveryCharges = deliveryCharges;

    await task.save();
    return res.status(200).json({ success: true, data: task });
  } catch (error) {
    console.error(`Error in updateTask: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Server error updating task details' });
  }
};

