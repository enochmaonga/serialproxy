const mongoose = require("mongoose");

let isConnected = false;

/**
 * Connect to MongoDB using Mongoose (which manages the shared connection pool)
 */
const connectDB = async () => {
  if (isConnected) {
    console.log("Using existing MongoDB connection");
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;

  if (!uri) {
    console.error("❌ MONGODB_URI is not defined in environment variables!");
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      // Options in Mongoose 8.x
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = conn.connection.readyState === 1;

    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);

    // Event listeners for connection monitoring
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected. Attempting to reconnect...");
      isConnected = false;
    });

    return conn.connection;
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error.message);
    throw error;
  }
};

/**
 * Get native MongoDB Db object from Mongoose connection
 * Useful for collection-based operations without requiring schemas
 * @param {string} [dbName] - Optional database name
 * @returns {import('mongodb').Db}
 */
const getDb = (dbName) => {
  if (!mongoose.connection || mongoose.connection.readyState !== 1) {
    throw new Error("Database not connected yet. Call connectDB() first.");
  }
  return dbName ? mongoose.connection.client.db(dbName) : mongoose.connection.db;
};

/**
 * Close database connection cleanly (for graceful shutdowns)
 */
const closeDB = async () => {
  if (mongoose.connection && mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    isConnected = false;
    console.log("MongoDB connection closed cleanly.");
  }
};

module.exports = {
  connectDB,
  getDb,
  closeDB,
  mongoose,
};
