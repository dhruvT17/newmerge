const express = require("express");
const router = express.Router();
const chatbotController = require("../controllers/chatbotController");

// Main chatbot endpoint - uses unified controller if available
router.post("/", chatbotController.handleChat);

module.exports = router;
