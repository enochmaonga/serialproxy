const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

const { MongoClient } = require("mongodb");

// Use cors middleware
app.use(cors());

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Define MongoDB schema and model (you may want to create a separate file for this)
const submissionSchema = new mongoose.Schema({
  name: String,
  homeChurch: String,
  department: String,
  phoneNumber: String,
});

// Specify the collection name as 'form'
const Submission = mongoose.model('Submission', submissionSchema, 'form');

// Define routes
app.use("/newEntry", require("./routes/newEntry"));
app.use("/formcontent", require("./routes/formcontent"));


console.log('New entry confirmed' );

app.get('/get-submissions', async (req, res) => {
  try {
    const submissions = await Submission.find();
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
const url = "mongodb://127.0.0.1:27017/kcc";

const client = new MongoClient(url);

// Start the server
async function connectToMongoDB() {
    try {
      await client.connect();
      console.log("Connected to MongoDB");
  
      // Set a reference to your MongoDB database
      app.locals.db = client.db();
  
      // Start your Express server after connecting to MongoDB
      app.listen(port, () => {
        console.log(`kcc listening at http://localhost:${port}`);
      });
    } catch (error) {
      console.error("Error connecting to MongoDB", error);
    }
  }
  
  connectToMongoDB();