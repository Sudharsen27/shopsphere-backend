import express from "express";
import {
  createRazorpayOrder,
  verifyPayment,
  razorpayWebhook,
} from "../controllers/paymentController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Webhook route (no auth - Razorpay calls this)
router.post("/webhook", express.raw({ type: "application/json" }), razorpayWebhook);

// Protected routes
router.post("/create-order", protect, createRazorpayOrder);
router.post("/verify", protect, verifyPayment);

export default router;
