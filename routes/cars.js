const express = require("express");
const router = express.Router();
const { getDb } = require("../config/db");
const verifyJWT = require("../middleware/verifyJWT");
const requireAdmin = require("../middleware/requireAdmin");

// Only Admin can view audit reports / entered airtime data
router.get("/", verifyJWT, requireAdmin, async (req, res) => {
  try {
    const db = req.app.locals.db || getDb();
    const airtimeCollection = db.collection("airtime");
    const airtime = await airtimeCollection.find().toArray();

    res.json(airtime || []);
  } catch (error) {
    console.error("Error retrieving airtime:", error);
    res.status(500).json({ error: "Failed to retrieve data" });
  }
});

module.exports = router;
