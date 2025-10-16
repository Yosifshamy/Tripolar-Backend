const User = require('../models/User');
const SignupCode = require('../models/SignupCode');
const Event = require('../models/Event'); // If you have events
const fs = require('fs');
const path = require('path');

// @desc Get dashboard statistics
// @route GET /api/admin/dashboard
const getDashboardStats = async (req, res) => {
  try {
    console.log('📊 Fetching dashboard stats for admin:', req.user.email);

    // Count users
    const totalUshers = await User.countDocuments({ role: 'usher', isActive: true });
    const activeUshers = await User.countDocuments({
      role: 'usher',
      isActive: true,
      'profile.availability': true
    });

    // Count signup codes
    const availableCodes = await SignupCode.countDocuments({ isUsed: false });
    const usedCodes = await SignupCode.countDocuments({ isUsed: true });

    // Count events (if Event model exists)
    let totalEvents = 0;
    try {
      totalEvents = await Event.countDocuments();
    } catch (error) {
      console.warn('Events count unavailable:', error.message);
    }

    // Pending requests (placeholder for now)
    const pendingRequests = 0;

    const stats = {
      totalUshers,
      activeUshers,
      totalEvents,
      pendingRequests,
      availableCodes,
      usedCodes
    };

    console.log('Dashboard stats:', stats);

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard stats',
      error: error.message
    });
  }
};

// @desc Generate new signup code
// @route POST /api/admin/codes/generate
const generateSignupCode = async (req, res) => {
  try {
    console.log('🔑 Generating signup code by admin:', req.user.email);

    // Generate random code
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Ensure code is unique
    let existingCode = await SignupCode.findOne({ code });
    while (existingCode) {
      code = '';
      for (let i = 0; i < 8; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      existingCode = await SignupCode.findOne({ code });
    }

    // Create signup code
    const signupCode = new SignupCode({
      code,
      createdBy: req.user._id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });

    await signupCode.save();

    console.log('✅ Generated signup code:', code);

    res.status(201).json({
      success: true,
      message: 'Signup code generated successfully',
      signupCode
    });

  } catch (error) {
    console.error('Generate signup code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating signup code',
      error: error.message
    });
  }
};

// @desc Get all signup codes
// @route GET /api/admin/codes
const getSignupCodes = async (req, res) => {
  try {
    console.log('📋 Fetching signup codes for admin:', req.user.email);

    const codes = await SignupCode.find({})
      .populate('createdBy', 'name email')
      .populate('usedBy', 'name email')
      .sort({ createdAt: -1 });

    console.log(`Found ${codes.length} signup codes`);

    res.json({
      success: true,
      codes
    });

  } catch (error) {
    console.error('Get signup codes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching signup codes',
      error: error.message
    });
  }
};

// @desc Delete signup code
// @route DELETE /api/admin/codes/:id
const deleteSignupCode = async (req, res) => {
  try {
    const codeId = req.params.id;
    console.log('🗑️ Deleting signup code:', codeId, 'by admin:', req.user.email);

    const code = await SignupCode.findById(codeId);

    if (!code) {
      return res.status(404).json({
        success: false,
        message: 'Signup code not found'
      });
    }

    if (code.isUsed) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete used signup code'
      });
    }

    await SignupCode.findByIdAndDelete(codeId);

    console.log('✅ Deleted signup code:', code.code);

    res.json({
      success: true,
      message: 'Signup code deleted successfully'
    });

  } catch (error) {
    console.error('Delete signup code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting signup code',
      error: error.message
    });
  }
};

// @desc Get all ushers
// @route GET /api/admin/ushers
const getAllUshers = async (req, res) => {
  try {
    console.log('👥 Fetching all ushers for admin:', req.user.email);

    const { page = 1, limit = 10, search = '' } = req.query;

    const query = { role: 'usher' }; // REMOVED isActive filter to show all ushers

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const ushers = await User.find(query)
      .select('-password')
      .populate('signupCode', 'code')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    console.log(`Found ${ushers.length} ushers (${total} total)`);

    res.json({
      success: true,
      ushers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUshers: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get all ushers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching ushers',
      error: error.message
    });
  }
};

