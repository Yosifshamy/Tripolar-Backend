const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SignupCode = require('../models/SignupCode');
const { sendWelcomeEmail } = require('../utils/sendEmail');
const path = require('path');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });
};

// Login user (admin or usher)
// POST /api/auth/login
// Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt for:', email);

    const user = await User.findOne({ email, isActive: true }).select('+password');
    if (!user) {
      console.log('❌ User not found or inactive');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log('❌ Invalid password');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if usher needs to upload profile picture
    const needsProfilePicture = user.role === 'usher' && !user.profile?.profileImage;

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    console.log('✅ Login successful for:', email);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      needsProfilePicture,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// Register new usher with signup code and profile picture
// POST /api/auth/register
// Public
const register = async (req, res) => {
  try {
    const { name, email, password, signupCode } = req.body;

    console.log('📝 Registration attempt:', { name, email, hasCode: !!signupCode, hasFile: !!req.file });

    // Validate required fields
    if (!name || !email || !password || !signupCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields: name, email, password, and signup code' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Verify signup code
    const code = await SignupCode.findOne({ 
      code: signupCode.toUpperCase(),
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired signup code' 
      });
    }

    // Handle profile image if uploaded
    let profileImagePath = '';
    if (req.file) {
      // Store relative path for serving via Express
      profileImagePath = `/uploads/profiles/${req.file.filename}`;
      console.log('✅ Profile image uploaded:', profileImagePath);
    }

    // Create new usher
    const user = new User({
      name,
      email,
      password,
      role: 'usher',
      signupCode: code._id,
      profile: {
        profileImage: profileImagePath
      }
    });

    await user.save();

    // Mark code as used
    code.isUsed = true;
    code.usedBy = user._id;
    code.usedAt = new Date();
    await code.save();

    console.log('✅ User registered successfully:', email);

    // Send welcome email (non-critical)
    try {
      await sendWelcomeEmail(user);
      console.log('✅ Welcome email sent');
    } catch (emailError) {
      console.error('⚠️ Welcome email failed (non-critical):', emailError.message);
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    
    // Send detailed error message
    let errorMessage = 'Server error during registration';
    
    if (error.name === 'ValidationError') {
      errorMessage = Object.values(error.errors).map(e => e.message).join(', ');
    } else if (error.code === 11000) {
      errorMessage = 'Email already registered';
    }
    
    res.status(500).json({ 
      success: false, 
      message: errorMessage,
      details: error.message 
    });
  }
};

// Get current user
// GET /api/auth/me
// Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Logout user (client-side token removal)
// POST /api/auth/logout
// Private
const logout = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Server error during logout' });
  }
};

// Update user profile
// PUT /api/auth/profile
// Private
const updateProfile = async (req, res) => {
  try {
    const { name, profile } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Handle profile image if uploaded
    if (req.file) {
      const profileImagePath = `/uploads/profiles/${req.file.filename}`;
      if (!profile) {
        req.body.profile = {};
      }
      req.body.profile.profileImage = profileImagePath;
      
      // Clear rejection flags when new image is uploaded
      req.body.profile.profileImageRejected = false;
      req.body.profile.profileImageRejectionReason = '';
      
      console.log('✅ Profile image updated:', profileImagePath);
    }

    // Update fields
    if (name) user.name = name;
    if (profile) {
      user.profile = { ...user.profile.toObject(), ...profile };
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
};

module.exports = {
  login,
  register,
  getMe,
  logout,
  updateProfile
};
