const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  date: {
    type: Date,
    required: [true, 'Event date is required']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  client: {
    type: String,
    required: [true, 'Client name is required']
  },
  clientEmail: {
    type: String,
    required: [true, 'Client email is required'],
    match: [/^[\w-\.+]+@[\w-]+(\.[\w-]+)+$/i, 'Please provide a valid email']
  },
  usherCount: {
    type: Number,
    min: [1, 'At least 1 usher required'],
    default: 1
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  ushers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  images: [{
    type: String  // URLs of event images
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
eventSchema.index({ date: 1, status: 1 });

module.exports = mongoose.model('Event', eventSchema);