// @desc Update usher
// @route PUT /api/admin/ushers/:id
const updateUsher = async (req, res) => {
  try {
    const usherId = req.params.id;
    const updates = req.body;

    console.log('📝 Updating usher:', usherId, 'by admin:', req.user.email);

    // Prevent updating password through this route
    delete updates.password;

    // Prevent role changes (keep as usher)
    delete updates.role;

    const usher = await User.findOne({ _id: usherId, role: 'usher' });

    if (!usher) {
      return res.status(404).json({
        success: false,
        message: 'Usher not found'
      });
    }

    // Update allowed fields including isVisibleOnWebsite
    const allowedUpdates = ['name', 'isActive', 'isVisibleOnWebsite', 'profile'];
    const updateData = {};

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });

    const updatedUsher = await User.findByIdAndUpdate(
      usherId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    console.log('✅ Updated usher:', updatedUsher.name);

    res.json({
      success: true,
      message: 'Usher updated successfully',
      usher: updatedUsher
    });

  } catch (error) {
    console.error('Update usher error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating usher',
      error: error.message
    });
  }
};

// @desc Delete/deactivate usher
// @route DELETE /api/admin/ushers/:id
const deleteUsher = async (req, res) => {
  try {
    const usherId = req.params.id;
    console.log('🗑️ Deleting usher:', usherId, 'by admin:', req.user.email);

    const usher = await User.findOne({ _id: usherId, role: 'usher' });

    if (!usher) {
      return res.status(404).json({
        success: false,
        message: 'Usher not found'
      });
    }

    // Actually delete the usher
    await User.findByIdAndDelete(usherId);

    console.log('✅ Deleted usher:', usher.name);

    res.json({
      success: true,
      message: 'Usher deleted successfully'
    });

  } catch (error) {
    console.error('Delete usher error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting usher',
      error: error.message
    });
  }
};

// NEW: Toggle usher visibility on website
// @route PATCH /api/admin/ushers/:id/toggle-visibility
const toggleUsherVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const { isVisible } = req.body;

    console.log(`👁️ Toggling visibility for usher ${id} to ${isVisible}`);

    const usher = await User.findOne({ _id: id, role: 'usher' });

    if (!usher) {
      return res.status(404).json({
        success: false,
        message: 'Usher not found'
      });
    }

    usher.isVisibleOnWebsite = isVisible;
    await usher.save();

    console.log(`✅ Usher ${usher.name} visibility set to ${isVisible}`);

    res.json({
      success: true,
      message: `Usher ${isVisible ? 'shown' : 'hidden'} on website`,
      usher: {
        id: usher._id,
        name: usher.name,
        isVisibleOnWebsite: usher.isVisibleOnWebsite
      }
    });

  } catch (error) {
    console.error('Toggle visibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error toggling visibility',
      error: error.message
    });
  }
};

// NEW: Reject usher profile picture
// @route PATCH /api/admin/ushers/:usherId/reject-picture
const rejectProfilePicture = async (req, res) => {
  try {
    const { usherId } = req.params;
    const { reason } = req.body;

    console.log(`🚫 Rejecting profile picture for usher ${usherId}`);

    const usher = await User.findOne({ _id: usherId, role: 'usher' });

    if (!usher) {
      return res.status(404).json({
        success: false,
        message: 'Usher not found'
      });
    }

    // Delete the old profile image file if it exists
    if (usher.profile?.profileImage) {
      // Strip leading '/' from stored path (e.g., '/uploads/profiles/file.jpg' -> 'uploads/profiles/file.jpg')
      const relativePath = usher.profile.profileImage.replace(/^\//, '');
      const imagePath = path.join(__dirname, '..', relativePath); // __dirname/../uploads/profiles/file.jpg

      console.log('Attempting to delete image at:', imagePath);

      try {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log('✅ Deleted profile image file:', imagePath);
        } else {
          console.log('⚠️ Image file not found (already deleted or path mismatch):', imagePath);
        }
      } catch (unlinkError) {
        console.error('⚠️ Failed to delete image file (non-critical):', unlinkError.message);
        // Continue anyway - don't fail the request
      }
    }

    // Clear the profile image and set rejection flags
    usher.profile.profileImage = '';
    usher.profile.profileImageRejected = true;
    usher.profile.profileImageRejectionReason = reason || 'Image does not meet professional standards';

    await usher.save();

    console.log(`✅ Profile picture rejected for ${usher.name}`);

    res.json({
      success: true,
      message: 'Profile picture rejected successfully. User will be prompted to upload a new one.',
      usher: {
        id: usher._id,
        name: usher.name,
        profile: usher.profile
      }
    });

  } catch (error) {
    console.error('Reject profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error rejecting profile picture',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardStats,
  generateSignupCode,
  getSignupCodes,
  deleteSignupCode,
  getAllUshers,
  updateUsher,
  deleteUsher,
  toggleUsherVisibility, // ADDED
  rejectProfilePicture // ADDED
};