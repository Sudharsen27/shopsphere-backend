/**
 * Fix Broken Image URLs Script
 * 
 * This script updates broken Unsplash image URLs in your products collection.
 * Run: node fix-broken-images.js
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "./src/models/Product.js";

dotenv.config();

// Working Unsplash image URLs (replace broken ones)
const WORKING_IMAGES = {
  headphones: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop",
  watch: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop",
  backpack: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop",
  mouse: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=500&auto=format&fit=crop",
  keyboard: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop",
  hub: "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=500&auto=format&fit=crop",
  lamp: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop",
  stand: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=500&auto=format&fit=crop",
  powerbank: "https://images.unsplash.com/photo-1609091839311-d5365f371f2d?w=500&auto=format&fit=crop",
  laptophub: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&auto=format&fit=crop",
};

const fixBrokenImages = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const products = await Product.find({});
    console.log(`📦 Found ${products.length} products`);

    let updated = 0;
    const brokenUrl = "https://images.unsplash.com/photo-1609091839311-d5365f371f2d?w=500";

    for (const product of products) {
      // Check if image URL is broken
      if (product.image === brokenUrl || product.image?.includes("photo-1609091839311-d5365f371f2d")) {
        // Try to match product name to get appropriate image
        const nameLower = product.name.toLowerCase();
        let newImage = WORKING_IMAGES.powerbank; // default

        if (nameLower.includes("headphone")) {
          newImage = WORKING_IMAGES.headphones;
        } else if (nameLower.includes("watch")) {
          newImage = WORKING_IMAGES.watch;
        } else if (nameLower.includes("backpack")) {
          newImage = WORKING_IMAGES.backpack;
        } else if (nameLower.includes("mouse")) {
          newImage = WORKING_IMAGES.mouse;
        } else if (nameLower.includes("keyboard")) {
          newImage = WORKING_IMAGES.keyboard;
        } else if (nameLower.includes("hub") || nameLower.includes("usb")) {
          newImage = WORKING_IMAGES.hub;
        } else if (nameLower.includes("lamp")) {
          newImage = WORKING_IMAGES.lamp;
        } else if (nameLower.includes("stand")) {
          newImage = WORKING_IMAGES.stand;
        } else if (nameLower.includes("power") || nameLower.includes("bank")) {
          newImage = WORKING_IMAGES.powerbank;
        }

        product.image = newImage;
        await product.save();
        updated++;
        console.log(`✅ Updated: ${product.name} → ${newImage.substring(0, 50)}...`);
      }
    }

    console.log(`\n✅ Fixed ${updated} broken image URLs`);
    console.log("💡 Tip: Restart your frontend to see updated images");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

fixBrokenImages();
