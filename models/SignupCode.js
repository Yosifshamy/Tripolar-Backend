const mongoose = require('mongoose');

const signupCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    minlength: [6, 'Code must be at least 6 characters']
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  usedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  usedAt: {
    type: Date,
    required: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 'expiresAt' }
  }
}, {
  timestamps: true
});

// Index for efficient queries
signupCodeSchema.index({ code: 1 });
signupCodeSchema.index({ isUsed: 1 });
signupCodeSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('SignupCode', signupCodeSchema);