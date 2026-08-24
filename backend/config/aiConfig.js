const dotenv = require('dotenv');
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || '';
const mockMode = process.env.AI_MOCK_MODE === 'true' || !apiKey || process.env.NODE_ENV === 'test';
const model = process.env.AI_MODEL_NAME || 'gemini-2.5-flash';

if (process.env.NODE_ENV !== 'test') {
  console.log(`[AI CONFIG] GEMINI_API_KEY configured: ${Boolean(apiKey)} | Model: ${model} | Mock Mode: ${mockMode}`);
}

module.exports = {
  provider: process.env.AI_PROVIDER || 'gemini',
  model,
  maxTokens: parseInt(process.env.AI_MAX_TOKENS, 10) || 1024,
  temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.2,
  promptLengthLimit: 500,
  mockMode,
  apiKey,
  timeoutMs: 15000
};
