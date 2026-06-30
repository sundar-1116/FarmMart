const express = require('express');
const router = express.Router();
const { getTasks, createTask, updateTaskPayment, updateTaskDelivery, getTaskStats, updateTask } = require('../controllers/taskController');

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
