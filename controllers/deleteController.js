const { ObjectId } = require("mongodb");
const { getDb } = require("../config/db");

const handleDeleteUser = async (req, res) => {
  const { userId } = req.params;

  if (!userId || typeof userId !== "string") {
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

module.exports = { handleDeleteUser };
