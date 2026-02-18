import User from "../models/User.js";
import Product from "../models/Product.js";

// ==================================================
// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
// ==================================================
export const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("wishlist");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      wishlist: user.wishlist || [],
      count: user.wishlist?.length || 0,
    });
  } catch (error) {
    console.error("Get wishlist error:", error);
    res.status(500).json({ message: "Failed to fetch wishlist" });
  }
};

// ==================================================
// @desc    Add product to wishlist
// @route   POST /api/wishlist/:productId
// @access  Private
// ==================================================
export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Get user with wishlist
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if product is already in wishlist
    if (user.wishlist.includes(productId)) {
      return res.status(400).json({ message: "Product already in wishlist" });
    }

    // Add to wishlist
    user.wishlist.push(productId);
    await user.save();

    res.json({
      message: "Product added to wishlist",
      wishlist: await User.findById(userId).populate("wishlist").then(u => u.wishlist),
    });
  } catch (error) {
    console.error("Add to wishlist error:", error);
    res.status(500).json({ message: "Failed to add product to wishlist" });
  }
};

// ==================================================
// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
// ==================================================
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    // Get user with wishlist
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if product is in wishlist
    if (!user.wishlist.includes(productId)) {
      return res.status(400).json({ message: "Product not in wishlist" });
    }

    // Remove from wishlist
    user.wishlist = user.wishlist.filter(
      (id) => id.toString() !== productId
    );
    await user.save();

    res.json({
      message: "Product removed from wishlist",
      wishlist: await User.findById(userId).populate("wishlist").then(u => u.wishlist),
    });
  } catch (error) {
    console.error("Remove from wishlist error:", error);
    res.status(500).json({ message: "Failed to remove product from wishlist" });
  }
};

// ==================================================
// @desc    Check if product is in wishlist
// @route   GET /api/wishlist/check/:productId
// @access  Private
// ==================================================
export const checkWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isInWishlist = user.wishlist.some(
      (id) => id.toString() === productId
    );

    res.json({ isInWishlist });
  } catch (error) {
    console.error("Check wishlist error:", error);
    res.status(500).json({ message: "Failed to check wishlist" });
  }
};
