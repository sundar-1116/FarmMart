const aiCoreService = require('../services/ai/aiCoreService');

// POST /api/ai/assistant
exports.askAssistant = async (req, res, next) => {
  try {
    const { prompt, conversation } = req.body;
    const user = {
      id: req.user.id || req.user._id,
      role: req.user.role,
      name: req.user.name
    };

    const result = await aiCoreService.processAIRequest({ user, prompt, conversation });
    return res.status(200).json(result);
  } catch (error) {
    if (
      error.message && (
        error.message.includes('maximum length') ||
        error.message.includes('exceeds') ||
        error.message.includes('character limit') ||
        error.message.includes('cannot be empty') ||
        error.message.includes('required')
      )
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
        error: { code: 'BAD_REQUEST', message: error.message }
      });
    }
    next(error);
  }
};
