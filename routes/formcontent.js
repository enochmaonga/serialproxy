const express = require("express");
const router = express.Router();
const { MongoClient } = require("mongodb");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

// Initialize Passport
router.use(passport.initialize());
router.use(passport.session());

// Connect to MongoDB and configure Passport
const dbConnection = async () => {
  const client = new MongoClient("mongodb://your-mongodb-connection-string", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    return client.db("your-database-name");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};

// Passport serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  const db = await dbConnection();
  const user = await db.collection("users").findOne({ _id: id });
  done(null, user);
});

// Passport local strategy for authentication
passport.use(
  new LocalStrategy(async (username, password, done) => {
    const db = await dbConnection();
    const user = await db.collection("users").findOne({ username: username });

    if (!user) {
      return done(null, false, { message: "Incorrect username." });
    }

    if (password !== user.password) {
      return done(null, false, { message: "Incorrect password." });
    }

    return done(null, user);
  })
);

// Authentication middleware
const authenticate = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
};

router.post("/login", passport.authenticate("local"), (req, res) => {
  res.json({ success: true });
});

router.get("/", authenticate, async (req, res) => {
  const db = req.app.locals.db; // Access the MongoDB database
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
