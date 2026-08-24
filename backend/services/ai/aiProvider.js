const aiConfig = require('../../config/aiConfig');
const GeminiProvider = require('./providers/geminiProvider');
const MockProvider = require('./providers/mockProvider');

class AIProviderFactory {
  constructor() {
    this.geminiProvider = new GeminiProvider();
    this.mockProvider = new MockProvider();
  }

  getProvider() {
    if (aiConfig.mockMode || process.env.NODE_ENV === 'test') {
      return this.mockProvider;
    }
    return this.geminiProvider;
  }

  async generateResponse({ fullPrompt, prompt, context, role, intent }) {
    const provider = this.getProvider();
    return provider.generateResponse({ fullPrompt, prompt, context, role, intent });
  }
}

module.exports = new AIProviderFactory();
