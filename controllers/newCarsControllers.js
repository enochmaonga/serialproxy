const { MongoClient } = require("mongodb");

const uri =
  "mongodb+srv://maongaenoch:P6QpXaBRe8zHA5gI@cluster0.gqnfqjq.mongodb.net/kcc";

let cachedClient = null;

async function initDB() {
  if (cachedClient) {
    console.log("Reusing existing MongoDB connection");
    return {
      client: cachedClient,
      kcc: {
        airtime: cachedClient.db("kcc").collection("airtime"),
        serials: cachedClient.db("kcc").collection("serials"),
      },
    };
  }

  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log("MongoDB connection established");
    cachedClient = client;

    const database = client.db("kcc");
    return {
      client,
      kcc: {
        airtime: database.collection("airtime"),
        serials: database.collection("serials"),
      },
    };
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    throw new Error("Database connection failed");
  }
}

const handleNewCars = async (req, res) => {
  const { phoneNumber, denomination } = req.body;

  if (!phoneNumber || !denomination) {
    return res
      .status(400)
      .json({ message: "Phone number and denomination are required" });
  }

  let client;

  try {
    const { client: initializedClient, kcc } = await initDB();
    client = initializedClient;

    // Ensure denominationValue is a string to match the database schema
    const denominationValue =
      typeof denomination === "string" ? denomination : denomination.toString();

    // Find one serial
    const serialData = await kcc.serials.findOne({
      denomination: denominationValue, // Match the type in the database
    });

    console.log("Query Parameters:", { denominationValue });
    console.log("Serial Data:", serialData);

    if (!serialData) {
      return res
        .status(404)
        .json({ message: `No available serials found for this denomination` });
    }
    if (serialData) {
      const { deletedCount } = await kcc.serials.deleteOne({
        _id: serialData._id,
      });
      if (deletedCount === 1) {
        console.log("Serial successfully deleted from serials collection");
      } else {
        console.warn("Unexpected deletion count:", deletedCount);
      }
    }
    const airtime = {
      serial: serialData.serial,
      denomination: denominationValue, // Keep this consistent as a string
      phoneNumber,
      createdAt: new Date(),
    };

    // Check for duplicate record
    const existingEntry = await kcc.airtime.findOne({
      serial: airtime.serial,
      phoneNumber: airtime.phoneNumber,
    });

    if (existingEntry) {
      return res.status(400).json({ message: "Duplicate record detected" });
    }

    // Insert the serial into the `airtime` collection
    await kcc.airtime.insertOne(airtime);

    res.status(201).json({
      success: true,
      data: airtime,
      message: "Airtime entry created successfully",
    });
  } catch (err) {
    console.error("Error processing new airtime entry:", err.message);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (client && !cachedClient) {
      await client.close();
    }
  }
};

module.exports = { handleNewCars };
