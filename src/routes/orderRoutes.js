// import express from "express";
// import {
//   createOrder,
//   getMyOrders,
//   getAllOrders,
// } from "../controllers/orderController.js";

// import protect from "../middleware/authMiddleware.js";
// import adminOnly from "../middleware/adminMiddleware.js";

// const router = express.Router();

// // Create order
// router.post("/", protect, createOrder);

// // Get logged-in user's orders
// router.get("/myorders", protect, getMyOrders);

// // Admin: get all orders
// router.get("/", protect, adminOnly, getAllOrders);

// export default router;


// import express from "express";
// import {
//   createOrder,
//   getMyOrders,
//   getAllOrders,
//   markOrderAsPaid,
//   markOrderAsDelivered,
// } from "../controllers/orderController.js";

// import protect from "../middleware/authMiddleware.js";
// import adminOnly from "../middleware/adminMiddleware.js";

// const router = express.Router();

// // =========================
// // CREATE ORDER (USER)
// // =========================
// router.post("/", protect, createOrder);

// // =========================
// // GET LOGGED-IN USER ORDERS
// // =========================
// router.get("/myorders", protect, getMyOrders);

// // =========================
// // GET ALL ORDERS (ADMIN)
// // =========================
// router.get("/", protect, adminOnly, getAllOrders);

// // =========================
// // MARK ORDER AS PAID (USER)
// // =========================
// router.put("/:id/pay", protect, markOrderAsPaid);

// // =========================
// // MARK ORDER AS DELIVERED (ADMIN)
// // =========================
// router.put("/:id/deliver", protect, adminOnly, markOrderAsDelivered);

// export default router;


import express from "express";
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  markOrderAsPaid,
  markOrderAsDelivered,
  updateOrderStatus,
  cancelOrder,
} from "../controllers/orderController.js";

import protect from "../middleware/authMiddleware.js";
import adminOnly from "../middleware/adminMiddleware.js";

const router = express.Router();

/**
 * ============================
 * ORDERS ROUTES
 * ============================
 */

// 🔒 Create a new order (Logged-in user)
router.post("/", protect, createOrder);

// 🔒 Get logged-in user's orders ONLY (must come before /:id)
router.get("/myorders", protect, getMyOrders);

// 🔐 Get all orders (Admin only) - must come before /:id
router.get("/", protect, adminOnly, getAllOrders);

// 🔒 Get single order by ID (User can see their own, Admin can see all)
// This must be last to avoid matching /myorders or /
router.get("/:id", protect, getOrderById);

// 🔒 Cancel order (User only, pending/processing)
router.put("/:id/cancel", protect, cancelOrder);

// 🔒 Mark order as paid (User)
router.put("/:id/pay", protect, markOrderAsPaid);

// 🔐 Update order status (Admin only) - for shipped, delivered, cancelled
router.put("/:id/status", protect, adminOnly, updateOrderStatus);

// 🔐 Mark order as delivered (Admin only)
router.put("/:id/deliver", protect, adminOnly, markOrderAsDelivered);

export default router;
