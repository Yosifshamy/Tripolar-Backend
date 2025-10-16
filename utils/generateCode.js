const crypto = require('crypto');

/**
 * Generate a unique signup code
 * @param {number} length - Length of the code (default: 8)
 * @returns {string} - Generated code
 */
const generateSignupCode = (length = 8) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return result;
};

/**
 * Generate a secure random code with timestamp
 * @returns {string} - Generated code with timestamp prefix
 */
const generateTimestampedCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `BP${timestamp}${random}`;
};

/**
 * Validate code format
 * @param {string} code - Code to validate
 * @returns {boolean} - Whether code is valid format
 */
const isValidCodeFormat = (code) => {
  // Check if code is 6-20 characters, alphanumeric
  const codeRegex = /^[A-Z0-9]{6,20}$/;
  return codeRegex.test(code);
};

module.exports = {
  generateSignupCode,
  generateTimestampedCode,
  isValidCodeFormat
};