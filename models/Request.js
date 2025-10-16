const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  clientEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  clientPhone: {
    type: String,
    trim: true
  },
  eventDetails: {
    type: String,
    required: true
  },
  eventType: {
    type: String,
    default: 'General Request'
  },
  selectedUshers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Request', requestSchema);