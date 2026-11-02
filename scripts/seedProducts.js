require("dotenv").config();
const { connectDB, getDb, closeDB } = require("../config/db");

const INITIAL_PRODUCTS = [
  { itemCode: "DEV15072", description: "Huawei 5G Indoor CPE H173-381", unitPrice: 2999 },
  { itemCode: "S0100100", description: "Recharge Voucher 100", unitPrice: 100 },
  { itemCode: "S0101000", description: "Recharge Voucher 1000 Each", unitPrice: 1000 },
  { itemCode: "S0100050", description: "Recharge Voucher 50", unitPrice: 50 },
  { itemCode: "S0100500", description: "Recharge Voucher 500 Each", unitPrice: 500 },
  { itemCode: "DEV15846", description: "Samsung Galaxy S26 FE 256GB -Black", unitPrice: 104999 },
  { itemCode: "DEV14768", description: "Samsung Galaxy S26 Ultra 12GB 512GB", unitPrice: 199999 },
];

async function seed() {
  try {
    await connectDB();
    const db = getDb();
    const productsCollection = db.collection("products");

    await productsCollection.createIndex({ itemCode: 1 }, { unique: true, sparse: true });
    await productsCollection.createIndex({ description: "text" });

    for (const item of INITIAL_PRODUCTS) {
      await productsCollection.updateOne(
        { itemCode: item.itemCode },
        {
          $set: {
            itemCode: item.itemCode,
            description: item.description,
            unitPrice: item.unitPrice,
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      );
      console.log(`✅ Upserted [${item.itemCode}] ${item.description} - KES ${item.unitPrice.toLocaleString()}`);
    }

    const total = await productsCollection.countDocuments();
    console.log(`🎉 Products collection now contains ${total} items.`);
  } catch (error) {
    console.error("❌ Error seeding products:", error);
  } finally {
    await closeDB();
    process.exit(0);
  }
}

seed();
