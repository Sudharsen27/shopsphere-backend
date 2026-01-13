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
