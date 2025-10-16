const express = require('express');
const router = express.Router();

console.log('🔧 Loading minimal codes route...');

const verifyCode = (req, res) => {
  console.log('🔍 POST /api/codes/verify called with:', req.body);
  const { code } = req.body;

  // Simple verification - accept any 6+ character code
  const isValid = code && code.length >= 6;

  res.json({
    success: true,
    isValid,
    message: isValid ? 'Code is valid (placeholder)' : 'Code is invalid (placeholder)'
  });
};

const getAllCodes = (req, res) => {
  console.log('📋 GET /api/codes/ called');
  res.json({
    success: true,
    codes: [
      {
        id: '1',
        code: 'SAMPLE123',
        isUsed: false,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date()
      }
    ],
    message: 'Sample codes data (placeholder)'
  });
};

const generateCode = (req, res) => {
  console.log('🔑 POST /api/codes/generate called');
  const newCode = 'CODE' + Math.random().toString(36).substr(2, 6).toUpperCase();

  res.json({
    success: true,
    code: {
      id: 'new-code-' + Date.now(),
      code: newCode,
      isUsed: false,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date()
    },
    message: `Code ${newCode} generated successfully (placeholder)`
  });
};

const deleteCode = (req, res) => {
  console.log('🗑️ DELETE /api/codes/:id called with ID:', req.params.id);
  res.json({
    success: true,
    message: `Code ${req.params.id} deleted successfully (placeholder)`
  });
};

// Auth bypass
const authBypass = (req, res, next) => {
  req.user = { id: 'test-admin', role: 'admin' };
  next();
};

// Routes
router.post('/verify', verifyCode);
router.get('/', authBypass, getAllCodes);
router.post('/generate', authBypass, generateCode);
router.delete('/:id', authBypass, deleteCode);

console.log('✅ Codes routes loaded successfully');

module.exports = router;