import Review from "../models/Review.js";
import Product from "../models/Product.js";

// @desc    Get all reviews for a product
// @route   GET /api/products/:id/reviews
// @access  Public
export const getProductReviews = async (req, res) => {
  try {
    const productId = req.params.id;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Get all reviews for the product
    const reviews = await Review.find({ product: productId })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    res.json({
      reviews,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalReviews: reviews.length,
    });
  } catch (error) {
    console.error("Get reviews error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new review
// @route   POST /api/products/:id/reviews
// @access  Private
export const createProductReview = async (req, res) => {
  try {
    const productId = req.params.id;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ message: "Comment is required" });
    }

    if (comment.length > 1000) {
      return res.status(400).json({ message: "Comment cannot exceed 1000 characters" });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      product: productId,
      user: userId,
    });

    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this product" });
    }

    // Create review
    const review = await Review.create({
      product: productId,
      user: userId,
      rating,
      comment: comment.trim(),
    });

    // Populate user info
    await review.populate("user", "name");

    res.status(201).json({
      message: "Review created successfully",
      review,
    });
  } catch (error) {
    console.error("Create review error:", error);
    if (error.code === 11000) {
      // Duplicate key error (unique index violation)
      return res.status(400).json({ message: "You have already reviewed this product" });
    }
    res.status(500).json({ message: error.message });
  }
};
