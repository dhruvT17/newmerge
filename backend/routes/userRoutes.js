const express = require("express");
const {
  getAllUsers,
  getUserById,
  createUser,
  loginUser,
  updateUser,
  deactivateUser,
  reactivateUser,
} = require("../controllers/userController");
const{ verifyToken, isAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes
// router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes
router.get("/", verifyToken, getAllUsers);
router.get("/:id", verifyToken, getUserById);
router.post("/create", verifyToken, isAdmin, createUser);
router.patch("/:id", verifyToken, updateUser);

// Replace delete with deactivate/reactivate
router.patch("/:id/deactivate", verifyToken, isAdmin, deactivateUser);
router.patch("/:id/reactivate", verifyToken, isAdmin, reactivateUser);

module.exports = router;