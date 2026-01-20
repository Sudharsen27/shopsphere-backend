import express from "express";
import {
  createOrder,
  getMyOrders,
  getAllOrders,
} from "../controllers/orderController.js";

import protect from "../middleware/authMiddleware.js";
import adminOnly from "../middleware/adminMiddleware.js";

const router = express.Router();

// Create order
router.post("/", protect, createOrder);

// Get logged-in user's orders
router.get("/myorders", protect, getMyOrders);

// Admin: get all orders
router.get("/", protect, adminOnly, getAllOrders);

export default router;
