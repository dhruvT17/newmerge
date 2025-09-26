const Project = require("../models/Project");
const Client = require("../models/Client");

// ✅ Get all projects (Admin only) or projects assigned to Project Manager
exports.getAllProjects = async (req, res) => {
  try {
    let query = {};
    if (req.user && req.user.role === 'Project Manager') {
      query.project_manager_id = req.user._id;
      query.$or = [
        { 'project_details.status': { $ne: 'Completed' } },
        { 'project_details.status': { $exists: false } },
        { status: { $ne: 'Completed' } },
        { status: { $exists: false } }
      ];
    }

    const projects = await Project.find(query)
      .populate("client_id", "name email")
      .populate("project_manager_id", "name email role")
      .populate("project_leads", "name email");
    
    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    console.error("❌ Error fetching projects:", error);
    res.status(500).json({ success: false, message: "Failed to fetch projects" });
  }
};

// ✅ Create a new project
exports.createProject = async (req, res) => {
  try {
    if (!req.body.project_details || !req.body.client_id) {
      return res.status(400).json({
        success: false,
        message: "Project details and client ID are required",
      });
    }
    const project = new Project(req.body);
    await project.save();

    // Link project to client
    if (project.client_id) {
      const clientId = typeof project.client_id === 'object' 
        ? project.client_id._id 
        : project.client_id;
      await Client.findByIdAndUpdate(
        clientId,
        { $addToSet: { projects: project._id } },
        { new: true }
      );
    }

    res
      .status(201)
      .json({
        success: true,
        message: "Project created successfully",
        data: project,
      });
  } catch (error) {
    console.error("Error creating project:", error);
    res
      .status(400)
      .json({ success: false, message: "Failed to create project" });
  }
};

// ✅ Update an existing project
exports.updateProject = async (req, res) => {
  try {
    // Get the existing project to check if client_id is changing
    const existingProject = await Project.findById(req.params.id);

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    // Update the project
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id, 
      req.body,
      { new: true, runValidators: true }
    );

    // If client_id has changed, update both the old and new client's projects arrays
    if (req.body.client_id && existingProject.client_id) {
      const oldClientId = typeof existingProject.client_id === 'object'
        ? existingProject.client_id._id
        : existingProject.client_id;
      
      const newClientId = typeof req.body.client_id === 'object'
        ? req.body.client_id._id
        : req.body.client_id;
      
      if (oldClientId.toString() !== newClientId.toString()) {
        await Client.findByIdAndUpdate(
          oldClientId,
          { $pull: { projects: existingProject._id } }
        );
        await Client.findByIdAndUpdate(
          newClientId,
          { $addToSet: { projects: existingProject._id } }
        );
      }
    } else if (req.body.client_id && !existingProject.client_id) {
      const clientId = typeof req.body.client_id === 'object'
        ? req.body.client_id._id
        : req.body.client_id;
      
      await Client.findByIdAndUpdate(
        clientId,
        { $addToSet: { projects: existingProject._id } }
      );
    }

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: updatedProject
    });
  } catch (error) {
    console.error("Error updating project:", error);
    res
      .status(400)
      .json({ success: false, message: "Failed to update project" });
  }
};

// ✅ Delete a project
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    // If the project has a client, remove the project from the client's projects array
    if (project.client_id) {
      const clientId = typeof project.client_id === 'object'
        ? project.client_id._id
        : project.client_id;
      
      await Client.findByIdAndUpdate(
        clientId,
        { $pull: { projects: project._id } }
      );
    }

    // Delete the project
    await Project.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Project deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete project" });
  }
};

// ✅ Assign Project Manager to a project (Admin only)
exports.assignProjectManager = async (req, res) => {
  try {
    const { projectId, projectManagerId } = req.body;
    
    if (!projectId || !projectManagerId) {
      return res.status(400).json({
        success: false,
        message: "Project ID and Project Manager ID are required"
      });
    }
    
    // Verify the user being assigned is actually a Project Manager
    const User = require("../models/User");
    const user = await User.findById(projectManagerId).populate('credentialId');
    if (!user || user.credentialId.role !== 'Project Manager') {
      return res.status(400).json({
        success: false,
        message: "Selected user is not a Project Manager"
      });
    }
    
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { project_manager_id: projectManagerId },
      { new: true }
    ).populate("project_manager_id", "name email role");
    
    if (!updatedProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Project Manager assigned successfully",
      data: updatedProject
    });
  } catch (error) {
    console.error("❌ Error assigning project manager:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign project manager"
    });
  }
};

// ✅ Get projects assigned to current Project Manager
exports.getMyProjects = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'Project Manager') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Project Managers can access this endpoint."
      });
    }
    
    const projects = await Project.find({
      project_manager_id: req.user._id,
      $or: [
        { 'project_details.status': { $ne: 'Completed' } },
        { 'project_details.status': { $exists: false } },
        { status: { $ne: 'Completed' } },
        { status: { $exists: false } }
      ]
    })
      .populate("client_id", "name email")
      .populate("project_manager_id", "name email role")
      .populate("project_leads", "name email");
    
    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    console.error("❌ Error fetching my projects:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch projects"
    });
  }
};
