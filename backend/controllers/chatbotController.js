// This file has been replaced by unifiedChatbotController.js
// Keeping this file for backward compatibility - it now exports the unified controller

const unifiedController = require('./unifiedChatbotController');

// Export the unified functions for backward compatibility
exports.handleChat = unifiedController.handleUnifiedChat;
exports.handleUnifiedChat = unifiedController.handleUnifiedChat;
exports.getSystemAnalytics = unifiedController.getSystemAnalytics;
