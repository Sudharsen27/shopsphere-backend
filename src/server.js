


// import express from "express";
// import dotenv from "dotenv";
// import connectDB from "./config/db.js";
// import authRoutes from "./routes/authRoutes.js";
// import productRoutes from "./routes/productRoutes.js";
// import orderRoutes from "./routes/orderRoutes.js";

// dotenv.config();
// connectDB();

// const app = express();
// app.use(express.json());

// app.use("/api/auth", authRoutes);
// app.use("/api/products", productRoutes);
// app.use("/api/orders", orderRoutes);

// app.get("/", (req, res) => {
//   res.send("API running");
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () =>
//   console.log(`Server running on port ${PORT}`)
// );



// import express from "express";
// import dotenv from "dotenv";
// import connectDB from "./config/db.js";
// import authRoutes from "./routes/authRoutes.js";
// import productRoutes from "./routes/productRoutes.js";
// import orderRoutes from "./routes/orderRoutes.js";

// dotenv.config();
// connectDB();

// const app = express();
// app.use(express.json());

// app.use("/api/auth", authRoutes);
// app.use("/api/products", productRoutes);
// app.use("/api/orders", orderRoutes);

// app.get("/", (req, res) => {
//   res.send("API running");
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () =>
//   console.log(`Server running on port ${PORT}`)
// );


import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { apiLimiter } from "./middleware/rateLimiter.js";

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ["MONGO_URI", "JWT_SECRET"];
const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(
    "❌ Missing required environment variables:",
    missingEnvVars.join(", ")
  );
  console.error("Please create a .env file with the required variables.");
  process.exit(1);
}

// Log Razorpay configuration status (for debugging)
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  console.log("✅ Razorpay payment gateway configured");
} else {
  console.warn("⚠️  Razorpay keys not configured - online payments will not work");
}

// Log Email configuration status (for debugging)
if (process.env.BREVO_API_KEY) {
  console.log("✅ Email notifications configured (Brevo API - recommended on Render)");
  console.log(`   From: ${process.env.EMAIL_FROM || process.env.BREVO_EMAIL || "set BREVO_EMAIL or EMAIL_FROM"}`);
} else if (process.env.BREVO_EMAIL && process.env.BREVO_SMTP_KEY) {
  console.log("✅ Email notifications configured (Brevo SMTP)");
  console.log(`   From: ${process.env.EMAIL_FROM || process.env.BREVO_EMAIL}`);
} else if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  console.log("✅ Email notifications configured (SMTP/Gmail)");
  console.log(`   Email: ${process.env.EMAIL_USER}`);
  console.log(`   Host: ${process.env.EMAIL_HOST}`);
} else {
  console.warn("⚠️  Email not configured - order emails will not be sent");
  console.warn("   Production (Render): set BREVO_API_KEY (recommended) or BREVO_EMAIL + BREVO_SMTP_KEY. Local: set EMAIL_HOST, EMAIL_USER, EMAIL_PASS.");
}

// Connect to database
connectDB();

const app = express();

// Trust exactly one proxy (Render). Using 1 instead of true avoids ERR_ERL_PERMISSIVE_TRUST_PROXY
// while still reading X-Forwarded-For for rate limiting. See express-rate-limit proxy docs.
app.set("trust proxy", 1);

// Security middleware
app.use(helmet());

// CORS configuration (supports production: single URL or comma-separated list)
const frontendUrls = process.env.FRONTEND_URL || "http://localhost:3000";
const corsOrigins = frontendUrls.split(",").map((url) => url.trim());
const corsOptions = {
  origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// API Routes (auth routes have their own rate limiters)
app.use("/api/auth", authRoutes);

// Rate limiting for other API routes (excludes auth routes)
app.use("/api/", apiLimiter);

// Other API Routes
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/payments", paymentRoutes);

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ShopSphere API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  if (!isProduction) {
    console.log(`📡 Local API: http://localhost:${PORT}`);
  }
});
