const express = require('express');
const router = express.Router();
const { registerUser, loginUser, updateProfile, changePassword, forgotPassword, resetPassword } = require('../controllers/authController');

// Signup endpoint
router.post('/signup', registerUser);

// Login endpoint
router.post('/login', loginUser);

// Profile endpoints
router.put('/profile', updateProfile);
router.post('/password', changePassword);

// Forgot & Reset password endpoints
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
