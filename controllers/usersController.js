const express = require("express");
const { MongoClient } = require("mongodb");
const bcrypt = require("bcrypt");

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

const handleNewUser = async (req, res) => {
  const {
    firstName,
    middleName,
    lastName,
    email,
    username,
    password,
    phoneNumber,
    userType,
  } = req.body;

  if (
    !username ||
    !password ||
    !firstName ||
    !middleName ||
    !lastName ||
    !email ||
    !phoneNumber ||
    !userType
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }
  console.log("entry", req.body);
  console.log('Confirm Data:', req.body);
  let client; // Declare client outside of the try block

  try {
    const { client: initializedClient, kcc } = await initDB();
    client = initializedClient; // Assign the initialized client to the outer client variable

    // Check for duplicates in the database
    const duplicate = await kcc.users.findOne({ username: username });
    if (duplicate) {
      return res.status(409).json({ message: "Username already exists" });
    }

    // Encrypt the password
    const hashedPwd = await bcrypt.hash(password, 10);

    // Store the new user with the hashed password
    const newUser = {
      firstName: firstName,
      middleName: middleName,
      lastName: lastName,
      email: email,
      username: username,
      password: hashedPwd,
      phoneNumber: phoneNumber,
      userType: userType,
    };

    // Insert the new user into the database
    await kcc.users.insertOne(newUser);

    // Return an array with the new user object
    const newUserArray = [
      {
        firstName,
        middleName,
        lastName,
        email,
        username,
        phoneNumber,
        userType,
        password,
      },
    ];
    res.status(201).json(newUserArray);
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    // Close the MongoDB connection if it was established
    if (client) {
      await client.close();
    }
  }
};


const handleDeleteUser = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  let client;

  try {
    const { client: initializedClient, kcc } = await initDB();
    client = initializedClient;

    // Check if the user exists
    const user = await kcc.users.findOne({ _id: ObjectID(userId) });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete the user
    await kcc.users.deleteOne({ _id: ObjectID(userId) });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (client) {
      await client.close();
    }
  }
};

module.exports = { handleNewUser, handleDeleteUser };
