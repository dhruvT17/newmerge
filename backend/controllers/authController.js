const Credentials = require("../models/Credentials");
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
    const user = await Credentials.findOne({ username });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token, userId: user._id, role: user.role, message: "Login successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { login, initializeAdmin };
