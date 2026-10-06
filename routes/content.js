const express = require("express");
const router = express.Router();
const { getDb } = require("../config/db");

router.get("/", async (req, res) => {
  try {
    const db = req.app.locals.db || getDb();
    const formCollection = db.collection("form");
    const form = await formCollection.find().toArray();

    res.json(form || []);
  } catch (error) {
    console.error("Error retrieving form content:", error);
    res.status(500).json({ error: "Failed to retrieve content" });
  }
});

module.exports = router;