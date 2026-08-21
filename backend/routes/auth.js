const express = require('express');
const router = express.Router();
const { registerUser, loginUser, updateProfile, changePassword, forgotPassword, resetPassword, getProfile } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

// Signup endpoint (rate limited)
router.post('/signup', authLimiter, registerUser);

// Login endpoint (rate limited)
router.post('/login', authLimiter, loginUser);

// Profile endpoints (authenticated)
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.post('/password', authMiddleware, changePassword);

// Forgot & Reset password endpoints (rate limited)
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

module.exports = router;
