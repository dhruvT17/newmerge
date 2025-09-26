const Credentials = require("../models/Credentials");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
dotenv.config();

// Admin Initialization
const initializeAdmin = async () => {
  const adminExists = await Credentials.findOne({ role: "Admin" });
  if (!adminExists) {
    const admin = new Credentials({
      username: "admin",
      password: "$2a$12$A11wmZblu9E2Xs1qSls1ieXA2AKBumD3fGz6iSEqipu9wQZdFviWS",
      role: "Admin",
    });
    await admin.save();
    console.log("✅ Admin credentials created!");
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find credentials by username
    const credentials = await Credentials.findOne({ username });
    if (!credentials) return res.status(400).json({ message: "Invalid credentials" });
    
    const isMatch = await bcrypt.compare(password, credentials.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Admin: embed credentials ID; non-admin: embed User ID for easier joins
    if (credentials.role === 'Admin') {
      const token = jwt.sign(
        { userId: credentials._id, role: credentials.role, username: credentials.username },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      return res.json({ token, userId: credentials._id, role: credentials.role, username: credentials.username, name: "Administrator", message: "Login successful" });
    }

    const user = await User.findOne({ credentialId: credentials._id });
    if (!user) return res.status(400).json({ message: "User profile not found" });

    const token = jwt.sign(
      { userId: user._id, role: credentials.role, username: credentials.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token, userId: user._id, role: credentials.role, username: credentials.username, name: user.name, message: "Login successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { login, initializeAdmin };
