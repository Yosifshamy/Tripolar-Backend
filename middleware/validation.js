const { body, validationResult } = require('express-validator');

// Validate login input
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Login validation failed:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

// Validate usher registration - REMOVED STRICT PASSWORD REQUIREMENTS
const validateUsherRegistration = [
  body('name')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .trim(),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters'),
    // REMOVED: .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)/)
    // Now just needs to be 6+ characters
  body('signupCode')
    .isLength({ min: 6, max: 10 })
    .withMessage('Signup code must be between 6 and 10 characters')
    .trim()
    .toUpperCase(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Registration validation failed:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

// Validate profile update
const validateProfileUpdate = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .trim(),
  body('profile.bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters')
    .trim(),
  body('profile.experience')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Experience cannot exceed 100 characters')
    .trim(),
  body('profile.phone')
    .optional()
    .matches(/^[+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('profile.skills')
    .optional()
    .isArray({ min: 1, max: 10 })
    .withMessage('Skills must be an array with 1-10 items'),
  body('profile.skills.*')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Each skill must be between 2 and 50 characters')
    .trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Profile update validation failed:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

module.exports = {
  validateLogin,
  validateUsherRegistration,
  validateProfileUpdate
};