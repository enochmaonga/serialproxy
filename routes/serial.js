const express = require("express");
const router = express.Router();
const { MongoClient } = require("mongodb");

router.get("/", async (req, res) => {
  const db = req.app.locals.db;
  const serialsCollection = db.collection("serials");

  try {
    // Aggregate serials grouped by denomination
    const groupedData = await serialsCollection
      .aggregate([
        {
          $group: {
            _id: "$denomination", // Group by denomination
            serials: { $push: "$serial" }, // Collect all serials under the denomination
          },
        },
        {
          $project: {
            denomination: "$_id",
            serials: 1,
            _id: 0,
          },
        },
      ])
      .toArray();

    res.json({ denominations: groupedData });
  } catch (error) {
    console.error("Error retrieving serials:", error);
    res.status(500).json({ error: "Failed to retrieve data" });
  }
});

module.exports = router;
