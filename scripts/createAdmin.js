require("dotenv").config();
const bcryptjs = require("bcryptjs");
const { getDb, connectDB } = require("../config/db");

async function createAdmin() {
  const args = process.argv.slice(2);
  
  // CLI arguments or standard defaults
  const username = (args[0] || process.env.ADMIN_USERNAME || "admin").trim();
  const password = (args[1] || process.env.ADMIN_PASSWORD || "Admin@2026!").trim();
  const email = (args[2] || "admin@retail.co.ke").trim();
  const phoneNumber = (args[3] || "0700000000").trim();
  const firstName = (args[4] || "System").trim();
  const lastName = (args[5] || "Admin").trim();
  const userType = "admin";

  try {
    await connectDB();
    const db = getDb();
    const usersCollection = db.collection("users");

    // Check if user already exists
    const existing = await usersCollection.findOne({
      username: { $regex: new RegExp(`^${username}$`, "i") }
    });

    const hashedPassword = await bcryptjs.hash(password, 10);

    if (existing) {
      console.log(`⚠️ User '${username}' already exists. Updating credentials to Admin role...`);
      await usersCollection.updateOne(
        { _id: existing._id },
        {
          $set: {
            password: hashedPassword,
            userType: "admin",
            isActive: true,
            updatedAt: new Date()
          }
        }
      );
      console.log(`✅ Admin user '${username}' successfully updated!`);
    } else {
      const newAdmin = {
        username,
        password: hashedPassword,
        email,
        phoneNumber,
        firstName,
        middleName: "",
        lastName,
        userType: "admin",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await usersCollection.insertOne(newAdmin);
      console.log(`✅ New Admin user '${username}' created successfully!`);
    }

    console.log("\n----------------------------------------");
    console.log("🔑 ADMIN LOGIN CREDENTIALS:");
    console.log(`   Username : ${username}`);
    console.log(`   Password : ${password}`);
    console.log(`   Role     : admin`);
    console.log("----------------------------------------\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to create admin user:", err);
    process.exit(1);
  }
}

createAdmin();
