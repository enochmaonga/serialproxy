const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');

router.get('/', async (req, res) => {
  const db = req.app.locals.db; // Access the MongoDB database
  const formCollection = db.collection('form'); 

  try {
    const form = await formCollection.find().toArray();

    if (form && Array.isArray(form)) {
      console.log(form);
      res.json({body: form});
    } else {
      res.status(404).json({ error: 'No Data' });
    }
  } catch (error) {
    console.error('Error retrieving Spares items:', error);
    res.status(500).json({ error: 'Failed to retrieve spares items' });
  }
});

module.exports = router;