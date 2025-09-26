
const Attendance = require('../models/Attendance');

// ✅ Get attendance records for a user
exports.getAttendance = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }

        const attendanceRecords = await Attendance.find({ user_id: userId });

        if (!attendanceRecords.length) {
            return res.status(404).json({ success: false, message: "No attendance records found" });
        }

        res.status(200).json({ success: true, data: attendanceRecords });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ✅ Mark attendance (Create an attendance record)
exports.markAttendance = async (req, res) => {
    try {
        const { user_id, attendance_date, time_entries, total_work_duration, total_break_duration } = req.body;

        if (!user_id || !attendance_date) {
            return res.status(400).json({ success: false, message: "User ID and Attendance Date are required" });
        }

        const newAttendance = new Attendance({
            user_id,
            attendance_date,
            time_entries,
            total_work_duration,
            total_break_duration
        });

        const savedAttendance = await newAttendance.save();

        res.status(201).json({
            success: true,
            message: "Attendance marked successfully",
            data: savedAttendance
        });
    } catch (error) {
        res.status(400).json({ success: false, message: "Error marking attendance", error: error.message });
    }
};

// ✅ Update an attendance record
exports.updateAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedAttendance = await Attendance.findByIdAndUpdate(id, req.body, { new: true });

        if (!updatedAttendance) {
            return res.status(404).json({ success: false, message: "Attendance record not found" });
        }

        res.status(200).json({
            success: true,
            message: "Attendance record updated successfully",
            data: updatedAttendance
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating attendance", error: error.message });
    }
};

// ✅ Delete an attendance record
exports.deleteAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedAttendance = await Attendance.findByIdAndDelete(id);

        if (!deletedAttendance) {
            return res.status(404).json({ success: false, message: "Attendance record not found" });
        }

        res.status(200).json({ success: true, message: "Attendance record deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error deleting attendance", error: error.message });
    }
};
