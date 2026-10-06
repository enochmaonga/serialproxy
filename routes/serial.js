const express = require("express");
const router = express.Router();
const { getDb } = require("../config/db");

router.get("/", async (req, res) => {
  try {
    const db = req.app.locals.db || getDb();
    const serialsCollection = db.collection("serials");

    const groupedData = await serialsCollection
      .aggregate([
        {
          $group: {
            _id: "$denomination",
            serials: { $push: "$serial" },
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

    res.json({ denominations: groupedData || [] });
  } catch (error) {
    console.error("Error retrieving serials:", error);
    res.status(500).json({ error: "Failed to retrieve data" });
  }
});

module.exports = router;
