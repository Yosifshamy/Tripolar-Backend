const express = require('express');
const router = express.Router();
const { 
  getDashboardStats,
  generateSignupCode,
  getSignupCodes,
  deleteSignupCode,
  getAllUshers,
  updateUsher,
  deleteUsher,
  toggleUsherVisibility,
  rejectProfilePicture
} = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Apply admin middleware to all routes
router.use(authenticateToken, requireAdmin);

// Dashboard routes
router.get('/dashboard', getDashboardStats);

// Signup code management
router.get('/codes', getSignupCodes);
router.post('/codes/generate', generateSignupCode);
router.delete('/codes/:id', deleteSignupCode);

// Usher management
router.get('/ushers', getAllUshers);
router.put('/ushers/:id', updateUsher);
router.delete('/ushers/:id', deleteUsher);
router.patch('/ushers/:id/toggle-visibility', toggleUsherVisibility);  
router.patch('/ushers/:usherId/reject-picture', rejectProfilePicture); 

module.exports = router;