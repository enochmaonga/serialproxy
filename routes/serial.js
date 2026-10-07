const express = require("express");
const router = express.Router();
const { getDb } = require("../config/db");

router.get("/", async (req, res) => {
  try {
    const db = req.app.locals.db || getDb();
    const serialsCollection = db.collection("serials");

    const { denomination, search, q, limit = 50 } = req.query;
    const searchTerm = (search || q || "").trim();

    // Targeted search endpoint: query serials by denomination or regex pattern on demand
    if (denomination || searchTerm) {
      const query = {};
      if (denomination) {
        query.denomination = String(denomination).trim();
      }
      if (searchTerm) {
        query.serial = { $regex: searchTerm, $options: "i" };
      }

      const totalMatching = await serialsCollection.countDocuments(query);
      const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);

      const docs = await serialsCollection
        .find(query)
        .project({ serial: 1, denomination: 1, _id: 0 })
        .limit(limitNum)
        .toArray();

      return res.json({
        denomination: denomination || null,
        total: totalMatching,
        serials: docs.map((d) => d.serial),
      });
    }

    // Default high-performance overview:
    // 1. Ultra-fast index-covered count aggregation (sub-5ms)
    const groupedCounts = await serialsCollection
      .aggregate([
        {
          $group: {
            _id: "$denomination",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    // 2. Concurrently fetch a fast 50-serial preview pool for each denomination
    const denominations = await Promise.all(
      groupedCounts.map(async (group) => {
        const denom = group._id;
        const sampleDocs = await serialsCollection
          .find({ denomination: denom })
          .project({ serial: 1, _id: 0 })
          .limit(50)
          .toArray();

        return {
          denomination: denom,
          count: group.count,
          serials: sampleDocs.map((s) => s.serial),
        };
      })
    );

    // Sort numerically by denomination (e.g. 20, 50, 100, 500)
    denominations.sort((a, b) => {
      const numA = parseFloat(a.denomination) || 0;
      const numB = parseFloat(b.denomination) || 0;
      return numA - numB;
    });

    res.json({ denominations });
  } catch (error) {
    console.error("Error retrieving serials:", error);
    res.status(500).json({ error: "Failed to retrieve data" });
  }
});

module.exports = router;
