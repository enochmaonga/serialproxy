const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Define a Mongoose model for your user collection
const User = mongoose.model('User', {
  username: String,
  password: String,
  userType: String,
});

mongoose.connect('mongodb://127.0.0.1:27017/kcc', { useNewUrlParser: true, useUnifiedTopology: true });



router.post('/', async (req, res) => {
  const { username, password } = req.body;
console.log("Login", req.body);
console.log('Retrieved User:', User);

  try {
    // Search for the user in the database
    const user = await User.findOne({ username: { $regex: new RegExp(username, 'i') } });
    console.log('User Data:', user);

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    // Check if the provided password matches the stored hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('Entered Password:', password);
    console.log('Stored Password:', user.password);
    console.log('Password Match:', passwordMatch);

    if (passwordMatch) {
      // Generate a JWT token and send it back to the client
      const token = jwt.sign({ username: user.username, userType: user.userType }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h',
      });
      console.log('Generated Token:', token);
     
      // Log the user login response
      console.log('User login successful:', { username: user.username, token });
      console.log('Generated Token:', token);

      res.json({ token, username: user.username, userId: user._id });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
    // console.log('Response Data:', res.json);
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error' });
  }
});

module.exports = router;