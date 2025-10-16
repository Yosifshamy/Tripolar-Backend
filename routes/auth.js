const express = require('express');
const router = express.Router();
const { 
  login, 
  register, 
  getMe, 
  logout, 
  updateProfile 
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { 
  validateLogin, 
  validateUsherRegistration,
  validateProfileUpdate 
} = require('../middleware/validation');
const upload = require('../middleware/upload'); // ADD THIS

// @route   POST /api/auth/login
router.post('/login', validateLogin, login);

// @route   POST /api/auth/register - ADD upload.single('profileImage')
router.post('/register', upload.single('profileImage'), validateUsherRegistration, register);

// @route   GET /api/auth/me
router.get('/me', authenticateToken, getMe);

// @route   POST /api/auth/logout
router.post('/logout', authenticateToken, logout);

// @route   PUT /api/auth/profile - ADD upload.single('profileImage')
router.put('/profile', authenticateToken, upload.single('profileImage'), validateProfileUpdate, updateProfile);

module.exports = router;