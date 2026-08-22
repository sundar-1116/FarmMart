const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide a farmer reference']
  },
  name: {
    type: String,
    required: [true, 'Please provide a crop name'],
    trim: true,
    maxlength: [100, 'Crop name cannot exceed 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    enum: {
      values: ['fruits', 'vegetables', 'flowers', 'pulses'],
      message: 'Category must be fruits, vegetables, flowers, or pulses'
    }
  },
  quantity: {
    type: Number,
    required: [true, 'Please provide the quantity'],
    min: [0, 'Quantity cannot be negative']
  },
  availableQuantity: {
    type: Number,
    required: [true, 'Please provide the available quantity'],
    min: [0, 'Available quantity cannot be negative'],
    validate: {
      validator: function(value) {
        return value <= this.quantity;
      },
      message: 'Available quantity cannot exceed total quantity'
    }
  },
  unit: {
    type: String,
    required: [true, 'Please provide a unit'],
    default: 'kg'
  },
  price: {
    type: Number,
    required: [true, 'Please provide the price'],
    min: [0, 'Price cannot be negative']
  },
  location: {
    type: String,
    required: [true, 'Please provide a location/origin'],
    trim: true
  },
  status: {
    type: String,
    enum: {
      values: ['available', 'unavailable'],
      message: 'Status must be available or unavailable'
    },
    default: 'available'
  }
}, { timestamps: true });

// Optimize query patterns
cropSchema.index({ farmer: 1 });
cropSchema.index({ category: 1 });
cropSchema.index({ status: 1 });
cropSchema.index({ name: 1 });

module.exports = mongoose.model('Crop', cropSchema);
