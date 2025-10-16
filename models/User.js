const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^[\w-\.+]+@[\w-]+(\.\w+)+$/i, 'Please provide a valid email']  // FIXED - removed double backslash
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['usher', 'admin'],
    default: 'usher'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVisibleOnWebsite: {
    type: Boolean,
    default: true,
    index: true
  },
  lastLogin: {
    type: Date
  },
  signupCode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SignupCode',
    required: false
  },
  profile: {
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: ''
    },
    experience: {
      type: String,
      default: ''
    },
    skills: [{
      type: String,
      trim: true
    }],
    availability: {
      type: Boolean,
      default: true
    },
    profileImage: {
      type: String,
      default: ''
    },
    profileImageRejected: {
      type: Boolean,
      default: false
    },
    profileImageRejectionReason: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    },
    location: {
      type: String,
      default: ''
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save hash
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    if (this.password && this.password.startsWith('$2')) {
      console.log('🔐 Password already hashed, skipping re-hash');
      return next();
    }
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    console.error('❌ Password hashing error:', error);
    next(error);
  }
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    if (!this.password) {
      throw new Error('No password stored for this user');
    }
    if (!candidatePassword) {
      throw new Error('No candidate password provided');
    }
    if (!this.password.startsWith('$2')) {
      throw new Error('Invalid password format in database');
    }
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
  } catch (error) {
    console.error('🔍 Password comparison details:', {
      hasStoredPassword: !!this.password,
      storedFormat: this.password ? this.password.substring(0, 5) : 'none',
      error: error.message
    });
    throw new Error('Password comparison failed: ' + error.message);
  }
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.name}`;
});

// Indexes for efficient queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1, isActive: 1, isVisibleOnWebsite: 1 });

module.exports = mongoose.model('User', userSchema);
