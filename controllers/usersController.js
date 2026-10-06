const bcryptjs = require("bcryptjs");
const { ObjectId } = require("mongodb");
const { getDb } = require("../config/db");

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

  try {
    const db = getDb();
    const usersCollection = db.collection("users");

    // Check for duplicates in the database
    const duplicate = await usersCollection.findOne({ username });
    if (duplicate) {
      return res.status(409).json({ message: "Username already exists" });
    }

    // Encrypt the password
    const hashedPwd = await bcryptjs.hash(password, 10);

    // Store the new user with the hashed password
    const newUser = {
      firstName,
      middleName,
      lastName,
      email,
      username,
      password: hashedPwd,
      phoneNumber,
      userType,
      isActive: true,
      createdAt: new Date(),
    };

    await usersCollection.insertOne(newUser);

    const newUserResponse = [
      {
        firstName,
        middleName,
        lastName,
        email,
        username,
        phoneNumber,
        userType,
      },
    ];

    res.status(201).json(newUserResponse);
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ message: err.message });
  }
};

const handleDeleteUser = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const db = getDb();
    const usersCollection = db.collection("users");

    const query = ObjectId.isValid(userId) ? { _id: new ObjectId(userId) } : { _id: userId };
    const user = await usersCollection.findOne(query);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await usersCollection.deleteOne(query);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { handleNewUser, handleDeleteUser };
