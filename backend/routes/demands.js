const express = require('express');
const router = express.Router();
const { getDemands, createDemand, updateDemand } = require('../controllers/demandController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all routes in this router
router.use(authMiddleware);

router.route('/')
  .get(getDemands)
  .post(createDemand);

router.route('/:id')
  .put(updateDemand);

module.exports = router;
