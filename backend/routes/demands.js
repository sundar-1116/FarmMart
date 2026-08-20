const express = require('express');
const router = express.Router();
const { getDemands, createDemand, updateDemand } = require('../controllers/demandController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// Protect all routes in this router
router.use(authMiddleware);

router.route('/')
  .get(requireRole('buyer', 'farmer', 'admin'), getDemands)
  .post(requireRole('admin'), createDemand);

router.route('/:id')
  .put(requireRole('buyer', 'admin'), updateDemand);

module.exports = router;
