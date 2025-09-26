const express = require("express");
const router = express.Router();
const chatbotController = require("../controllers/chatbotController");

// Main unified chatbot endpoint - handles both user and project queries
router.post("/", chatbotController.handleUnifiedChat);

// System analytics endpoint
router.get("/analytics", chatbotController.getSystemAnalytics);

// Test endpoint to verify chatbot is working
router.get("/test", (req, res) => {
  res.json({
    message: "WorkFusion Unified Chatbot is running!",
    status: "active",
    capabilities: [
      "User Management Queries",
      "Project Management Queries", 
      "Task Management Queries",
      "Client Management Queries",
      "Leave Management Queries",
      "Attendance Queries",
      "Cross-Collection Analytics"
    ],
    exampleQueries: [
      "Find active users with React skills",
      "Show all active projects",
      "Find overdue tasks",
      "Users who checked in today",
      "Project completion rates by client"
    ]
  });
});

// Backward compatibility
router.post("/legacy", chatbotController.handleChat);

module.exports = router;
