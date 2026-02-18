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

  // Extract username from connection string for potential variations
  let username = null;
  let password = null;
  try {
    const match = originalUri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@/);
    if (match) {
      username = match[1];
      password = match[2];
    }
  } catch (e) {
    // Ignore parsing errors
  }

  // Build connection string variations to try
  const connectionAttempts = [];
  
  // Try common username variations if we detected a username
  if (username) {
    const usernameVariations = [
      username, // Original
      username.charAt(0).toUpperCase() + username.slice(1).toLowerCase(), // Capitalized: shopsphere_user -> Shopsphere_user
      username.split('_')[0].charAt(0).toUpperCase() + username.split('_')[0].slice(1).toLowerCase(), // First part capitalized: shopsphere_user -> Shopsphere
    ];
    
    // Remove duplicates
    const uniqueUsernames = [...new Set(usernameVariations)];
    
    for (const user of uniqueUsernames) {
      if (user !== username) {
        const uri = originalUri.replace(`mongodb+srv://${username}:`, `mongodb+srv://${user}:`);
        connectionAttempts.push({ uri, description: `Username variation: ${user}` });
      }
    }
  }

  // Attempt 1: Remove authSource=admin, add retryWrites
  if (originalUri.includes("authSource=admin")) {
    let uri = originalUri.replace(/[?&]authSource=admin/g, "");
    // Clean up any double ? or &
    uri = uri.replace(/\?\?/g, "?").replace(/\?\&/g, "?").replace(/\&\&/g, "&");
    const separator = uri.includes("?") ? "&" : "?";
    uri = uri + separator + "retryWrites=true&w=majority";
    connectionAttempts.push({ uri, description: "Without authSource=admin + retryWrites" });
  }

  // Attempt 2: Remove authSource=admin only (no retryWrites)
  if (originalUri.includes("authSource=admin")) {
    let uri = originalUri.replace(/[?&]authSource=admin/g, "");
    uri = uri.replace(/\?\?/g, "?").replace(/\?\&/g, "?").replace(/\&\&/g, "&");
    // Remove trailing ? or & if no other params
    if (uri.endsWith("?") || uri.endsWith("&")) {
      uri = uri.slice(0, -1);
    }
    connectionAttempts.push({ uri, description: "Without authSource=admin only" });
  }

  // Attempt 3: Original URI with retryWrites added (if not present)
  if (!originalUri.includes("retryWrites")) {
    const separator = originalUri.includes("?") ? "&" : "?";
    const uri = originalUri + separator + "retryWrites=true&w=majority";
    connectionAttempts.push({ uri, description: "Original + retryWrites" });
  }

  // Attempt 4: Original URI as-is (fallback)
  connectionAttempts.push({ uri: originalUri, description: "Original connection string" });

  console.log(`📋 Will try ${connectionAttempts.length} connection string variation(s)`);

  // Try each connection string
  let lastError = null;
  for (let i = 0; i < connectionAttempts.length; i++) {
    const attempt = connectionAttempts[i];
    try {
      console.log(`🔄 Attempt ${i + 1}/${connectionAttempts.length}: ${attempt.description}...`);
      
      const conn = await mongoose.connect(attempt.uri, {
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 45000,
      });

      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      console.log(`📊 Database: ${conn.connection.name}`);
      return; // Success!
    } catch (error) {
      lastError = error;
      const isAuthError = error.message.includes("bad auth") || 
                         error.message.includes("Authentication failed") ||
                         error.message.includes("authentication failed");
      
      if (!isAuthError) {
        // Non-auth errors should stop immediately
        console.error(`❌ MongoDB connection failed: ${error.message}`);
        if (error.message.includes("ENOTFOUND") || error.message.includes("getaddrinfo")) {
          console.error("\n💡 Network Error - Check:");
          console.error("   1. MongoDB Atlas Network Access allows 0.0.0.0/0");
          console.error("   2. Cluster hostname is correct");
        }
        process.exit(1);
      }
      // Continue to next attempt if auth failed
      console.log(`   ⚠️  Auth failed, trying next variation...`);
    }
  }

  // All attempts failed
  console.error("\n❌ MongoDB connection failed: Authentication failed after trying all variations");
  console.error(`   Last error: ${lastError?.message || "Unknown error"}`);
  console.error("\n💡 This is a MongoDB Atlas configuration issue. Check:");
  console.error("\n   1. MongoDB Atlas → Database Access:");
  console.error("      ✓ User 'shopsphere_user' exists");
  console.error("      ✓ Password matches: 'shopsphere123'");
  console.error("      ✓ User has 'Read and write to any database' permissions");
  console.error("\n   2. MongoDB Atlas → Network Access:");
  console.error("      ✓ Add IP Address: 0.0.0.0/0 (allows all IPs)");
  console.error("      ✓ Or add Render's specific IP addresses");
  console.error("\n   3. Render Environment Variables:");
  console.error("      ✓ MONGO_URI is set correctly");
  console.error("      ✓ No extra spaces or quotes");
  console.error("      ✓ Try: mongodb+srv://shopsphere_user:shopsphere123@cluster0.tdmehqg.mongodb.net/shopsphere?retryWrites=true&w=majority");
  console.error("\n   If user doesn't exist, create it in MongoDB Atlas Database Access.");
  process.exit(1);
};

export default connectDB;
