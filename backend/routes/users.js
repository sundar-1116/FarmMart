const express = require('express');
const router = express.Router();
const { getUsers, getUserById, updateUserRole } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// Protect all routes
router.use(authMiddleware);

router.route('/')
  .get(requireRole('admin'), getUsers);

router.route('/:id')
  .get(requireRole('admin'), getUserById);

router.route('/:id/role')
  .put(requireRole('admin'), updateUserRole);

module.exports = router;
