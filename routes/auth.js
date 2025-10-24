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

// POST /api/auth/login
router.post('/login', validateLogin, login);

// POST /api/auth/register - ADD upload.single('profileImage')
router.post('/register', upload.single('profileImage'), validateUsherRegistration, register);

// GET /api/auth/me
router.get('/me', authenticateToken, getMe);

// POST /api/auth/logout
router.post('/logout', authenticateToken, logout);

// PUT /api/auth/profile - ADD upload.single('profileImage')
router.put('/profile', authenticateToken, upload.single('profileImage'), validateProfileUpdate, updateProfile);

module.exports = router;