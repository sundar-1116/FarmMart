const mongoose = require('mongoose');

const demandSchema = new mongoose.Schema({
  storeName: {
    type: String,
    required: [true, 'Please provide a store name'],
    trim: true
  },
  itemName: {
    type: String,
    required: [true, 'Please provide an item name'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Please provide the quantity'],
    min: [1, 'Quantity must be at least 1']
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'completed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Demand', demandSchema);
