const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  assignedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Task must be assigned to a user']
  },
  type: {
    type: String,
    enum: ['procurement', 'admin-assigned'],
    default: 'procurement'
  },
  storeName: {
    type: String,
    required: [true, 'Please provide store name'],
    trim: true
  },
  itemName: {
    type: String,
    required: [true, 'Please provide item name'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Please provide quantity'],
    min: [1, 'Quantity must be at least 1']
  },
  farmer: {
    name: { type: String, default: '' },
    category: { type: String, default: '' }
  },
  purchasePrice: {
    type: Number,
    default: 0
  },
  deliveryPrice: {
    type: Number,
    default: 0
  },
  deliveryCharges: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  deliveryStatus: {
    type: String,
    enum: ['pending', 'delivered'],
    default: 'pending'
  },
  deadline: {
    type: Date,
    required: [true, 'Please provide a delivery deadline']
  }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
