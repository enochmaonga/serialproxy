const { MongoClient } = require("mongodb");

const uri =
  "mongodb+srv://maongaenoch:P6QpXaBRe8zHA5gI@cluster0.gqnfqjq.mongodb.net/kcc";

async function initDB() {
  const client = new MongoClient(uri);
  await client.connect();
  console.log("MongoDB connection established");

  const database = client.db("kcc");
  return {
    client,
    kcc: {
      serials: database.collection("serials"),
      airtime: database.collection("airtime"),
    },
  };
}

const isEntryDuplicate = async (kcc, airtime) => {
  const existingEntry = await kcc.airtime.findOne({
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

  let client;

  try {
    const { client: initializedClient, kcc } = await initDB();
    client = initializedClient;

    // Find a serial number by denomination
    const serialEntry = await kcc.serials.findOneAndUpdate(
      {
        denomination: denomination,
        serials: { $exists: true, $not: { $size: 0 } },
      },
      { $pop: { serials: -1 } }, // Pop the first serial from the array
      { returnDocument: "after" }
    );

    if (!serialEntry.value) {
      return res
        .status(404)
        .json({ message: "No serials available for this denomination" });
    }

    const serialToMove = serialEntry.value.serials[0];

    const airtimeEntry = {
      phoneNumber,
      serialNumber: serialToMove,
      denomination,
      createdAt: new Date(),
    };

    const isDuplicated = await isEntryDuplicate(kcc, airtimeEntry);
    if (isDuplicated) {
      return res.status(400).json({
        success: false,
        message: "Duplicate record detected",
      });
    }

    // Insert the serial into the airtime collection
    await kcc.airtime.insertOne(airtimeEntry);
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
  } finally {
    if (client) {
      await client.close();
    }
  }
};

module.exports = { selectSerialAndMoveToAirtime };
