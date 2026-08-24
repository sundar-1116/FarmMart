const { analyzeSemantics } = require('./semanticUnderstanding');

const APPROVED_INTENTS = [
  'pending_procurement_tasks',
  'procured_tasks',
  'latest_procured_task',
  'pending_offers',
  'open_demands',
  'nearest_deadline',
  'task_value',
  'task_status',
  'next_action',
  'procurement_summary',
  'payment_summary',
  'delivery_summary',
  'pending_payments',
  'pending_deliveries',
  'assigned_tasks',
  'latest_task',
  'demand_summary',
  'system_overview',
  'offer_summary',
  'user_summary',
  'task_summary',
  'pending_operations',
  'latest_activity',
  'clarification_required',
  'general_farmmart_question'
];

exports.APPROVED_INTENTS = APPROVED_INTENTS;

/**
 * High-level intent router delegating to semantic understanding.
 */
exports.detectIntent = (prompt, conversation = [], role = 'farmer') => {
  const semanticResult = analyzeSemantics(prompt, conversation, role);
  return semanticResult.intent;
};

/**
 * Returns full semantic analysis output object.
 */
exports.analyzeSemantics = (prompt, conversation = [], role = 'farmer') => {
  return analyzeSemantics(prompt, conversation, role);
};
