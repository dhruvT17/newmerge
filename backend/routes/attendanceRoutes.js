const express = require("express");
const router = express.Router();
const {
  getAttendance,
  markAttendance,
  checkIn,
  checkOut,
  adminListAttendance,
  getAttendanceSessions,
} = require("../controllers/attendanceController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

router.get("/:userId", getAttendance);
router.get("/sessions/:userId", verifyToken, getAttendanceSessions); // New route for sessions
router.post("/", markAttendance);
router.post("/check-in", verifyToken, checkIn);
router.post("/check-out", verifyToken, checkOut);
router.get("/admin/list", verifyToken, isAdmin, adminListAttendance);

module.exports = router;
