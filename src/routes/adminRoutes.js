import express from "express";
import protect from "../middleware/authMiddleware.js";
import adminOnly from "../middleware/adminMiddleware.js";
import {
  getStats,
  bulkUpdateProducts,
  bulkUpdateOrders,
  exportOrders,
  exportProducts,
  sendLowStockAlert,
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/stats", protect, adminOnly, getStats);
router.post("/products/bulk", protect, adminOnly, bulkUpdateProducts);
router.post("/orders/bulk", protect, adminOnly, bulkUpdateOrders);
router.get("/orders/export", protect, adminOnly, exportOrders);
router.get("/products/export", protect, adminOnly, exportProducts);
router.post("/low-stock/alert", protect, adminOnly, sendLowStockAlert);

export default router;
