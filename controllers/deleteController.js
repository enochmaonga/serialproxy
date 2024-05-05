const express = require("express");
const bcryptjs = require("bcryptjs");
const { MongoClient, ObjectId } = require("mongodb");
const uri = "mongodb+srv://maongaenoch:P6QpXaBRe8zHA5gI@cluster0.gqnfqjq.mongodb.net/kcc";

async function initDB() {
  const client = new MongoClient(uri);
  await client.connect();
  const database = client.db("kcc");
  const collection = database.collection("users");
  const kcc = {
    users: collection,
  };

  return { client, kcc };
}

const handleDeleteUser = async (req, res) => {
  const { userId } = req.params;

  console.log("User ID:", userId); // Debugging

  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ message: "User ID is required" });
  }

  let client;

  try {
    const { client: initializedClient, kcc } = await initDB();
    client = initializedClient;

    // Check if the user exists
    const user = await kcc.users.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete the user
    await kcc.users.deleteOne({ _id: new ObjectId(userId) });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (client) {
      await client.close();
    }
  }
};

module.exports = { handleDeleteUser };
