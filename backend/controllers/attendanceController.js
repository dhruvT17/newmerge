
const Attendance = require('../models/Attendance');
const User = require('../models/User');

// ✅ Get attendance records for a user
exports.getAttendance = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }

        // Support both legacy and new schema fields
        const attendanceRecords = await Attendance.find({ $or: [
            { user_id: userId },
            { userId: userId }
        ]}).sort({ checkInTime: -1, createdAt: -1 });

        if (!attendanceRecords.length) {
            return res.status(404).json({ success: false, message: "No attendance records found" });
        }

        res.status(200).json({ success: true, data: attendanceRecords });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ✅ Get complete attendance sessions for a user (derived from checkIn/checkOut fields)
exports.getAttendanceSessions = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }

        // Find all documents for the user that have either legacy or new fields
        const records = await Attendance.find({ $or: [
            { userId: userId },
            { user_id: userId }
        ]}).sort({ checkInTime: -1, createdAt: -1 });

        // Build sessions from documents: prefer explicit checkInTime/checkOutTime
        const sessions = [];
        for (const rec of records) {
            const checkIn = rec.checkInTime || null;
            const checkOut = rec.checkOutTime || null;
            if (checkIn && checkOut) {
                const workDuration = Math.round((checkOut - checkIn) / (1000 * 60));
                sessions.push({
                    sessionId: rec._id,
                    userId: (rec.userId || rec.user_id),
                    attendance_date: rec.attendance_date || checkIn,
                    checkIn: { timestamp: checkIn },
                    checkOut: { timestamp: checkOut },
                    workDuration,
                    createdAt: rec.createdAt
                });
            }
        }

        return res.json({ success: true, data: sessions, totalSessions: sessions.length });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ✅ Admin: List attendance with filters (status + date range over checkInTime)
