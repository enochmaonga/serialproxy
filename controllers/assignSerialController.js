const { getDb } = require("../config/db");

const isEntryDuplicate = async (db, airtime) => {
  const existingEntry = await db.collection("airtime").findOne({
    serialNumber: airtime.serialNumber,
    phoneNumber: airtime.phoneNumber,
  });
  return existingEntry !== null;
};

const selectSerialAndMoveToAirtime = async (req, res) => {
  const { denomination, phoneNumber } = req.body;

  if (!denomination || !phoneNumber) {
    console.error("Validation error: Invalid input data");
    return res.status(400).json({ message: "Invalid input data" });
  }

  try {
    const db = getDb();
    const serialsCollection = db.collection("serials");
    const airtimeCollection = db.collection("airtime");

    // Find a serial number by denomination and pop the first serial
    const result = await serialsCollection.findOneAndUpdate(
      {
        denomination: denomination,
        serials: { $exists: true, $not: { $size: 0 } },
      },
      { $pop: { serials: -1 } },
      { returnDocument: "after" }
    );

    // Support both Driver 4/5 ({ value: doc }) and Driver 6 (doc) return shapes
    const updatedDoc = result && result.value !== undefined ? result.value : result;

    if (!updatedDoc || !updatedDoc.serials || updatedDoc.serials.length === 0) {
      return res
        .status(404)
        .json({ message: "No serials available in database for this denomination" });
    }

    const serialToMove = updatedDoc.serials[0];

    const airtimeEntry = {
      phoneNumber,
      serialNumber: serialToMove,
      denomination,
      createdAt: new Date(),
    };

    const isDuplicated = await isEntryDuplicate(db, airtimeEntry);
    if (isDuplicated) {
      return res.status(400).json({
        success: false,
        message: "Duplicate record detected",
      });
    }

    // Insert the serial into the airtime collection
    await airtimeCollection.insertOne(airtimeEntry);
    console.log("Serial moved to airtime collection");

    // Respond with success
    res.status(200).json({
      success: true,
      message: "Serial successfully assigned and moved to airtime",
      serial: serialToMove,
    });
  } catch (error) {
    console.error("Error processing serial:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process serial",
    });
  }
};

module.exports = { selectSerialAndMoveToAirtime };
