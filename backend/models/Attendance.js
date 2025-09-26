const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema(
  {
    // Legacy fields (kept for backward compatibility with existing endpoints)
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    attendance_date: { type: Date },
    time_entries: [
      {
        type: { type: String },
        timestamp: { type: Date },
        task_description: { type: String },
        check_in_status: { type: String },
        late_reason: { type: String },
      },
    ],
    total_work_duration: { type: Number },
    total_break_duration: { type: Number },

    // New streamlined fields used by face check-in/out flow
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User"
    },
    checkInTime: { type: Date },
    checkOutTime: { type: Date },
    status: { type: String, default: "checked-in" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attendance", AttendanceSchema);
