const express = require("express");
const router = express.Router();
const { getDb } = require("../config/db");
const verifyJWT = require("../middleware/verifyJWT");
const requireAdmin = require("../middleware/requireAdmin");

// Only Admin can fetch the list of users
router.get("/", verifyJWT, requireAdmin, async (req, res) => {
  try {
    const db = req.app.locals.db || getDb();
    const usersCollection = db.collection("users");
    // Exclude password hash from response
    const users = await usersCollection.find({}, { projection: { password: 0 } }).toArray();

    res.json(users || []);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;