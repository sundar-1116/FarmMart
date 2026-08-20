const express = require('express');
const router = express.Router();
const { getTasks, createTask, updateTaskPayment, updateTaskDelivery, getTaskStats, updateTask } = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// Protect all routes in this router
router.use(authMiddleware);
router.use(requireRole('buyer', 'admin'));

router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/stats')
  .get(getTaskStats);

router.route('/:id')
  .put(updateTask);

router.route('/:id/payment')
  .put(updateTaskPayment);

router.route('/:id/delivery')
  .put(updateTaskDelivery);

module.exports = router;
