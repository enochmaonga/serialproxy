const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

const uri = 'mongodb+srv://maongaenoch:P6QpXaBRe8zHA5gI@cluster0.gqnfqjq.mongodb.net/kcc';

async function initDB() {
  const client = new MongoClient(uri);
  await client.connect();

  console.log('MongoDB connection established');
  const database = client.db('kcc');
  const collection = database.collection('form'); 
  const kcc = {
    form: collection,
  };

  return { client, kcc };
}

const isEntryDuplicate = async (kcc, form) => {
  const existingEntry = await kcc.form.findOne({
    // Define your criteria for duplicate checking, for example:

    name: form.name,
    department: form.department,
    homeChurch: form.homeChurch,
    phoneNumber: form.phoneNumber,
   
  });

  return existingEntry !== null;
};

const handleNewEntry = async (req, res) => {
    const {
        name,
        department,
        homeChurch,
      phoneNumber,
    } = req.body;
  
    if (
      !name ||
      !department ||
      !homeChurch ||
      !phoneNumber
     
    ) {
      console.error('Validation error: All fields are required');
      console.log('Received Data:', req.body);
      return res.status(400).json({ message: 'All fields are required' });
    }
  
    let client; // Declare client outside of the try block
  
    try {
      const { client: initializedClient, kcc } = await initDB();
      client = initializedClient; // Assign the initialized client to the outer client variable
      console.log('Database initialized');
      // Create a new booking object
    const createdAt = new Date();
    const formattedCreatedAt = createdAt.toLocaleString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }); 
      const form = {
        name,
        department,
        homeChurch,
        phoneNumber,
        createdAt: formattedCreatedAt,
      };

      //check duplicate booking
      const isDuplicated = await isEntryDuplicate(kcc, form);
      if (isDuplicated) {
        return res.status(400).json({ success:false, message: "Duplicate booking detected", errorType: "duplicate"});
      }
  
      // Insert the new booking into the database
      await kcc.form.insertOne(form); // Corrected line
      console.log('New Entry inserted into the database');
  
      // Return an array with the new booking object
      const formArray = [form];
      res.status(201).json({ success: true, data: formArray, message: "Entry created successfully"});
    } catch (err) {
      console.error('Error processing new entry:', err.message);
      res.status(500).json({success: false, message: "Internal server error", errorType: "internal_error"});
    } finally {
      // Close the MongoDB connection if it was established
      if (client) {
        await client.close();
      }
    }
  };
  
  module.exports = { handleNewEntry };