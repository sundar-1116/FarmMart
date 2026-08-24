const { detectIntent } = require('./intentRouter');

/**
 * Builds system prompts and structures conversation history for Gemini & AI Providers.
 */
exports.buildSystemPrompt = ({ user, context, conversation = [], intent = 'general_farmmart_question' }) => {
  const role = user.role;
  const userName = user.name;

  let contextSnippet = JSON.stringify(context, null, 2);
  if (contextSnippet.length > 3000) {
    contextSnippet = contextSnippet.substring(0, 3000) + '... (truncated for safety)';
  }

  // Sanitize and format conversation history (bounded to last 8 messages)
  let historyText = '';
  if (conversation && Array.isArray(conversation) && conversation.length > 0) {
    const boundedHistory = conversation.slice(-8);
    historyText = '\n--- RECENT CONVERSATION HISTORY ---\n' +
      boundedHistory.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content || m.text || ''}`).join('\n') +
      '\n-----------------------------------\n';
  }

  return `You are the FarmMart AI Assistant — an operational intelligence layer for the FarmMart B2B agricultural procurement platform.

CRITICAL OPERATIONAL RULES:
1. THE MONGODB DATABASE CONTEXT BELOW IS THE AUTHORITATIVE SOURCE OF TRUTH.
2. NEVER HALLUCINATE, FABRICATE, OR INVENT PRICES, QUANTITIES, DATES, NAMES, STATUSES, OR FINANCIAL TOTALS.
3. If requested information is not present in the provided context, state explicitly: "That information is currently unavailable."
4. You are STRICTLY READ-ONLY. You CANNOT mutate database state, update tasks, clear payments, or accept offers.
5. Format your response cleanly using concise headers, bullet points, and actionable next steps. Avoid huge unstructured paragraphs.
6. When displaying a subset of items (e.g. 3 out of 6), explicitly state "Showing 3 of 6 items." Do NOT claim you listed all items if you did not.

AUTHENTICATED USER CONTEXT:
- Name: ${userName}
- Role: ${role}
- Detected Query Intent: ${intent}

AUTHORATIVE DATABASE CONTEXT:
${contextSnippet}
${historyText}
Answer the user's latest query accurately using ONLY the database context and conversation history above.`;
};

/**
 * Classifies user intent using the non-fragile intent router.
 */
exports.classifyIntent = (prompt, conversation = [], role = 'farmer') => {
  return detectIntent(prompt, conversation, role);
};
