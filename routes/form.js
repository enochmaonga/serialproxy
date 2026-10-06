const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { getDb } = require("../config/db");

const jwtSecretKey = process.env.JWT_SECRET_KEY || process.env.ACCESS_TOKEN_SECRET || "default-secret-key";

// Authentication middleware
const authenticate = (req, res, next) => {
  const authToken = req.headers.authorization;
  if (!authToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authToken.split(" ")[1]; // Remove Bearer from token
  jwt.verify(token, jwtSecretKey, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Forbidden: Invalid token" });
    }
    req.user = decoded; // Set user information in request object
    next();
  });
};

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const db = getDb();
    const user = await db.collection("users").findOne({ username });

    if (!user || password !== user.password) {
      return res.status(401).json({ error: "Incorrect username or password." });
    }

    const authToken = jwt.sign({ userId: user._id }, jwtSecretKey, { expiresIn: "1h" });
    res.json({ success: true, authToken });
  } catch (error) {
    console.error("Form login error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/", authenticate, async (req, res) => {
  try {
    const db = getDb();
    const formCollection = db.collection("form");
    const form = await formCollection.find().toArray();

    if (form && Array.isArray(form)) {
      res.json({ body: form });
    } else {
      res.status(404).json({ error: "No Data" });
    }
  } catch (error) {
    console.error("Error retrieving items:", error);
    res.status(500).json({ error: "Failed to retrieve spares items" });
  }
});

module.exports = router;