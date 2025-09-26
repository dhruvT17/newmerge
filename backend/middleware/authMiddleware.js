const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

exports.verifyToken = (req, res, next) => {
    const authHeader = req.header("Authorization");
    console.log("Authorization Header:", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Access Denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Access Denied. Invalid token format." });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Token Verified Successfully:", verified);
        // Support both token shapes:
        // - { userId, role, username }
        // - optional credentialId for legacy flows
        req.user = {
            _id: verified.userId || verified._id,
            credentialId: verified.credentialId || verified.userId || verified._id,
            role: verified.role,
            username: verified.username
        };
        next();
    } catch (err) {
        console.log("Token Verification Error:", err.message);
        return res.status(403).json({ message: "Invalid token" });
    }
}

exports.isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== "Admin") {
        return res.status(403).json({ message: "Access Denied. Admins only!" });
    }
    next();
};
