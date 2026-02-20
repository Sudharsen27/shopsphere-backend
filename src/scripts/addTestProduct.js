import dotenv from "dotenv";
import connectDB from "../config/db.js";
import Product from "../models/Product.js";

dotenv.config();

const addTestProduct = async () => {
  try {
    await connectDB();
    console.log("✅ Connected to MongoDB");

    // Check if test product already exists
    const existingProduct = await Product.findOne({ 
      name: "Razorpay Test Product - ₹10" 
    });

    if (existingProduct) {
      console.log("⚠️  Test product already exists!");
      console.log(`   Product ID: ${existingProduct._id}`);
      console.log(`   Price: ₹${existingProduct.price}`);
      console.log("\n💡 To update it, delete the existing product first or modify this script.");
      process.exit(0);
    }

    // Create test product
    const testProduct = new Product({
      name: "Razorpay Test Product - ₹10",
      description: "This is a test product for Razorpay payment gateway testing. Price: ₹10 only. Perfect for testing payment flows without spending large amounts.",
      price: 10,
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500",
      countInStock: 1000,
      category: "Test",
      brand: "ShopSphere",
    });

    const createdProduct = await testProduct.save();
    
    console.log("\n✅ Test product created successfully!");
    console.log(`   Product ID: ${createdProduct._id}`);
    console.log(`   Name: ${createdProduct.name}`);
    console.log(`   Price: ₹${createdProduct.price}`);
    console.log(`   Stock: ${createdProduct.countInStock}`);
    console.log("\n💡 You can now use this product to test Razorpay payments!");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error adding test product:", error);
    process.exit(1);
  }
};

addTestProduct();
