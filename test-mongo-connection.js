// Quick test script to verify MongoDB connection
// Run: node test-mongo-connection.js

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://shopsphere_user:shopsphere123@cluster0.tdmehqg.mongodb.net/shopsphere?authSource=admin";

console.log("🔌 Testing MongoDB connection...");
console.log("📍 Connection string (masked):", MONGO_URI.replace(/\/\/.*@/, "//***:***@"));

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
})
  .then(() => {
    console.log("✅ Connection successful!");
    console.log(`📊 Connected to: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Connection failed!");
    console.error("Error:", error.message);
    
    if (error.message.includes("bad auth") || error.message.includes("Authentication failed")) {
      console.error("\n💡 Authentication Error - Check:");
      console.error("   1. Username: shopsphere_user");
      console.error("   2. Password: shopsphere123");
      console.error("   3. Database user exists in MongoDB Atlas");
      console.error("   4. User has proper permissions");
      console.error("   5. authSource=admin is correct (if user is in admin database)");
    }
    
    process.exit(1);
  });
