const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');

router.get('/', async (req, res) => {
  const db = req.app.locals.db; // Access the MongoDB database
  const formCollection = db.collection('form'); // Replace 'users' with your actual collection name

  try {
    const form = await formCollection.find().toArray();

    if (form && Array.isArray(form)) {
      res.json(form);
    } else {
      res.status(404).json({ error: 'No users found' });
    }
  } catch (error) {
    console.error('Error retrieving users:', error);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

module.exports = router;