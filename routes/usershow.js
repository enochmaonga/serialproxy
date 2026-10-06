const express = require("express");
const router = express.Router();
const { getDb } = require("../config/db");

router.get("/", async (req, res) => {
  try {
    const db = req.app.locals.db || getDb();
    const usersCollection = db.collection("users");
    const users = await usersCollection.find().toArray();

    res.json(users || []);
  } catch (error) {
    console.error("Error retrieving users:", error);
    res.status(500).json({ error: "Failed to retrieve users" });
  }
});

module.exports = router;