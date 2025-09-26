
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();


exports.verifyToken = (req, res, next) => {
    const authHeader = req.header("Authorization");
    console.log("Authorization Header:", authHeader);  // ✅ Debugging

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Access Denied. No token provided." });
    }
    
    // const token = jwt.sign({ _id: user_id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

    const token = authHeader.split(" ")[1];


    console.log("Extracted Token:", token);  // ✅ Debugging

    if (!token) {
        return res.status(401).json({ message: "Access Denied. Invalid token format." });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Token Verified Successfully:", verified);  // ✅ Debugging
        // Support both token shapes:
        // - { userId, role } where userId refers to Credentials._id (authController)
        // - { credentialId, role } (userController)
        req.user = {
            _id: verified.userId || verified._id, // legacy fallback
            credentialId: verified.credentialId || verified.userId || verified._id,
            role: verified.role,
        };
        next();
    } catch (err) {
        console.log("Token Verification Error:", err.message);  // ✅ Debugging
        return res.status(403).json({ message: "Invalid token" });
    }

}

// exports.verifyToken = (req, res, next) => {
//     const authHeader = req.header("Authorization");

//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//         return res.status(401).json({ message: "Access Denied. No token provided." });
//     }

//     const token = authHeader.split(" ")[1];
//     if (!token) {
//         return res.status(401).json({ message: "Access Denied. Invalid token format." });
//     }

//     try {
//         const verified = jwt.verify(token, process.env.JWT_SECRET);
//         req.user = {
//             _id: verified.userId,  // Fix here
//             role: verified.role,
//         };
//         console.log("Token Verified Successfully:", verified);  // ✅ Debugging
//         next();
//     } catch (err) {
//         console.log("Token Verification Error:", err.message);  // ✅ Debugging
//         return res.status(403).json({ message: "Invalid token" });
//     }
// };




exports. isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== "Admin") {
        return res.status(403).json({ message: "Access Denied. Admins only!" });
    }
    next();
};



// module.exports = { verifyToken, isAdmin }

// };

