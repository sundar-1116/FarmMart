const express = require('express');
const router = express.Router();
const { askAssistant } = require('../controllers/aiController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// Protect all AI routes
router.use(authMiddleware);
router.use(requireRole('buyer', 'farmer', 'admin'));

router.post('/assistant', askAssistant);

module.exports = router;
