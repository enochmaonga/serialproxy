const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Add express-session middleware
router.use(session({
    secret: 'your-secret-key',  // Replace with your secret key
    resave: false,
    saveUninitialized: false,
  }));

// Define a Mongoose model for your user collection
const User = mongoose.model('User', {
  username: String,
  password: String,
});

// MongoDB connection setup
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });


// Configure Passport with LocalStrategy
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await User.findOne({ username: { $regex: new RegExp(username, 'i') } });

    if (!user) {
      return done(null, false, { message: 'User not found' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (passwordMatch) {
      return done(null, user);
    } else {
      return done(null, false, { message: 'Invalid username or password' });
    }
  } catch (err) {
    return done(err);
  }
}));

// Configure Passport with JwtStrategy
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.ACCESS_TOKEN_SECRET,
}, (jwtPayload, done) => {
  return done(null, jwtPayload);
}));

// Login route using Passport LocalStrategy
router.post('/', passport.authenticate('local'), (req, res) => {
  const token = jwt.sign({ username: req.user.username }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '1h',
  });

  res.json({ token, username: req.user.username, userId: req.user._id });
});

module.exports = router;