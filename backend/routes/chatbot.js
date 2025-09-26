const express = require("express");
const router = express.Router();
const chatbotController = require("../controllers/chatbotController");

// Change from /chat to match the expected endpoint
router.post("/", chatbotController.handleChat);

module.exports = router;
