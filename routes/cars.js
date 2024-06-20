const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');

router.get('/', async (req, res) => {
  const db = req.app.locals.db; // Access the MongoDB database
  const carsCollection = db.collection('cars'); // Replace 'users' with your actual collection name

  try {
    const cars = await carsCollection.find().toArray();

    if (cars && Array.isArray(cars)) {
      res.json(cars);
    } else {
      res.status(404).json({ error: 'No users found' });
    }
  } catch (error) {
    console.error('Error retrieving users:', error);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

module.exports = router;