const Leave = require("../models/Leave");
const User = require("../models/User");

// ✅ Get all leave requests
exports.getAllLeaves = async (req, res) => {
  try {
    // Fetch all leaves
    const leaves = await Leave.find().lean();
    
    // Try to fetch users with their credential IDs
    const users = await User.find().lean();
    
    // Create maps for both user IDs and credential IDs
    const userIdMap = {};
    const credentialIdMap = {};
    
    users.forEach(user => {
      userIdMap[user._id.toString()] = user;
      if (user.credentialId) {
        credentialIdMap[user.credentialId.toString()] = user;
      }
    });
    
    // Format leaves with user information
    const formattedLeaves = leaves.map(leave => {
      const userId = leave.user_id ? leave.user_id.toString() : null;
      
      // Try to find user by direct ID first, then by credential ID
      let user = userId && userIdMap[userId] ? userIdMap[userId] : null;
      
      // If not found, check if it matches a credential ID
      if (!user && userId && credentialIdMap[userId]) {
        user = credentialIdMap[userId];
      }
      
      // Get user name or use a default value with the user ID
      let userName = 'Unknown';
      if (user) {
        userName = user.name;
      } else if (userId) {
        // If user not found but we have an ID, show a formatted version
        userName = `Employee (ID: ${userId.substring(userId.length - 6)})`;
      }
      
      return {
        ...leave,
        user_id: userId,
        user_name: userName,
        admin_remarks: leave.admin_remarks || null
      };
    });

    res.status(200).json({
      success: true,
      data: formattedLeaves
    });
  } catch (error) {
    console.error("Error fetching leaves:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch leaves"
    });
  }
};

// ✅ Create a new leave request
exports.createLeave = async (req, res) => {
  try {
    const leave = new Leave(req.body);
    await leave.save();
    res.status(201).json({ success: true, message: "Leave request submitted", data: leave });
  } catch (error) {
    console.error("Error submitting leave request:", error);
    res.status(400).json({ success: false, message: "Failed to submit leave request" });
  }
};


// ✅ Update a leave request (Partial Update using PATCH)
exports.updateLeave = async (req, res) => {
  try {
    const leave = await Leave.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!leave) return res.status(404).json({ success: false, message: "Leave request not found" });

    res.status(200).json({ success: true, message: "Leave request updated", data: leave });
  } catch (error) {
    console.error("Error updating leave request:", error);
    res.status(400).json({ success: false, message: "Failed to update leave request" });
  }
};

// exports.updateLeave = async (req, res) => {
//   try {
//     const leave = await Leave.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     if (!leave) return res.status(404).json({ success: false, message: "Leave request not found" });

//     res.status(200).json({ success: true, message: "Leave request updated", data: leave });
//   } catch (error) {
//     console.error("Error updating leave request:", error);
//     res.status(400).json({ success: false, message: "Failed to update leave request" });
//   }
// };

// ✅ Delete a leave request

exports.deleteLeave = async (req, res) => {
  try {
    const leave = await Leave.findByIdAndDelete(req.params.id);
    if (!leave) return res.status(404).json({ success: false, message: "Leave request not found" });

    res.status(200).json({ success: true, message: "Leave request deleted successfully" });
  } catch (error) {
    console.error("Error deleting leave request:", error);
    res.status(500).json({ success: false, message: "Failed to delete leave request" });
  }
};


// ✅ Accept a leave request
exports.acceptLeave = async (req, res) => {
  try {
    const leave = await Leave.findByIdAndUpdate(req.params.id, { status: "accepted" }, { new: true });
    if (!leave) return res.status(404).json({ success: false, message: "Leave request not found" });

    res.status(200).json({ success: true, message: "Leave request accepted", data: leave });
  } catch (error) {
    console.error("Error accepting leave request:", error);
    res.status(500).json({ success: false, message: "Failed to accept leave request" });
  }
};

// ✅ Reject a leave request
exports.rejectLeave = async (req, res) => {
  try {
    const leave = await Leave.findByIdAndUpdate(req.params.id, { status: "rejected" }, { new: true });
    if (!leave) return res.status(404).json({ success: false, message: "Leave request not found" });

    res.status(200).json({ success: true, message: "Leave request rejected", data: leave });
  } catch (error) {
    console.error("Error rejecting leave request:", error);
    res.status(500).json({ success: false, message: "Failed to reject leave request" });
  }
};

// In your leaveController.js
exports.getLeaveById = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found"
      });
    }
    
    res.status(200).json({
      success: true,
      data: leave
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
