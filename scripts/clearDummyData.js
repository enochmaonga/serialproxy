require("dotenv").config();
const { getDb, connectDB } = require("../config/db");

async function clearDummyData() {
  try {
    await connectDB();
    const db = getDb();

    const serialsCountBefore = await db.collection("serials").countDocuments();
    const airtimeCountBefore = await db.collection("airtime").countDocuments();

    console.log(`Before cleanup: ${serialsCountBefore} serials, ${airtimeCountBefore} airtime records.`);

    const serialsResult = await db.collection("serials").deleteMany({});
    const airtimeResult = await db.collection("airtime").deleteMany({});

    console.log(`Deleted ${serialsResult.deletedCount} documents from 'serials' collection.`);
    console.log(`Deleted ${airtimeResult.deletedCount} documents from 'airtime' collection.`);

    const serialsCountAfter = await db.collection("serials").countDocuments();
    const airtimeCountAfter = await db.collection("airtime").countDocuments();

    console.log(`After cleanup: ${serialsCountAfter} serials, ${airtimeCountAfter} airtime records.`);
    console.log("✅ Dummy data successfully cleared from database!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error clearing dummy data:", err);
    process.exit(1);
  }
}

clearDummyData();
