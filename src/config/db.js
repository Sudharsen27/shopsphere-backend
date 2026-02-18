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
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI environment variable is not set");
    }

    // Log connection attempt (without sensitive data)
    const uriParts = process.env.MONGO_URI.split("@");
    const dbInfo = uriParts.length > 1 ? uriParts[1] : "hidden";
    console.log(`🔌 Attempting to connect to MongoDB: ${dbInfo.split("/")[0]}...`);

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds socket timeout
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    
    // Provide helpful error messages
    if (error.message.includes("bad auth") || error.message.includes("Authentication failed")) {
      console.error("\n💡 Authentication Error Tips:");
      console.error("   1. Check your MongoDB username and password");
      console.error("   2. Ensure password is URL-encoded (special characters like @, #, %, etc.)");
      console.error("   3. Verify the database user has proper permissions");
      console.error("   4. Check if the connection string format is correct:");
      console.error("      mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority");
    } else if (error.message.includes("ENOTFOUND") || error.message.includes("getaddrinfo")) {
      console.error("\n💡 Network Error Tips:");
      console.error("   1. Check your internet connection");
      console.error("   2. Verify the MongoDB cluster hostname is correct");
      console.error("   3. Ensure MongoDB Atlas allows connections from Render's IP (0.0.0.0/0)");
    }
    
    process.exit(1);
  }
};

export default connectDB;
