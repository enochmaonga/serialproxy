const express = require("express");
const router = express.Router();
const { getDb } = require("../config/db");
const { ObjectId } = require("mongodb");

/**
 * Generate sequential document numbers starting with:
 * R24-01, R24-02, R24-03, etc.
 */
const generateDocumentNumber = async (db) => {
  const prefix = "R24-";
  const invoicesCollection = db.collection("invoices");

  const existing = await invoicesCollection
    .find({ documentNo: { $regex: `^${prefix}` } })
    .project({ documentNo: 1 })
    .toArray();

  let maxSeq = 0;
  existing.forEach((doc) => {
    if (doc.documentNo) {
      const match = String(doc.documentNo).match(/^R24-(\d+)/);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxSeq) maxSeq = num;
      }
    }
  });

  const nextSeq = String(maxSeq + 1).padStart(2, "0");
  return `${prefix}${nextSeq}`;
};

// GET /invoices/next-number - Fetch next auto-generated document number
router.get("/next-number", async (req, res) => {
  try {
    const db = getDb();
    const nextDocNo = await generateDocumentNumber(db);
    res.json({ success: true, documentNo: nextDocNo });
  } catch (error) {
    console.error("Error generating next document number:", error);
    res.json({ success: true, documentNo: "R24-01" });
  }
});

// GET /invoices - List saved proforma invoices
router.get("/", async (req, res) => {
  try {
    const db = getDb();
    const invoicesCollection = db.collection("invoices");

    const { search, limit = 50 } = req.query;
    let query = {};

    if (search && search.trim()) {
      const regex = { $regex: search.trim(), $options: "i" };
      query = {
        $or: [{ documentNo: regex }, { customer: regex }, { shop: regex }, { contactPhone: regex }],
      };
    }

    const invoices = await invoicesCollection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10) || 50)
      .toArray();

    res.json({ success: true, invoices });
  } catch (error) {
    console.error("Error fetching proforma invoices:", error);
    res.status(500).json({ success: false, error: "Failed to fetch invoices" });
  }
});

// GET /invoices/:id - Retrieve single invoice
router.get("/:id", async (req, res) => {
  try {
    const db = getDb();
    const invoicesCollection = db.collection("invoices");
    const { id } = req.params;

    let query = { documentNo: id };
    if (ObjectId.isValid(id)) {
      query = { $or: [{ _id: new ObjectId(id) }, { documentNo: id }] };
    }

    const invoice = await invoicesCollection.findOne(query);
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    res.json({ success: true, invoice });
  } catch (error) {
    console.error("Error retrieving invoice:", error);
    res.status(500).json({ success: false, error: "Failed to retrieve invoice" });
  }
});

// POST /invoices - Save or update proforma invoice
router.post("/", async (req, res) => {
  try {
    const db = getDb();
    const invoicesCollection = db.collection("invoices");

    const {
      documentNo,
      date,
      shop,
      customer,
      contactName,
      contactPhone,
      vatNo = "011324A",
      pinNo = "P051129820X",
      items = [],
      total = 0,
      terms,
      notes,
      bankDetails,
    } = req.body;

    if (!documentNo || !customer) {
      return res.status(400).json({
        success: false,
        message: "Document Number and Customer Name are required.",
      });
    }

    const invoicePayload = {
      documentNo: String(documentNo).trim(),
      date: date || new Date().toLocaleDateString("en-GB"),
      shop: shop || "Safaricom Shop",
      customer: String(customer).trim(),
      contactName: contactName || "",
      contactPhone: contactPhone || "",
      vatNo: vatNo || "011324A",
      pinNo: pinNo || "P051129820X",
      items: Array.isArray(items) ? items : [],
      total: Number(total) || 0,
      terms: terms || "",
      notes: notes || "",
      bankDetails: bankDetails || "",
      updatedAt: new Date(),
    };

    // Upsert by documentNo: update if already exists, insert if new
    const existing = await invoicesCollection.findOne({ documentNo: invoicePayload.documentNo });
    if (existing) {
      await invoicesCollection.updateOne(
        { _id: existing._id },
        { $set: invoicePayload }
      );
      return res.status(200).json({
        success: true,
        message: `Invoice ${invoicePayload.documentNo} updated successfully`,
        documentNo: invoicePayload.documentNo,
        id: existing._id,
      });
    }

    invoicePayload.createdAt = new Date();
    const result = await invoicesCollection.insertOne(invoicePayload);

    res.status(201).json({
      success: true,
      message: `Invoice ${invoicePayload.documentNo} saved successfully`,
      documentNo: invoicePayload.documentNo,
      id: result.insertedId,
    });
  } catch (error) {
    console.error("Error saving proforma invoice:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while saving invoice",
      error: error.message,
    });
  }
});

// DELETE /invoices/:id - Delete an invoice
router.delete("/:id", async (req, res) => {
  try {
    const db = getDb();
    const invoicesCollection = db.collection("invoices");
    const { id } = req.params;

    let query = { documentNo: id };
    if (ObjectId.isValid(id)) {
      query = { $or: [{ _id: new ObjectId(id) }, { documentNo: id }] };
    }

    const result = await invoicesCollection.deleteOne(query);
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    res.json({ success: true, message: "Invoice deleted successfully" });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    res.status(500).json({ success: false, error: "Failed to delete invoice" });
  }
});

module.exports = router;
