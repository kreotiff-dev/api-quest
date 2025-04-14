const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const logger = require('../utils/logger');

// @desc    Send message to OpenAI ChatGPT
// @route   POST /api/ai/chat
// @access  Private (authenticated users only)
exports.chatCompletion = asyncHandler(async (req, res, next) => {
  const { messages, options = {} } = req.body;
  
  if (!messages || !Array.isArray(messages)) {
    return next(new ErrorResponse('Messages array is required', 400));
  }
  
  try {
    // Get API key from server environment variables
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return next(new ErrorResponse('OpenAI API key not configured', 500));
    }
    
    const requestOptions = {
      model: options.model || 'gpt-3.5-turbo',
      messages: messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 500,
      top_p: options.topP || 1,
      frequency_penalty: options.frequencyPenalty || 0,
      presence_penalty: options.presencePenalty || 0,
    };
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestOptions)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      return next(new ErrorResponse(`AI service error: ${errorData.error?.message || response.statusText}`, response.status));
    }
    
    const data = await response.json();
    
    // Return only necessary data to client
    res.status(200).json({
      success: true,
      data: {
        choices: data.choices,
        usage: data.usage
      }
    });
  } catch (error) {
    logger.error(`ChatGPT API error: ${error.message}`);
    return next(new ErrorResponse('Error processing AI request', 500));
  }
});
