const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");

// Define or retrieve User Mongoose model
const userSchema = new mongoose.Schema(
  {
    username: String,
    password: String,
    userType: String,
  },
  { collection: "users" }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

router.post("/", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  try {
    // Search for the user in the database (case-insensitive)
    const user = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, "i") },
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Check if the provided password matches the stored hashed password
    const passwordMatch = await bcryptjs.compare(password, user.password);

    if (passwordMatch) {
      // Generate a JWT token and send it back to the client
      const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET_KEY || "default_jwt_secret";
      const token = jwt.sign(
        { username: user.username, userType: user.userType, userId: user._id },
        secret,
        { expiresIn: "8h" }
      );

      return res.json({
        token,
        username: user.username,
        userId: user._id,
        userType: user.userType || "user",
      });
    } else {
      return res.status(401).json({ message: "Invalid username or password" });
    }
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Database error during login" });
  }
});

module.exports = router;