const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();


const port = process.env.PORT || 5001;

const { MongoClient } = require("mongodb");

// Use cors middleware

// CORS configuration
// app.use(cors({
//   origin: 'https://mform-orpin.vercel.app',
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true
// }));
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
app.use("/form", require("./routes/form"));
app.use("/login", require("./routes/login"));
app.use("/users", require("./routes/users"));
app.use("/delete", require("./routes/delete"));
app.use("/deactivate", require("./routes/deactivate"));
app.use("/usershow", require("./routes/usershow"));
app.use("/content", require("./routes/content"));
app.use("/fetchusers", require("./routes/fetchusers"));
app.use("/newCars", require("./routes/newCars"));

app.get('/', (req, res) => {
  res.send('Hello, Render! Your server is up and running.');
});


console.log('New entry confirmed' );

app.get('/get-submissions', async (req, res) => {
  try {
    const submissions = await Submission.find();
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const url = "mongodb+srv://maongaenoch:P6QpXaBRe8zHA5gI@cluster0.gqnfqjq.mongodb.net/kcc";

const client = new MongoClient(url);

// Start the server
async function connectToMongoDB() {
    try {
      await client.connect();
      console.log("Connected to MongoDB");
  
      // Set a reference to your MongoDB database
      app.locals.db = client.db();
  
      // Start your Express server after connecting to MongoDB
      app.listen(port, '0.0.0.0', () => {
        console.log(`kcc listening at http://0.0.0.0:${port}`);
      });
    } catch (error) {
      console.error("Error connecting to MongoDB", error);
    }
  }
  
  connectToMongoDB();