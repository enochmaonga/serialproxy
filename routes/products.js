const express = require("express");
const router = express.Router();
const { getDb } = require("../config/db");
const { ObjectId } = require("mongodb");

const INITIAL_PRODUCTS = [
  { itemCode: "DEV15072", description: "Huawei 5G Indoor CPE H173-381", unitPrice: 2999 },
  { itemCode: "S0100100", description: "Recharge Voucher 100", unitPrice: 100 },
  { itemCode: "S0101000", description: "Recharge Voucher 1000 Each", unitPrice: 1000 },
  { itemCode: "S0100050", description: "Recharge Voucher 50", unitPrice: 50 },
  { itemCode: "S0100500", description: "Recharge Voucher 500 Each", unitPrice: 500 },
  { itemCode: "DEV15846", description: "Samsung Galaxy S26 FE 256GB -Black", unitPrice: 104999 },
  { itemCode: "DEV14768", description: "Samsung Galaxy S26 Ultra 12GB 512GB", unitPrice: 199999 },
];

// Helper to seed initial products
const ensureInitialProducts = async (productsCollection) => {
  const count = await productsCollection.countDocuments();
  if (count === 0) {
    const docs = INITIAL_PRODUCTS.map((p) => ({
      ...p,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    await productsCollection.insertMany(docs);
    console.log("✅ Seeded initial products into MongoDB");
  }
};

// GET /products - List all products or search by itemCode / description
router.get("/", async (req, res) => {
  try {
    const db = getDb();
    const productsCollection = db.collection("products");

    await ensureInitialProducts(productsCollection);

    const { search } = req.query;
    let query = {};

    if (search && search.trim()) {
      const regex = { $regex: search.trim(), $options: "i" };
      query = {
        $or: [{ itemCode: regex }, { description: regex }],
      };
    }

    const products = await productsCollection
      .find(query)
      .sort({ description: 1 })
      .toArray();

    res.json({ success: true, products });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ success: false, error: "Failed to fetch products" });
  }
});

// POST /products - Add a new product
router.post("/", async (req, res) => {
  try {
    const db = getDb();
    const productsCollection = db.collection("products");

    const { itemCode, description, unitPrice } = req.body;

    if (!description || unitPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: "Description and unitPrice are required.",
      });
    }

    const newProduct = {
      itemCode: itemCode ? String(itemCode).trim().toUpperCase() : "",
      description: String(description).trim(),
      unitPrice: Number(String(unitPrice).replace(/,/g, "")) || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await productsCollection.insertOne(newProduct);
    res.status(201).json({
      success: true,
      message: "Product added successfully",
      product: { ...newProduct, _id: result.insertedId },
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ success: false, error: "Failed to create product" });
  }
});

// POST /products/seed - Explicit reseed or add missing initial products
router.post("/seed", async (req, res) => {
  try {
    const db = getDb();
    const productsCollection = db.collection("products");

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
    }

    const all = await productsCollection.find().toArray();
    res.json({ success: true, message: "Products seeded successfully", count: all.length, products: all });
  } catch (error) {
    console.error("Error seeding products:", error);
    res.status(500).json({ success: false, error: "Failed to seed products" });
  }
});

// DELETE /products/:id
router.delete("/:id", async (req, res) => {
  try {
    const db = getDb();
    const productsCollection = db.collection("products");
    const { id } = req.params;

    let query = { _id: id };
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    }

    const result = await productsCollection.deleteOne(query);
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, message: "Product deleted" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ success: false, error: "Failed to delete product" });
  }
});

module.exports = router;
