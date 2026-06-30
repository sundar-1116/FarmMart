const express = require('express');
const router = express.Router();
const { getDemands, createDemand, updateDemand } = require('../controllers/demandController');

router.route('/')
  .get(getDemands)
  .post(createDemand);

router.route('/:id')
  .put(updateDemand);

module.exports = router;
