// const Product = require("../models/Product");

// // @desc Create product (Admin)
// // @route POST /api/products
// exports.createProduct = async (req, res) => {
//   const product = new Product({
//     ...req.body,
//     createdBy: req.user._id,
//   });

//   const createdProduct = await product.save();
//   res.status(201).json(createdProduct);
// };

// // @desc Get all products (Public)
// // @route GET /api/products
// exports.getProducts = async (req, res) => {
//   const products = await Product.find();
//   res.json(products);
// };

// // @desc Get single product
// // @route GET /api/products/:id
// exports.getProductById = async (req, res) => {
//   const product = await Product.findById(req.params.id);

//   if (!product) {
//     return res.status(404).json({ message: "Product not found" });
//   }

//   res.json(product);
// };

// // @desc Update product (Admin)
// // @route PUT /api/products/:id
// exports.updateProduct = async (req, res) => {
//   const product = await Product.findById(req.params.id);

//   if (!product) {
//     return res.status(404).json({ message: "Product not found" });
//   }

//   Object.assign(product, req.body);
//   const updatedProduct = await product.save();

//   res.json(updatedProduct);
// };

// // @desc Delete product (Admin)
// // @route DELETE /api/products/:id
// exports.deleteProduct = async (req, res) => {
//   const product = await Product.findById(req.params.id);

//   if (!product) {
//     return res.status(404).json({ message: "Product not found" });
//   }

//   await product.deleteOne();
//   res.json({ message: "Product removed" });
// };


import Product from "../models/Product.js";

// @desc    Create a product
// @route   POST /api/products
// @access  Admin
export const createProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    const createdProduct = await product.save();

    res.status(201).json({
      message: "Product created successfully",
      product: createdProduct,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
// @desc    Get all products (with search, filter, sort)
// @route   GET /api/products?search=keyword&category=Electronics&minPrice=1000&maxPrice=5000&sort=price&order=asc
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      sort = "createdAt",
      order = "desc",
    } = req.query;

    // Build query
    const query = {};

    // Search by name, description, brand
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by brand
    if (brand) {
      query.brand = brand;
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Build sort object
    const sortOrder = order === "asc" ? 1 : -1;
    const sortObj = {};
    sortObj[sort] = sortOrder;

    // Execute query
    const products = await Product.find(query)
      .sort(sortObj)
      .limit(100); // Limit to prevent huge responses

    // Get unique categories and brands for filters
    const categories = await Product.distinct("category");
    const brands = await Product.distinct("brand");

    res.json({
      products,
      filters: {
        categories,
        brands,
      },
      total: products.length,
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};
// UPDATE PRODUCT (ADMIN)
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.name = req.body.name || product.name;
    product.description = req.body.description || product.description;
    product.price = req.body.price || product.price;
    product.image = req.body.image || product.image;
    product.countInStock = req.body.countInStock || product.countInStock;
    product.category = req.body.category || product.category;
    product.brand = req.body.brand || product.brand;

    const updatedProduct = await product.save();

    res.json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE PRODUCT (ADMIN)
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await product.deleteOne();

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Calculate rating from reviews
    const Review = (await import("../models/Review.js")).default;
    const reviews = await Review.find({ product: product._id });
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    const productObj = product.toObject();
    productObj.rating = {
      average: Math.round(averageRating * 10) / 10,
      count: reviews.length,
    };

    res.json(productObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
