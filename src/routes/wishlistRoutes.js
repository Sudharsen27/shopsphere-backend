import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
} from "../controllers/wishlistController.js";

const router = express.Router();

/**
 * ============================
 * WISHLIST ROUTES
 * ============================
 */

// 🔒 All routes require authentication
router.use(protect);

// Get user's wishlist
router.get("/", getWishlist);

// Check if product is in wishlist
router.get("/check/:productId", checkWishlist);

// Add product to wishlist
router.post("/:productId", addToWishlist);

// Remove product from wishlist
router.delete("/:productId", removeFromWishlist);

export default router;
