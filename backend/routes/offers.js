const express = require('express');
const router = express.Router();
const { getOffers, getOfferById, createOffer, updateOffer, deleteOffer } = require('../controllers/offerController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// Protect all routes
router.use(authMiddleware);

router.route('/')
  .get(requireRole('buyer', 'farmer', 'admin'), getOffers)
  .post(requireRole('buyer', 'farmer'), createOffer);

router.route('/:id')
  .get(requireRole('buyer', 'farmer', 'admin'), getOfferById)
  .put(requireRole('buyer', 'farmer'), updateOffer)
  .delete(requireRole('admin'), deleteOffer);

module.exports = router;
