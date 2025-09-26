const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    attendance_date: { type: Date, required: true },
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attendance", AttendanceSchema);
