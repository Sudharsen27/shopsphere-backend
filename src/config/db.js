// const mongoose = require("mongoose");

// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);
//     console.log("MongoDB Connected");
//   } catch (error) {
//     console.error("MongoDB connection failed", error);
//     process.exit(1);
//   }
// };

// module.exports = connectDB;

import mongoose from "mongoose";

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI environment variable is not set");
    process.exit(1);
  }

  const originalUri = process.env.MONGO_URI;
  const uriParts = originalUri.split("@");
  const dbInfo = uriParts.length > 1 ? uriParts[1] : "hidden";
  console.log(`🔌 Attempting to connect to MongoDB: ${dbInfo.split("/")[0]}...`);

  // Try multiple connection string variations
  const connectionAttempts = [];

  // Attempt 1: Remove authSource=admin and add retryWrites
  if (originalUri.includes("authSource=admin")) {
    let uri = originalUri.replace(/[?&]authSource=admin/g, "");
    const separator = uri.includes("?") ? "&" : "?";
    uri = uri + separator + "retryWrites=true&w=majority";
    connectionAttempts.push({ uri, description: "Without authSource=admin" });
  }

  // Attempt 2: Original URI with retryWrites added
  if (!originalUri.includes("retryWrites")) {
    const separator = originalUri.includes("?") ? "&" : "?";
    const uri = originalUri + separator + "retryWrites=true&w=majority";
    connectionAttempts.push({ uri, description: "With retryWrites added" });
  }

  // Attempt 3: Original URI as-is
  connectionAttempts.push({ uri: originalUri, description: "Original connection string" });

  // Try each connection string
  for (const attempt of connectionAttempts) {
    try {
      console.log(`🔄 Trying: ${attempt.description}...`);
      
      const conn = await mongoose.connect(attempt.uri, {
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 45000,
      });

      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      console.log(`📊 Database: ${conn.connection.name}`);
      return; // Success!
    } catch (error) {
      // If it's not an auth error, don't try other variations
      if (!error.message.includes("bad auth") && !error.message.includes("Authentication failed")) {
        console.error(`❌ MongoDB connection failed: ${error.message}`);
        if (error.message.includes("ENOTFOUND") || error.message.includes("getaddrinfo")) {
          console.error("\n💡 Network Error - Check:");
          console.error("   1. MongoDB Atlas Network Access allows 0.0.0.0/0");
          console.error("   2. Cluster hostname is correct");
        }
        process.exit(1);
      }
      // Continue to next attempt if auth failed
    }
  }

  // All attempts failed
  console.error("❌ MongoDB connection failed: Authentication failed after trying multiple connection string variations");
  console.error("\n💡 Fix in Render Environment Variables:");
  console.error("   Update MONGO_URI to:");
  console.error("   mongodb+srv://shopsphere_user:shopsphere123@cluster0.tdmehqg.mongodb.net/shopsphere?retryWrites=true&w=majority");
  console.error("\n💡 Or verify in MongoDB Atlas:");
  console.error("   1. Database Access → User 'shopsphere_user' exists");
  console.error("   2. User has 'Read and write to any database' permissions");
  console.error("   3. Network Access → Allow 0.0.0.0/0 (all IPs)");
  process.exit(1);
};

export default connectDB;
