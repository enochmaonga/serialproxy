const { MongoClient } = require("mongodb");
const sprintf = require("sprintf-js").sprintf;
const { format } = require("date-fns");

const uri =
  "mongodb+srv://maongaenoch:P6QpXaBRe8zHA5gI@cluster0.gqnfqjq.mongodb.net/kcc";

async function initDB() {
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await client.connect();
  console.log("Connected to MongoDB");
  const database = client.db("kcc");
  const serialCollection = database.collection("serials");
  const airtimeCollection = database.collection("airtime"); // Airtime collection
  return { client, serialCollection, airtimeCollection };
}

const generateSerials = async (req, res) => {
  const { denomination, serials } = req.body;

  const start = parseInt(req.body.startSerial, 10);
  const end = parseInt(req.body.endSerial, 10);

  const generatedSerials = Array.from({ length: end - start + 1 }, (_, i) =>
    sprintf("%018d", start + i)
  );

  if (!denomination || !Array.isArray(serials) || serials.length === 0) {
    return res.status(400).json({ message: "Invalid input data" });
  }

  let client;

  try {
    const { client: initializedClient, serialCollection } = await initDB();
    client = initializedClient;

    const serialDocs = serials.map((serial) => ({
      serial,
      denomination,
      createdAt: new Date(),
    }));

    const result = await serialCollection.insertMany(serialDocs);

    console.log("Serials inserted successfully:", result.insertedCount);

    const humanReadableSerials = serialDocs.map((doc) => ({
      ...doc,
      createdAt: format(doc.createdAt, "MMM dd, yyyy, hh:mm a"), // Format the date
    }));

    res.status(201).json({
      success: true,
      message: "Serials uploaded successfully!",
      serials: humanReadableSerials,
    });
  } catch (error) {
    console.error("Error saving serials:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save serials to the database",
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
};

// Fetch and mark a single serial as used, then move it to the Airtime collection
const pickSerial = async (req, res) => {
  let client;

  try {
    const {
      client: initializedClient,
      serialCollection,
      airtimeCollection,
    } = await initDB();
    client = initializedClient;

    // Find the first unused serial
    const serial = await serialCollection.findOneAndUpdate(
      { used: { $ne: true } }, // Find serials that are not used
      { $set: { used: true } }, // Mark the serial as used
      { returnDocument: "after" }
    );

    if (!serial.value) {
      return res.status(404).json({ message: "No unused serials available" });
    }

    // Move the serial to the Airtime collection
    await airtimeCollection.insertOne(serial.value);
    console.log("Serial moved to Airtime collection");

    // Remove the serial from the original collection
    await serialCollection.deleteOne({ _id: serial.value._id });
    console.log("Serial removed from original collection");

    res.status(200).json({ success: true, serial: serial.value });
  } catch (error) {
    console.error("Error picking and moving serial:", error);
    res.status(500).json({
      success: false,
      message: "Failed to pick and move serial",
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
};

module.exports = { generateSerials, pickSerial };
