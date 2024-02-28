const express = require("express");
const router = express.Router();
const { MongoClient } = require("mongodb");
const jwt = require('jsonwebtoken');

require('dotenv').config(); // Load environment variables from .env file
const jwtSecretKey = process.env.JWT_SECRET_KEY || 'default-secret-key';

// Connect to MongoDB
const dbConnection = async () => {
  const client = new MongoClient("mongodb://127.0.0.1:27017/kcc", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    return client.db("kcc");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};

// Authentication middleware
const authenticate = (req, res, next) => {
  const authToken = req.headers.authorization;
  if (!authToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authToken.split(' ')[1]; // Remove Bearer from token
  jwt.verify(token, jwtSecretKey, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Forbidden: Invalid token" });
    }
    req.user = decoded; // Set user information in request object
    next();
  });
};

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const db = await dbConnection();
  const user = await db.collection("users").findOne({ username: username });

  if (!user || password !== user.password) {
    return res.status(401).json({ error: "Incorrect username or password." });
  }

  const authToken = jwt.sign({ userId: user._id }, jwtSecretKey, { expiresIn: '1h' });
  res.json({ success: true, authToken });
});

router.get("/", authenticate, async (req, res) => {
  const db = await dbConnection();
  const formCollection = db.collection("form");

  try {
    const form = await formCollection.find().toArray();

    if (form && Array.isArray(form)) {
      console.log(form);
      res.json({ body: form });
    } else {
      res.status(404).json({ error: "No Data" });
    }
  } catch (error) {
    console.error("Error retrieving Spares items:", error);
    res.status(500).json({ error: "Failed to retrieve spares items" });
  }
});

module.exports = router;