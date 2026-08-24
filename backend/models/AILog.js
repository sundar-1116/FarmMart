const mongoose = require('mongoose');

const aiLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'buyer', 'farmer'],
    required: true
  },
  query: {
    type: String,
    required: true,
    trim: true
  },
  intent: {
    type: String,
    default: 'general_farmmart_question'
  },
  responseTokens: {
    type: Number,
    default: 0
  },
  durationMs: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['success', 'error', 'mock'],
    default: 'success'
  }
}, { timestamps: true });

aiLogSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('AILog', aiLogSchema);
