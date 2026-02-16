import dotenv from "dotenv";
import connectDB from "../config/db.js";
import Product from "../models/Product.js";

dotenv.config();

const products = [
  {
    name: "Wireless Bluetooth Headphones",
    description: "Premium quality wireless headphones with noise cancellation and 30-hour battery life. Perfect for music lovers and professionals.",
    price: 2999,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
    countInStock: 50,
    category: "Electronics",
    brand: "SoundMax",
  },
  {
    name: "Smart Watch Pro",
    description: "Feature-rich smartwatch with heart rate monitor, GPS, and water resistance. Track your fitness goals and stay connected.",
    price: 8999,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
    countInStock: 30,
    category: "Electronics",
    brand: "TechWear",
  },
  {
    name: "Laptop Backpack",
    description: "Durable and stylish backpack designed for laptops up to 15.6 inches. Multiple compartments and padded straps for comfort.",
    price: 1299,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500",
    countInStock: 75,
    category: "Accessories",
    brand: "TravelGear",
  },
  {
    name: "Wireless Mouse",
    description: "Ergonomic wireless mouse with precision tracking and long battery life. Compatible with Windows, Mac, and Linux.",
    price: 799,
    image: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=500",
    countInStock: 100,
    category: "Electronics",
    brand: "ClickTech",
  },
  {
    name: "Mechanical Keyboard",
    description: "RGB backlit mechanical keyboard with Cherry MX switches. Perfect for gaming and typing enthusiasts.",
    price: 4999,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500",
    countInStock: 40,
    category: "Electronics",
    brand: "KeyMaster",
  },
  {
    name: "USB-C Hub",
    description: "7-in-1 USB-C hub with HDMI, USB 3.0 ports, SD card reader, and power delivery. Expand your laptop connectivity.",
    price: 1999,
    image: "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=500",
    countInStock: 60,
    category: "Electronics",
    brand: "ConnectPro",
  },
  {
    name: "Desk Lamp",
    description: "LED desk lamp with adjustable brightness and color temperature. Eye-friendly lighting for work and study.",
    price: 1499,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500",
    countInStock: 45,
    category: "Home & Office",
    brand: "BrightLight",
  },
  {
    name: "Phone Stand",
    description: "Adjustable aluminum phone stand compatible with all smartphones. Perfect for video calls and hands-free viewing.",
    price: 499,
    image: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=500",
    countInStock: 80,
    category: "Accessories",
    brand: "StandPro",
  },
  {
    name: "Power Bank 20000mAh",
    description: "High-capacity power bank with fast charging support. Charge your devices multiple times on the go.",
    price: 2499,
    image: "https://images.unsplash.com/photo-1609091839311-d5365f371f2d?w=500",
    countInStock: 55,
    category: "Electronics",
    brand: "PowerMax",
  },
  {
    name: "Laptop Stand",
    description: "Ergonomic aluminum laptop stand with adjustable height. Improve your posture and workspace setup.",
    price: 1799,
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500",
    countInStock: 35,
    category: "Accessories",
    brand: "ErgoDesk",
  },
];

const seedProducts = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB");

    // Clear existing products (optional - comment out if you want to keep existing)
    await Product.deleteMany({});
    console.log("Cleared existing products");

    // Insert products
    const createdProducts = await Product.insertMany(products);
    console.log(`✅ Successfully seeded ${createdProducts.length} products`);

    process.exit(0);
  } catch (error) {
    console.error("Error seeding products:", error);
    process.exit(1);
  }
};

seedProducts();
