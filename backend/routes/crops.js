const express = require('express');
const router = express.Router();
const { getCrops, getCropById, createCrop, updateCrop, deleteCrop } = require('../controllers/cropController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// Protect all routes in this router
router.use(authMiddleware);

router.route('/')
  .get(requireRole('buyer', 'farmer', 'admin'), getCrops)
  .post(requireRole('farmer', 'admin'), createCrop);

router.route('/:id')
  .get(requireRole('buyer', 'farmer', 'admin'), getCropById)
  .put(requireRole('farmer', 'admin'), updateCrop)
  .delete(requireRole('farmer', 'admin'), deleteCrop);

module.exports = router;
