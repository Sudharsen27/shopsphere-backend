// const express = require("express");
// const {
//   createProduct,
//   getProducts,
//   getProductById,
//   updateProduct,
//   deleteProduct,
// } = require("../controllers/productController");

// const protect = require("../middlewares/authMiddleware");
// const adminOnly = require("../middlewares/adminMiddleware");

// const router = express.Router();

// // Public
// router.get("/", getProducts);
// router.get("/:id", getProductById);

// // Admin
// router.post("/", protect, adminOnly, createProduct);
// router.put("/:id", protect, adminOnly, updateProduct);
// router.delete("/:id", protect, adminOnly, deleteProduct);

// module.exports = router;

// import express from "express";
// import { createProduct } from "../controllers/productController.js";
// import protect from "../middleware/authMiddleware.js";
// import adminOnly from "../middleware/adminMiddleware.js";

// const router = express.Router();

// // 🔐 Admin only
// router.post("/", protect, adminOnly, createProduct);

// export default router;


// import express from "express";
// import {
//   createProduct,
//   getProducts,
// } from "../controllers/productController.js";
// import { protect } from "../middleware/authMiddleware.js";
// import admin from "../middleware/adminMiddleware.js";


// const router = express.Router();

// // Public
// router.get("/", getProducts);

// // Admin
// router.post("/", protect, admin, createProduct);

// export default router;


// import express from "express";
// import { createProduct, getProducts } from "../controllers/productController.js";
// import protect from "../middleware/authMiddleware.js";
// import adminOnly from "../middleware/adminMiddleware.js";

// const router = express.Router();

// // Public
// router.get("/", getProducts);

// // Admin
// router.post("/", protect, adminOnly, createProduct);

// export default router;


// import express from "express";
// import { createProduct, getProducts } from "../controllers/productController.js";
// import protect from "../middleware/authMiddleware.js";
// import adminOnly from "../middleware/adminMiddleware.js";

// const router = express.Router();

// // Public
// router.get("/", getProducts);

// // Admin
// router.post("/", protect, adminOnly, createProduct);

// export default router;


import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
} from "../controllers/productController.js";
import {
  getProductReviews,
  createProductReview,
} from "../controllers/reviewController.js";

import protect from "../middleware/authMiddleware.js";
import adminOnly from "../middleware/adminMiddleware.js";

const router = express.Router();

// ===== PUBLIC ROUTES =====
router.get("/", getProducts);
router.get("/:id", getProductById);
router.get("/:id/reviews", getProductReviews); // Get reviews for a product

// ===== PROTECTED ROUTES (Logged-in users) =====
router.post("/:id/reviews", protect, createProductReview); // Create review

// ===== ADMIN ROUTES =====
router.post("/", protect, adminOnly, createProduct);
router.put("/:id", protect, adminOnly, updateProduct);
router.delete("/:id", protect, adminOnly, deleteProduct);

export default router;
