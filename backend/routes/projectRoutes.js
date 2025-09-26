const express = require("express");
const router = express.Router();
const {
  getAllProjects,
  createProject,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");

// Middleware for validation (optional, can be moved to a separate file)
const validateProjectId = (req, res, next) => {
  if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Project ID" });
  }
  next();
};

// ✅ Get all projects
router.get("/", getAllProjects);

// ✅ Create a new project
router.post("/", createProject);

// ✅ Update a project (with validation)
router.patch("/:id", validateProjectId, updateProject);

// ✅ Delete a project (with validation)
router.delete("/:id", validateProjectId, deleteProject);

module.exports = router;
