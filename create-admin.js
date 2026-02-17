/**
 * Create Admin User Script
 * Run: node create-admin.js
 * 
 * This script creates an admin user in your database.
 * You can also use this to convert an existing user to admin.
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./src/models/User.js";

dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Admin credentials (change these!)
    const adminEmail = "admin@shopsphere.com";
    const adminPassword = "Admin@123"; // Change this!
    const adminName = "Admin User";

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      // Update existing user to admin
      existingAdmin.role = "admin";
      existingAdmin.name = adminName;
      
      // Update password if you want to change it
      const salt = await bcrypt.genSalt(12);
      existingAdmin.password = await bcrypt.hash(adminPassword, salt);
      
      await existingAdmin.save();
      console.log("✅ Updated existing user to admin");
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
    } else {
      // Create new admin user
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      const admin = await User.create({
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        isActive: true,
      });

      console.log("✅ Admin user created successfully!");
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
      console.log(`   Role: ${admin.role}`);
    }

    // List all admin users
    const allAdmins = await User.find({ role: "admin" });
    console.log("\n📋 All admin users:");
    allAdmins.forEach((admin) => {
      console.log(`   - ${admin.email} (${admin.name})`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

createAdmin();
