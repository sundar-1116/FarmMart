const { extractConversationState } = require('./conversationManager');

/**
 * Intermediate Semantic Understanding Engine for FarmMart AI (M8.4 Conversation Quality Fix).
 * Parses natural language, synonyms, short queries, analytical objectives,
 * and context references into a validated structured representation.
 */
exports.analyzeSemantics = (prompt, conversation = [], role = 'farmer') => {
  const cleanPrompt = (prompt || '').trim();
  const lower = cleanPrompt.toLowerCase();
  const state = extractConversationState(conversation);

  let intent = 'general_farmmart_question';
  let entityType = 'task';
  let entityReference = null;
  let targetTaskId = state.lastTaskId;
  let requiresClarification = false;
  let clarificationMessage = null;
  let confidence = 0.90;

  // ── 1. Ambiguous Short Query Clarification Handling (No Context Case) ──
  if (lower === 'latest' || lower === 'latest one' || lower === 'the latest') {
    if (state.lastIntent) {
      intent = state.lastIntent.includes('procure') ? 'latest_procured_task' : 'latest_task';
    } else if (role === 'farmer') {
      intent = 'latest_procured_task';
    } else if (role === 'buyer') {
      intent = 'latest_task';
    } else {
      requiresClarification = true;
      clarificationMessage = 'Latest what — procurement, offer, demand, payment, or delivery?';
    }
  } else if (lower === 'how much' || lower === 'how much?' || lower === 'price' || lower === 'worth') {
    if (state.lastTaskId) {
      intent = 'task_value';
      targetTaskId = state.lastTaskId;
    } else {
      requiresClarification = true;
      clarificationMessage = 'Which procurement or task would you like the value for?';
    }
  } else if (lower === 'the other one' || lower === 'the other' || lower === 'other one') {
    if (state.recentTasks && state.recentTasks.length > 1) {
      intent = 'task_value';
      targetTaskId = state.recentTasks[1];
    } else {
      requiresClarification = true;
      clarificationMessage = 'Which task or procurement are you referring to?';
    }
  } else if (lower === 'when' || lower === 'when?' || lower === 'when is it due?') {
    if (state.lastTaskId) {
      intent = 'nearest_deadline';
      targetTaskId = state.lastTaskId;
    } else {
      requiresClarification = true;
      clarificationMessage = 'Which task deadline would you like to check?';
    }
  }

  if (requiresClarification) {
    return {
      intent: 'clarification_required',
      entityType: null,
      entityReference: null,
      targetTaskId: null,
      requiresClarification: true,
      clarificationMessage,
      confidence: 1.0
    };
  }

  // ── 2. Reference Resolution with Conversation Context ──
  if (/other.*one|the.*other/i.test(lower)) {
    if (state.recentTasks && state.recentTasks.length > 1) {
      intent = 'task_value';
      targetTaskId = state.recentTasks[1];
      confidence = 0.95;
    } else {
      requiresClarification = true;
      clarificationMessage = 'Which task or procurement are you referring to?';
      return {
        intent: 'clarification_required',
        entityType: null,
        entityReference: null,
        targetTaskId: null,
        requiresClarification: true,
        clarificationMessage,
        confidence: 1.0
      };
    }
  }

  // ── 3. Analytical & Next Action Priority Queries ──
  else if (
    /what.*next/i.test(lower) ||
    /next.*action/i.test(lower) ||
    /what.*should.*i.*do/i.test(lower) ||
    /what.*to.*do/i.test(lower) ||
    /what.*should.*i.*focus.*on/i.test(lower) ||
    /what.*needs.*my.*attention/i.test(lower) ||
    /what.*needs.*attention/i.test(lower) ||
    /which.*task.*should.*i.*handle/i.test(lower) ||
    /anything.*urgent/i.test(lower) ||
    /what.*am.*i.*waiting.*for/i.test(lower) ||
    /what.*is.*blocking.*me/i.test(lower) ||
    /what.*should.*i.*handle.*first/i.test(lower)
  ) {
    intent = 'next_action';
    confidence = 0.96;
  }

  // ── 4. Latest Procured / Latest Task Query ──
  else if (
    /latest.*procured/i.test(lower) ||
    /most.*recent.*procurement/i.test(lower) ||
    /show.*my.*latest.*procurement/i.test(lower) ||
    /latest.*procurement/i.test(lower) ||
    /what.*did.*i.*procure.*recently/i.test(lower) ||
    /what.*did.*i.*source.*last/i.test(lower) ||
    /what.*was.*my.*most.*recent.*procurement/i.test(lower) ||
    /which.*task.*did.*i.*procure.*last/i.test(lower) ||
    /which.*one.*is.*the.*latest/i.test(lower) ||
    /the.*last.*thing.*i.*sourced/i.test(lower) ||
    /last.*completed.*procurement/i.test(lower) ||
    (lower.includes('latest') && (lower.includes('which') || lower.includes('procure') || lower.includes('source') || (state.lastIntent && state.lastIntent.includes('procure'))))
  ) {
    intent = role === 'buyer' ? 'latest_task' : 'latest_procured_task';
    entityReference = 'latest';
    confidence = 0.98;
  }

  // ── 5. Active Demands / Demand Summary ──
  else if (
    /active.*demand/i.test(lower) ||
    /open.*demand/i.test(lower) ||
    /store.*demand/i.test(lower) ||
    /available.*demand/i.test(lower) ||
    /show.*demand/i.test(lower) ||
    /my.*demand/i.test(lower)
  ) {
    intent = 'open_demands';
    entityType = 'demand';
    confidence = 0.95;
  }

  // ── 6. Buyer Pending Payments ──
  else if (
    /pending.*payment/i.test(lower) ||
    /payments.*pending/i.test(lower) ||
    /what.*payments.*are.*pending/i.test(lower) ||
    /unpaid/i.test(lower)
  ) {
    intent = 'pending_payments';
    confidence = 0.96;
  }

  // ── 7. Buyer Pending Deliveries ──
  else if (
    /pending.*deliver/i.test(lower) ||
    /deliveries.*need.*attention/i.test(lower) ||
    /deliveries.*pending/i.test(lower) ||
    /in.*transit/i.test(lower)
  ) {
    intent = 'pending_deliveries';
    confidence = 0.96;
  }

  // ── 8. Procurement Summary / Marketplace Summary ──
  else if (
    /procurement.*summary/i.test(lower) ||
    /marketplace.*summary/i.test(lower) ||
    /work.*summary/i.test(lower)
  ) {
    intent = role === 'admin' ? 'marketplace_summary' : 'procurement_summary';
    confidence = 0.95;
  }

  // ── 9. Procured Tasks ──
  else if (
    /procured.*tasks/i.test(lower) ||
    /completed.*procurement/i.test(lower) ||
    /all.*my.*procurements/i.test(lower) ||
    /crops.*i.*procured/i.test(lower)
  ) {
    intent = 'procured_tasks';
    confidence = 0.95;
  }

  // ── 10. Active Procurement Tasks / Pending Tasks ──
  else if (
    /active.*procurement.*task/i.test(lower) ||
    /pending.*procurement/i.test(lower) ||
    /procurement.*tasks.*wait/i.test(lower) ||
    /tasks.*wait.*for.*me/i.test(lower) ||
    /what.*is.*still.*waiting/i.test(lower) ||
    /anything.*waiting/i.test(lower) ||
    (lower.includes('pending') && !lower.includes('payment') && !lower.includes('offer'))
  ) {
    intent = role === 'farmer' ? 'pending_procurement_tasks' : (role === 'buyer' ? 'assigned_tasks' : 'task_summary');
    confidence = 0.95;
  }

  // ── 11. Recent Activity ──
  else if (/recent.*activity/i.test(lower) || /latest.*activity/i.test(lower)) {
    intent = 'latest_activity';
    confidence = 0.96;
  }

  // ── 12. System Overview ──
  else if (/system.*overview|admin.*overview|platform.*stats/i.test(lower)) {
    intent = 'system_overview';
    confidence = 0.98;
  }

  // ── 13. Nearest / Earliest Deadline ──
  else if (
    /earliest.*deadline/i.test(lower) ||
    /nearest.*deadline/i.test(lower) ||
    /deadline.*first/i.test(lower) ||
    /due.*soonest/i.test(lower) ||
    /which.*one.*is.*urgent/i.test(lower) ||
    /which.*one.*is.*due.*first/i.test(lower) ||
    /when.*is.*it.*due/i.test(lower) ||
    /urgent/i.test(lower)
  ) {
    intent = 'nearest_deadline';
    confidence = 0.96;
  }

  // ── 14. Task Value / Purchase Worth ──
  else if (
    /how.*much.*worth/i.test(lower) ||
    /how.*much.*is.*that/i.test(lower) ||
    /purchase.*value/i.test(lower) ||
    /how.*much.*was.*it/i.test(lower) ||
    /how.*much.*is.*it/i.test(lower) ||
    /price.*of.*that/i.test(lower) ||
    /value.*of.*that/i.test(lower) ||
    /how.*much/i.test(lower)
  ) {
    intent = 'task_value';
    confidence = 0.95;
  }

  // ── 15. Pending Offers ──
  else if (
    /pending.*offer/i.test(lower) ||
    /active.*offer/i.test(lower) ||
    /offers.*pending/i.test(lower) ||
    /bids/i.test(lower)
  ) {
    intent = 'pending_offers';
    entityType = 'offer';
    confidence = 0.95;
  }

  return {
    intent,
    entityType,
    entityReference,
    targetTaskId,
    requiresClarification: false,
    clarificationMessage: null,
    confidence
  };
};
