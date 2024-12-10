const express = require("express");
const router = express.Router();
const { MongoClient } = require("mongodb");

router.get("/", async (req, res) => {
  const db = req.app.locals.db; // Access the MongoDB database
  const airtimeCollection = db.collection("airtime");

  try {
    const airtime = await airtimeCollection.find().toArray();

    if (airtime && Array.isArray(airtime)) {
      res.json(airtime);
    } else {
      res.status(404).json({ error: "No data found" });
    }
  } catch (error) {
    console.error("Error retrieving users:", error);
    res.status(500).json({ error: "Failed to retrieve data" });
  }
});

module.exports = router;
