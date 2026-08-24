const aiConfig = require('../../../config/aiConfig');
const MockProvider = require('./mockProvider');

class GeminiProvider {
  constructor() {
    this.mockFallback = new MockProvider();
  }

  async generateResponse({ fullPrompt, prompt, context, role, intent }) {
    const startTime = Date.now();

    if (!aiConfig.apiKey || aiConfig.mockMode) {
      return this.mockFallback.generateResponse({
        prompt,
        context,
        role,
        intent
      });
    }

    try {
      const model = aiConfig.model || 'gemini-2.5-flash';

      const url =
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

      const controller = new AbortController();

      const timeoutId = setTimeout(
        () => controller.abort(),
        aiConfig.timeoutMs || 15000
      );

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': aiConfig.apiKey
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: fullPrompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: aiConfig.temperature || 0.2,
            maxOutputTokens: aiConfig.maxTokens || 1024
          }
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();

        console.warn(
          `[AI PROVIDER] Gemini API returned HTTP status ${response.status}: ${errorBody}`
        );

        if (process.env.NODE_ENV === 'production') {
          return {
            success: true,
            answer:
              'FarmMart AI is temporarily unavailable. Please try again in a few moments.',
            intent: intent || 'general_farmmart_question',
            suggestedActions: [],
            references: {
              tasks: [],
              demands: [],
              offers: []
            },
            responseTokens: 0,
            durationMs: Date.now() - startTime,
            status: 'error'
          };
        }

        return this.mockFallback.generateResponse({
          prompt,
          context,
          role,
          intent
        });
      }

      const resData = await response.json();

      const text =
        resData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        if (process.env.NODE_ENV === 'production') {
          return {
            success: true,
            answer: 'FarmMart AI is temporarily unavailable.',
            intent: intent || 'general_farmmart_question',
            suggestedActions: [],
            references: {
              tasks: [],
              demands: [],
              offers: []
            },
            responseTokens: 0,
            durationMs: Date.now() - startTime,
            status: 'error'
          };
        }

        return this.mockFallback.generateResponse({
          prompt,
          context,
          role,
          intent
        });
      }

      const durationMs = Date.now() - startTime;

      const references = {
        tasks: [],
        demands: [],
        offers: []
      };

      const suggestedActions = [];

      if (context?.tasks?.length > 0) {
        references.tasks = context.tasks
          .slice(0, 3)
          .map(t => t.id || t._id);

        suggestedActions.push({
          label: 'View Tasks',
          route: '/tasks'
        });
      }

      if (
        context?.demands?.length > 0 ||
        context?.openDemands?.length > 0
      ) {
        references.demands = (
          context.demands ||
          context.openDemands ||
          []
        )
          .slice(0, 3)
          .map(d => d.id || d._id);

        suggestedActions.push({
          label: 'View Demands',
          route: '/demands'
        });
      }

      return {
        success: true,
        answer: text.trim(),
        intent: intent || 'general_farmmart_question',
        suggestedActions,
        references,
        responseTokens:
          resData.usageMetadata?.candidatesTokenCount || 150,
        durationMs,
        status: 'success'
      };
    } catch (error) {
      console.warn(
        `[AI PROVIDER] Gemini API request failed (${error.message}).`
      );

      if (process.env.NODE_ENV === 'production') {
        return {
          success: true,
          answer:
            'FarmMart AI is temporarily unavailable. Please try again.',
          intent: intent || 'general_farmmart_question',
          suggestedActions: [],
          references: {
            tasks: [],
            demands: [],
            offers: []
          },
          responseTokens: 0,
          durationMs: Date.now() - startTime,
          status: 'error'
        };
      }

      return this.mockFallback.generateResponse({
        prompt,
        context,
        role,
        intent
      });
    }
  }
}

module.exports = GeminiProvider;
