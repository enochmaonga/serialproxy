require("dotenv").config();
const { getDb, connectDB } = require("../config/db");

async function run() {
  try {
    await connectDB();
    const db = getDb();
    const serialsCollection = db.collection("serials");
    const airtimeCollection = db.collection("airtime");

    console.log("--- STEP 1: Return tested serial to inventory ---");
    // Find the test serial in airtime
    const testRecord = await airtimeCollection.findOne({
      $or: [
        { serial: "02604130027333720" },
        { serial: "2604130027333720" },
        { phoneNumber: "0700112233" }
      ]
    });

    if (testRecord) {
      console.log("Found test record in airtime:", testRecord.serial, "issued to", testRecord.phoneNumber);
      // Remove from airtime
      await airtimeCollection.deleteOne({ _id: testRecord._id });
      console.log("Removed record from 'airtime' collection.");

      // Check if already in serials
      const cleanSerial = testRecord.serial.startsWith("0") && testRecord.serial.length === 17
        ? testRecord.serial.substring(1)
        : testRecord.serial;

      const existsInSerials = await serialsCollection.findOne({
        $or: [{ serial: testRecord.serial }, { serial: cleanSerial }]
      });

      if (!existsInSerials) {
        await serialsCollection.insertOne({
          serial: cleanSerial,
          denomination: testRecord.denomination || "50",
          createdAt: new Date(),
        });
        console.log(`Returned serial '${cleanSerial}' back to 'serials' pool.`);
      } else {
        console.log(`Serial already exists in 'serials' pool.`);
      }
    } else {
      console.log("No test record found in airtime (may have already been returned).");
    }

    console.log("\n--- STEP 2: Format all 17-digit serials to 16 digits (strip leading '0') ---");
    const allSerials = await serialsCollection.find({}).toArray();
    console.log(`Total serials in pool: ${allSerials.length}`);

    let updatedCount = 0;
    for (const doc of allSerials) {
      if (typeof doc.serial === "string" && doc.serial.length === 17 && doc.serial.startsWith("0")) {
        const newSerial = doc.serial.substring(1); // Strip leading zero -> 16 digits
        await serialsCollection.updateOne(
          { _id: doc._id },
          { $set: { serial: newSerial, updatedAt: new Date() } }
        );
        updatedCount++;
      }
    }
    console.log(`Updated ${updatedCount} serials to 16 digits (removed leading '0').`);

    // Verify after migration
    const updatedPool = await serialsCollection.find({}).sort({ serial: 1 }).toArray();
    console.log("\n--- VERIFICATION ---");
    console.log(`Total serials in 'serials': ${updatedPool.length}`);
    console.log(`Total records in 'airtime': ${await airtimeCollection.countDocuments()}`);
    console.log("Sample 16-digit serials (first 3):", updatedPool.slice(0, 3).map(s => `${s.serial} (${s.serial.length} digits)`));
    console.log("Sample 16-digit serials (last 3):", updatedPool.slice(-3).map(s => `${s.serial} (${s.serial.length} digits)`));
    
    const all16Digits = updatedPool.every(s => s.serial.length === 16 && !s.serial.startsWith("0"));
    console.log(`Are all serials exactly 16 digits and do NOT start with 0? ${all16Digits}`);

    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

run();