exports.adminListAttendance = async (req, res) => {
    try {
        const { userId, from, to, status } = req.query;
        const query = {};
        if (userId) {
            // support both fields
            query.$or = [{ userId }, { user_id: userId }];
        }
        if (status) query.status = status;
        if (from || to) {
            query.checkInTime = {};
            if (from) query.checkInTime.$gte = new Date(from);
            if (to) query.checkInTime.$lte = new Date(to);
        }
        const records = await Attendance.find(query).populate('userId', 'name email').sort({ checkInTime: -1, createdAt: -1 });
        return res.json({ success: true, data: records });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
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

// ✅ Face-verified Check In
exports.checkIn = async (req, res) => {
    try {
        const { descriptor } = req.body || {};
        if (!descriptor || !Array.isArray(descriptor)) {
            return res.status(400).json({ success: false, message: "Descriptor required" });
        }

        // 1. Get user and verify they exist
        const user = await User.findOne({ credentialId: req.user.credentialId });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // 2. Get stored face data and verify it exists
        if (!user.faceData) {
            return res.status(400).json({ 
                success: false, 
                message: "No face data registered. Please register your face first." 
            });
        }

        // 3. Get valid face descriptors
        const stored = user.faceData;
        const candidates = [
            stored.frontDescriptor,
            stored.leftDescriptor,
            stored.rightDescriptor
        ].filter(desc => Array.isArray(desc) && desc.length > 0);

        // 4. Verify we have face descriptors to compare against
        if (candidates.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: "No valid face descriptors found. Please re-register your face." 
            });
        }

        // 5. Verify descriptor lengths match
        const validCandidates = candidates.filter(c => c.length === descriptor.length);
        if (validCandidates.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid face descriptor format. Please try again." 
            });
        }

        // 6. Face verification with detailed logging
        console.log('Comparing face descriptors...');
        const distances = validCandidates.map(candidate => {
            let sum = 0;
            for (let i = 0; i < candidate.length; i++) {
                const diff = candidate[i] - descriptor[i];
                sum += diff * diff;
            }
            const distance = Math.sqrt(sum);
            console.log('Face comparison distance:', distance);
            return distance;
        });

        const minDist = Math.min(...distances);
        console.log('Best match distance:', minDist);

        const THRESHOLD = 0.6;
        if (minDist > THRESHOLD) {
            console.log('Face verification failed. Score:', minDist, 'Threshold:', THRESHOLD);
            return res.status(401).json({ 
                success: false, 
                message: "Face not recognized. Please ensure proper lighting and camera angle.",
                score: minDist,
                threshold: THRESHOLD
            });
        }

        console.log('Face verification successful. Score:', minDist);

        // Check for existing attendance today
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const existingAttendance = await Attendance.findOne({
            userId: user._id,
            checkInTime: { $gte: today, $lt: tomorrow }
        });

        if (existingAttendance) {
            return res.status(400).json({
                success: false,
                message: "Already checked in for today."
            });
        }

        // Business hours validation (optional)
        const hour = now.getHours();
        const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
        
        if (isWeekday && (hour < 6 || hour > 22)) {
            console.log('⚠️ Check-in outside normal business hours:', hour);
        }

        // Create attendance record in the new format while keeping legacy field defaults
        const record = new Attendance({
            userId: user._id,
            checkInTime: now,
            status: 'checked-in',
            time_entries: []
        });

        await record.save();

        return res.status(201).json({
            success: true,
            message: "Checked in successfully",
            data: record
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ✅ Face-verified Check Out
exports.checkOut = async (req, res) => {
    try {
        const { descriptor } = req.body || {};
        if (!descriptor || !Array.isArray(descriptor)) {
            return res.status(400).json({ success: false, message: "Descriptor required" });
        }

        // 1. Get user and verify they exist
        const user = await User.findOne({ credentialId: req.user.credentialId });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // 2. Get stored face data and verify it exists
        if (!user.faceData) {
            return res.status(400).json({ 
                success: false, 
                message: "No face data registered. Please register your face first." 
            });
        }

        // 3. Get valid face descriptors
        const stored = user.faceData;
        const candidates = [
            stored.frontDescriptor,
            stored.leftDescriptor,
            stored.rightDescriptor
        ].filter(desc => Array.isArray(desc) && desc.length > 0);

        // 4. Verify we have face descriptors to compare against
        if (candidates.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: "No valid face descriptors found. Please re-register your face." 
            });
        }

        // 5. Verify descriptor lengths match
        const validCandidates = candidates.filter(c => c.length === descriptor.length);
        if (validCandidates.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid face descriptor format. Please try again." 
            });
        }

        // 6. Face verification with detailed logging
        console.log('Comparing face descriptors for check-out...');
        const distances = validCandidates.map(candidate => {
            let sum = 0;
            for (let i = 0; i < candidate.length; i++) {
                const diff = candidate[i] - descriptor[i];
                sum += diff * diff;
            }
            const distance = Math.sqrt(sum);
            console.log('Face comparison distance:', distance);
            return distance;
        });

        const minDist = Math.min(...distances);
        console.log('Best match distance:', minDist);

        const THRESHOLD = 0.6;
        if (minDist > THRESHOLD) {
            console.log('Face verification failed. Score:', minDist, 'Threshold:', THRESHOLD);
            return res.status(401).json({ 
                success: false, 
                message: "Face not recognized. Please ensure proper lighting and camera angle.",
                score: minDist,
                threshold: THRESHOLD
            });
        }

        console.log('Face verification successful. Score:', minDist);

        const now = new Date();
        
        // Find today's attendance record
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Find today's attendance record for the user
        const todayAttendance = await Attendance.findOne({
            userId: user._id,
            checkInTime: { $gte: today, $lt: tomorrow }
        });

        if (!todayAttendance) {
            return res.status(404).json({
                success: false,
                message: "No check-in record found for today. Please check-in first."
            });
        }

        if (todayAttendance.checkOutTime) {
            return res.status(400).json({
                success: false,
                message: "Already checked out for today."
            });
        }

        // Update the existing record with check-out time
        todayAttendance.checkOutTime = now;
        todayAttendance.status = "checked-out";
        await todayAttendance.save();

        return res.status(200).json({
            success: true,
            message: "Checked out successfully",
            data: todayAttendance
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
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
