/**
 * Conversation Manager for FarmMart AI Core (M8.2 + M8.3).
 * Extracts entity memory (tasks, demands, offers) from recent conversation history
 * and resolves indirect references ("it", "that", "this task", "which one", "the other one", "urgent").
 */

/**
 * Extracts entity IDs and references from recent conversation messages.
 */
exports.extractConversationState = (conversation = []) => {
  const state = {
    lastTaskId: null,
    lastDemandId: null,
    lastOfferId: null,
    lastIntent: null,
    lastTaskName: null,
    recentTasks: [],
    recentDemands: [],
    recentOffers: []
  };

  if (!Array.isArray(conversation) || conversation.length === 0) {
    return state;
  }

  // Iterate backwards through conversation turns
  for (let i = conversation.length - 1; i >= 0; i--) {
    const msg = conversation[i];
    const text = msg.content || msg.text || '';

    // Check if assistant response contained references or item names
    if (msg.role === 'assistant' || msg.sender === 'ai') {
      if (msg.references || msg.referencedIds) {
        const refs = msg.references || msg.referencedIds;
        if (refs.tasks && refs.tasks.length > 0 && !state.lastTaskId) {
          state.lastTaskId = refs.tasks[0];
          state.recentTasks = refs.tasks;
        }
        if (refs.demands && refs.demands.length > 0 && !state.lastDemandId) {
          state.lastDemandId = refs.demands[0];
          state.recentDemands = refs.demands;
        }
        if (refs.offers && refs.offers.length > 0 && !state.lastOfferId) {
          state.lastOfferId = refs.offers[0];
          state.recentOffers = refs.offers;
        }
      }

      if (msg.intent && !state.lastIntent) {
        state.lastIntent = msg.intent;
      }
    }
  }

  return state;
};

/**
 * Resolves indirect references in user prompts using conversation state.
 */
exports.resolveReference = (prompt, conversationState = {}) => {
  const lower = (prompt || '').toLowerCase().trim();

  // "how much is that worth?", "price of that", "how much is it?", "value of this task"
  const isWorthQuery = /how.*much|worth|price|value/i.test(lower);
  // "when is it due?", "deadline", "when?"
  const isDeadlineQuery = /when|deadline|due/i.test(lower);
  // "the other one", "next one", "second one"
  const isOtherQuery = /other.*one|second.*one|next.*one/i.test(lower);
  // "which one", "this one", "that task", "it", "that"
  const isSpecificReference = /which.*one|this.*one|that|it\b|this\b/i.test(lower);

  let targetTaskId = null;

  if (isOtherQuery && conversationState.recentTasks && conversationState.recentTasks.length > 1) {
    targetTaskId = conversationState.recentTasks[1];
  } else if (conversationState.lastTaskId) {
    targetTaskId = conversationState.lastTaskId;
  }

  return {
    isWorthQuery,
    isDeadlineQuery,
    isOtherQuery,
    isSpecificReference,
    targetTaskId
  };
};
