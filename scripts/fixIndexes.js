// scripts/fixIndexes.js
// Run this once to fix the duplicate firebaseUid null issue

const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  }
};

const fixIndexes = async () => {
  try {
    const User = require("../src/models/User");

    // Drop all indexes on the users collection (except _id)
    console.log("🔄 Dropping existing indexes...");
    try {
      await User.collection.dropIndexes();
      console.log("✅ Indexes dropped");
    } catch (err) {
      if (err.message.includes("index not found")) {
        console.log("ℹ️  No indexes to drop");
      } else {
        throw err;
      }
    }

    // Sync schema indexes
    console.log("🔄 Syncing indexes from schema...");
    await User.syncIndexes();
    console.log("✅ Indexes synced with sparse: true");

    // Verify the indexes
    const indexes = await User.collection.getIndexes();
    console.log("\n📋 Current indexes:");
    console.log(JSON.stringify(indexes, null, 2));

    console.log("\n✅ Index fix complete! You can now create multiple manual signup users without duplicate key errors.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error fixing indexes:", err);
    process.exit(1);
  }
};

const main = async () => {
  await connectDB();
  await fixIndexes();
};

main();
