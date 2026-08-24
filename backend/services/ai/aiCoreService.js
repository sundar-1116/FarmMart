const aiConfig = require('../../config/aiConfig');
const contextRetriever = require('./contextRetriever');
const promptBuilder = require('./promptBuilder');
const aiProvider = require('./aiProvider');
const intentRouter = require('./intentRouter');
const AILog = require('../../models/AILog');

/**
 * M8.2 + M8.3 Conversational AI Core Orchestrator.
 */
exports.processAIRequest = async ({ user, prompt, conversation = [] }) => {
  if (!user || !user.id || !user.role) {
    throw new Error('Authentication required');
  }

  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Prompt string is required');
  }

  const trimmedPrompt = prompt.trim();
  if (trimmedPrompt.length === 0) {
    throw new Error('Prompt cannot be empty');
  }

  if (trimmedPrompt.length > aiConfig.promptLengthLimit) {
    throw new Error(`Prompt exceeds maximum length of ${aiConfig.promptLengthLimit} characters`);
  }

  // 1. Sanitize and bound conversation history (max 8 messages)
  const boundedConversation = Array.isArray(conversation)
    ? conversation.slice(-8).map(m => ({
        role: m.role === 'assistant' || m.sender === 'ai' ? 'assistant' : 'user',
        content: String(m.content || m.text || '').substring(0, 500),
        intent: m.intent,
        references: m.references || m.referencedIds
      }))
    : [];

  const startTime = Date.now();

  // 2. Perform Semantic Analysis (Intent, Context References, Entity Memory, Ambiguity)
  const semanticResult = intentRouter.analyzeSemantics(trimmedPrompt, boundedConversation, user.role);

  // 3. Handle Ambiguous Clarifications when context is missing
  if (semanticResult.requiresClarification) {
    return {
      success: true,
      data: {
        answer: semanticResult.clarificationMessage,
        intent: 'clarification_required',
        confidence: 1.0,
        suggestedActions: [],
        references: { tasks: [], demands: [], offers: [] },
        referencedIds: { tasks: [], demands: [], offers: [] }
      }
    };
  }

  const intent = semanticResult.intent;

  // 4. Retrieve Authorized Database Context based on Role & Semantic Intent
  const context = await contextRetriever.getContext(user, intent);

  // 5. Construct System Prompt with DB Ground Truth + Bounded Conversation Memory
  const fullPrompt = promptBuilder.buildSystemPrompt({
    user,
    context,
    conversation: boundedConversation,
    intent
  });

  // 6. Generate AI Response via Provider Abstraction
  const aiResult = await aiProvider.generateResponse({
    fullPrompt,
    prompt: trimmedPrompt,
    context,
    role: user.role,
    intent
  });

  const durationMs = Date.now() - startTime;

  // 7. Audit Logging (Non-blocking)
  try {
    await AILog.create({
      user: user.id,
      role: user.role,
      query: trimmedPrompt,
      intent,
      responseTokens: aiResult.responseTokens || 0,
      durationMs,
      status: aiResult.status || 'success'
    });
  } catch (logErr) {
    console.error('[AI CORE SERVICE] Audit logging error:', logErr.message);
  }

  // 8. Return Structured Response
  return {
    success: true,
    data: {
      answer: aiResult.answer,
      intent,
      confidence: semanticResult.confidence || 0.96,
      suggestedActions: aiResult.suggestedActions || [],
      followUpSuggestions: aiResult.followUpSuggestions || [],
      references: aiResult.references || { tasks: [], demands: [], offers: [] },
      referencedIds: aiResult.references || { tasks: [], demands: [], offers: [] }
    }
  };
};
