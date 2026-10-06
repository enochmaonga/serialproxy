const { format } = require("date-fns");
const { getDb } = require("../config/db");

let indexesEnsured = false;

const ensureSerialIndexes = async (db) => {
  if (indexesEnsured) return;
  try {
    await db.collection("serials").createIndex({ serial: 1 }, { unique: true });
    await db.collection("airtime").createIndex({ serial: 1 }, { unique: true });
    indexesEnsured = true;
  } catch (err) {
    // Index may already exist or have duplicates from older data
    console.warn("Index initialization notice:", err.message);
  }
};

const generateSerials = async (req, res) => {
  const { denomination, serials } = req.body;

  if (!denomination || !Array.isArray(serials) || serials.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid input data: denomination and non-empty serials array are required",
    });
  }

  // Validate that all serials are non-empty strings
  const cleanedSerials = serials
    .map((s) => (typeof s === "string" ? s.trim() : String(s).trim()))
    .filter(Boolean);

  if (cleanedSerials.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No valid serial numbers provided",
    });
  }

  try {
    const db = getDb();
    await ensureSerialIndexes(db);

    const serialCollection = db.collection("serials");
    const airtimeCollection = db.collection("airtime");

    // Check for duplicates in existing serials pool
    const existingInSerials = await serialCollection
      .find({ serial: { $in: cleanedSerials } })
      .project({ serial: 1 })
      .toArray();

    // Check for duplicates in already issued airtime pool
    const existingInAirtime = await airtimeCollection
      .find({ serial: { $in: cleanedSerials } })
      .project({ serial: 1 })
      .toArray();

    const existingDuplicates = [
      ...existingInSerials.map((d) => d.serial),
      ...existingInAirtime.map((d) => d.serial),
    ];

    if (existingDuplicates.length > 0) {
      const sample = existingDuplicates.slice(0, 3).join(", ");
      return res.status(409).json({
        success: false,
        message: `Duplicate serials detected! ${existingDuplicates.length} serials already exist in database (e.g., ${sample}).`,
        duplicates: existingDuplicates,
      });
    }

    const serialDocs = cleanedSerials.map((serial) => ({
      serial,
      denomination: String(denomination).trim(),
      createdAt: new Date(),
    }));

    const result = await serialCollection.insertMany(serialDocs, { ordered: false });
    console.log(`✅ ${result.insertedCount} serials inserted successfully for denomination ${denomination}`);

    const humanReadableSerials = serialDocs.map((doc) => ({
      ...doc,
      createdAt: format(doc.createdAt, "MMM dd, yyyy, hh:mm a"),
    }));

    res.status(201).json({
      success: true,
      message: `${result.insertedCount} serials uploaded successfully!`,
      serials: humanReadableSerials,
    });
  } catch (error) {
    console.error("Error saving serials:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate serial number detected during database insertion.",
      });
    }
    res.status(500).json({
      success: false,
      message: "Failed to save serials to the database",
      error: error.message,
    });
  }
};

// Fetch and mark a single serial as used, then move it to the Airtime collection
const pickSerial = async (req, res) => {
  try {
    const db = getDb();
    const serialCollection = db.collection("serials");
    const airtimeCollection = db.collection("airtime");

    // Atomically find and delete from serials pool to prevent race conditions
    const serialDoc = await serialCollection.findOneAndDelete(
      { used: { $ne: true } }
    );

    const doc = serialDoc && serialDoc.value !== undefined ? serialDoc.value : serialDoc;

    if (!doc) {
      return res.status(404).json({ success: false, message: "No unused serials available" });
    }

    // Move the serial to the Airtime collection
    await airtimeCollection.insertOne({
      ...doc,
      usedAt: new Date(),
    });

    res.status(200).json({ success: true, serial: doc });
  } catch (error) {
    console.error("Error picking and moving serial:", error);
    res.status(500).json({
      success: false,
      message: "Failed to pick and move serial",
    });
  }
};

module.exports = { generateSerials, pickSerial };
