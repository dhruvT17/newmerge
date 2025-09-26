let useUnified = false;
let unifiedController = null;
try {
  unifiedController = require('./unifiedChatbotController');
  useUnified = typeof unifiedController?.handleUnifiedChat === 'function';
} catch (_) {
  useUnified = false;
}

if (useUnified) {
  exports.handleChat = unifiedController.handleUnifiedChat;
  exports.handleUnifiedChat = unifiedController.handleUnifiedChat;
  exports.getSystemAnalytics = unifiedController.getSystemAnalytics;
} else {
  // Fallback: implement a minimal passthrough that returns a helpful message
  exports.handleChat = async (req, res) => {
    const message = (req.body && req.body.message) || '';
    return res.json({ data: [], message: message ? `Echo: ${message}` : 'Chat service is initializing.' });
  };
}
