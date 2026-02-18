import Review from "../models/Review.js";
import Product from "../models/Product.js";

// ==================================================
// @desc    Get reviews for a product
// @route   GET /api/products/:id/reviews
// @access  Public
// ==================================================
export const getProductReviews = async (req, res) => {
  try {
    const productId = req.params.id;

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Get reviews with user information
    const reviews = await Review.find({ product: productId })
      .populate("user", "name email")
      .sort({ createdAt: -1 }); // Newest first

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    res.json({
      reviews,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalReviews: reviews.length,
    });
  } catch (error) {
    console.error("Get product reviews error:", error);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
};

// ==================================================
// @desc    Create a review for a product
// @route   POST /api/products/:id/reviews
// @access  Private (Logged-in users only)
// ==================================================
export const createProductReview = async (req, res) => {
  try {
    const productId = req.params.id;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5",
      });
    }

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        message: "Comment is required",
      });
    }

    if (comment.trim().length > 1000) {
      return res.status(400).json({
        message: "Comment cannot exceed 1000 characters",
      });
    }

    // Verify product exists
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
      return res.status(400).json({
        message: "You have already reviewed this product",
      });
    }

    // Create review
    const review = new Review({
      product: productId,
      user: userId,
      rating: Number(rating),
      comment: comment.trim(),
    });

    const savedReview = await review.save();

    // Populate user info for response
    await savedReview.populate("user", "name email");

    res.status(201).json({
      message: "Review created successfully",
      review: savedReview,
    });
  } catch (error) {
    console.error("Create review error:", error);
    
    // Handle duplicate key error (unique index violation)
    if (error.code === 11000) {
      return res.status(400).json({
        message: "You have already reviewed this product",
      });
    }

    res.status(500).json({ message: "Failed to create review" });
  }
};
