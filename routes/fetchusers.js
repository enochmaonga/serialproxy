const express = require('express');
const router = express.Router();
const { MongoClient } = require("mongodb");

router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db; // Access the MongoDB database from app.locals

    // Assuming 'users' is the collection name
    const usersCollection = db.collection('users');
    
    // Fetch all users from the collection
    const users = await usersCollection.find().toArray();

    res.json(users);
  } catch (error) {
    console.error("Error fetching users", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;