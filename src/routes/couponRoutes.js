import express from "express";
import {
  getPublicOffers,
  validateCoupon,
  getCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from "../controllers/couponController.js";
import protect from "../middleware/authMiddleware.js";
import adminOnly from "../middleware/adminMiddleware.js";

const router = express.Router();

router.get("/offers", getPublicOffers);
router.post("/validate", validateCoupon);
router.get("/", protect, adminOnly, getCoupons);
router.get("/:id", protect, adminOnly, getCouponById);
router.post("/", protect, adminOnly, createCoupon);
router.put("/:id", protect, adminOnly, updateCoupon);
router.delete("/:id", protect, adminOnly, deleteCoupon);

export default router;
