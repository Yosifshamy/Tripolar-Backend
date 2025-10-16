const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

const router = express.Router();
console.log('🔧 Loading ushers routes with visibility control...');

// GET /api/ushers - Get all VISIBLE ushers (public, for website)
router.get('/', async (req, res) => {
  try {
    const ushers = await User.find({ 
      role: 'usher', 
      isActive: true,
      isVisibleOnWebsite: true  // NEW: Only show visible ushers
    })
      .select('-password')
      .populate('signupCode', 'code');
    res.json({
      success: true,
      ushers,
      count: ushers.length,
      message: 'Public ushers (visible only)'
    });
  } catch (error) {
    console.error('Get visible ushers error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching ushers' });
  }
});

// GET /api/ushers/:id - Get single usher (only if visible)
router.get('/:id', async (req, res) => {
  try {
    const usher = await User.findOne({
      _id: req.params.id,
      role: 'usher',
      isActive: true,
      isVisibleOnWebsite: true  // NEW: Only show if visible
    })
      .select('-password')
      .populate('signupCode', 'code');
    if (!usher) {
      return res.status(404).json({ success: false, message: 'Usher not found or not available' });
    }
    res.json({ success: true, usher });
  } catch (error) {
    console.error('Get usher error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/ushers/:id - Update usher (admin only) - EXISTING, NO CHANGES
router.put('/:id', authenticateToken, [
  body('name').optional().isLength({ min: 2, max: 50 }).trim(),
  body('profile.bio').optional().isLength({ max: 500 }).trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  try {
    const usher = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { ...req.body, profile: { ...req.body.profile } } },
      { new: true, runValidators: true }
    ).select('-password');
    if (!usher || usher.role !== 'usher') {
      return res.status(404).json({ success: false, message: 'Usher not found' });
    }
    res.json({ success: true, message: 'Usher updated', usher });
  } catch (error) {
    console.error('Update usher error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/ushers/:id - Delete usher (admin only) - EXISTING, NO CHANGES
router.delete('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  try {
    const usher = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },  // Soft delete
      { new: true }
    );
    if (!usher || usher.role !== 'usher') {
      return res.status(404).json({ success: false, message: 'Usher not found' });
    }
    res.json({ success: true, message: 'Usher deactivated' });
  } catch (error) {
    console.error('Delete usher error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/ushers/profile/me - EXISTING, NO CHANGES
router.get('/profile/me', authenticateToken, async (req, res) => {
  if (req.user.role !== 'usher') {
    return res.status(403).json({ success: false, message: 'Usher access required' });
  }
  try {
    const profile = await User.findById(req.user.id).select('-password');
    res.json({ success: true, profile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/ushers/profile/me - EXISTING, NO CHANGES
router.put('/profile/me', authenticateToken, [
  body('name').optional().isLength({ min: 2, max: 50 }).trim(),
  body('profile.bio').optional().isLength({ max: 500 }).trim(),
  body('profile.skills').optional().isArray({ max: 10 }),
  body('profile.skills.*').optional().isLength({ min: 2, max: 50 }).trim(),
  body('profile.availability').optional().isBoolean()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  if (req.user.role !== 'usher') {
    return res.status(403).json({ success: false, message: 'Usher access required' });
  }
  try {
    const profile = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { ...req.body, profile: { ...req.body.profile } } },
      { new: true, runValidators: true }
    ).select('-password');
    res.json({ success: true, message: 'Profile updated', profile });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

console.log('✅ Ushers routes loaded with visibility control');
module.exports = router;