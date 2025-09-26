const express = require("express");
const router = express.Router();
const {
  getAttendance,
  markAttendance,
} = require("../controllers/attendanceController");

router.get("/:userId", getAttendance);
router.post("/", markAttendance);

module.exports = router;
