const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  demand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Demand',
    required: [true, 'Please provide a demand reference']
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide a farmer reference']
  },
  crop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Crop',
    default: null
  },
  quantity: {
    type: Number,
    required: [true, 'Please provide a quantity'],
    min: [0, 'Quantity cannot be negative']
  },
  pricePerUnit: {
    type: Number,
    required: [true, 'Please provide a price per unit'],
    min: [0, 'Price per unit cannot be negative']
  },
  totalPrice: {
    type: Number,
    required: true
  },
  message: {
    type: String,
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'withdrawn', 'countered'],
    default: 'pending'
  },
  parentOffer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer',
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please specify who created this offer']
  }
}, { timestamps: true });

// Pre-validate hook to derive totalPrice server-side
offerSchema.pre('validate', function(next) {
  if (this.quantity !== undefined && this.pricePerUnit !== undefined) {
    this.totalPrice = this.quantity * this.pricePerUnit;
  }
  next();
});

// Indexes
offerSchema.index({ demand: 1 });
offerSchema.index({ farmer: 1 });
offerSchema.index({ status: 1 });
offerSchema.index({ parentOffer: 1 });
offerSchema.index({ demand: 1, farmer: 1 });

module.exports = mongoose.model('Offer', offerSchema);
