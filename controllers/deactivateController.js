const { ObjectId } = require("mongodb");
const { getDb } = require("../config/db");

const handleDeactivateUser = async (req, res) => {
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

    // Toggle or set isActive to false
    await usersCollection.updateOne(query, { $set: { isActive: false } });

    res.status(200).json({ message: "User deactivated successfully" });
  } catch (err) {
    console.error("Error deactivating user:", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { handleDeactivateUser };
