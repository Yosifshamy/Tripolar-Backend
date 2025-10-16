const User = require('../models/User');
const { uploadImage } = require('../utils/cloudinary');

// @desc    Get all active ushers
// @route   GET /api/ushers
// @access  Public
const getUshers = async (req, res) => {
  try {
    const ushers = await User.find({ 
      role: 'usher', 
      isActive: true,
      'profile.availability': true 
    })
    .select('-password -email')
    .sort('name');

    res.json({
      success: true,
      ushers
    });
  } catch (error) {
    console.error('Get ushers error:', error);
    res.status(500).json({ message: 'Error fetching ushers' });
  }
};

// @desc    Get single usher
// @route   GET /api/ushers/:id
// @access  Public
const getUsher = async (req, res) => {
  try {
    const usher = await User.findOne({ 
      _id: req.params.id,
      role: 'usher',
      isActive: true 
    })
    .select('-password -email');

    if (!usher) {
      return res.status(404).json({ message: 'Usher not found' });
    }

    res.json({
      success: true,
      usher
    });
  } catch (error) {
    console.error('Get usher error:', error);
    res.status(500).json({ message: 'Error fetching usher' });
  }
};

// @desc    Update usher own profile
// @route   PUT /api/ushers/profile
// @access  Private/Usher
const updateUsherProfile = async (req, res) => {
  try {
    const { name, profile } = req.body;

    const usher = await User.findById(req.user.id);
    if (!usher || usher.role !== 'usher') {
      return res.status(404).json({ message: 'Usher not found' });
    }

    // Update basic info
    if (name) usher.name = name;

    // Update profile info
    if (profile) {
      usher.profile = { ...usher.profile.toObject(), ...profile };
    }

    await usher.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      usher: {
        id: usher._id,
        name: usher.name,
        role: usher.role,
        profile: usher.profile
      }
    });
  } catch (error) {
    console.error('Update usher profile error:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
};

// @desc    Upload usher profile image
// @route   POST /api/ushers/profile/image
// @access  Private/Usher
const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const usher = await User.findById(req.user.id);
    if (!usher || usher.role !== 'usher') {
      return res.status(404).json({ message: 'Usher not found' });
    }

    // Upload to Cloudinary
    const uploadResult = await uploadImage(req.file.buffer, 'bipolar/ushers');

    // Update user profile
    usher.profile.profileImage = uploadResult.secure_url;
    await usher.save();

    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      imageUrl: uploadResult.secure_url
    });
  } catch (error) {
    console.error('Upload profile image error:', error);
    res.status(500).json({ message: 'Error uploading profile image' });
  }
};

module.exports = {
  getUshers,
  getUsher,
  updateUsherProfile,
  uploadProfileImage
};