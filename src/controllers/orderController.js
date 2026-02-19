// import Order from "../models/Order.js";
// import Product from "../models/Product.js";


// // @desc    Create new order
// // @route   POST /api/orders
// // @access  Private
// export const createOrder = async (req, res) => {
//   try {
//     const {
//       orderItems,
//       shippingAddress,
//       paymentMethod,
//       itemsPrice,
//       taxPrice,
//       shippingPrice,
//       totalPrice,
//     } = req.body;

//     if (!orderItems || orderItems.length === 0) {
//       return res.status(400).json({ message: "No order items" });
//     }

//     const order = new Order({
//       user: req.user._id,
//       orderItems,
//       shippingAddress,
//       paymentMethod,
//       itemsPrice,
//       taxPrice,
//       shippingPrice,
//       totalPrice,
//     });

//     const createdOrder = await order.save();
//     res.status(201).json(createdOrder);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Get logged-in user's orders
// // @route   GET /api/orders/myorders
// // @access  Private
// export const getMyOrders = async (req, res) => {
//   try {
//     const orders = await Order.find({ user: req.user._id });
//     res.json(orders);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Get all orders (Admin)
// // @route   GET /api/orders
// // @access  Admin
// export const getAllOrders = async (req, res) => {
//   try {
//     const orders = await Order.find().populate("user", "id name email");
//     res.json(orders);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
// // @desc    Mark order as paid
// // @route   PUT /api/orders/:id/pay
// // @access  Private
// export const markOrderAsPaid = async (req, res) => {
//   try {
//     const order = await Order.findById(req.params.id);

//     if (!order) {
//       return res.status(404).json({ message: "Order not found" });
//     }

//     order.isPaid = true;
//     order.paidAt = Date.now();

//     const updatedOrder = await order.save();
//     res.json({
//       message: "Order marked as paid",
//       order: updatedOrder,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Mark order as delivered
// // @route   PUT /api/orders/:id/deliver
// // @access  Admin
// export const markOrderAsDelivered = async (req, res) => {
//   try {
//     const order = await Order.findById(req.params.id);

//     if (!order) {
//       return res.status(404).json({ message: "Order not found" });
//     }

//     order.isDelivered = true;
//     order.deliveredAt = Date.now();

//     const updatedOrder = await order.save();
//     res.json({
//       message: "Order marked as delivered",
//       order: updatedOrder,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// import Order from "../models/Order.js";
// import Product from "../models/Product.js";

// // @desc    Create new order
// // @route   POST /api/orders
// // @access  Private
// export const createOrder = async (req, res) => {
//   try {
//     const {
//       orderItems,
//       shippingAddress,
//       paymentMethod,
//       itemsPrice,
//       taxPrice,
//       shippingPrice,
//       totalPrice,
//     } = req.body;

//     if (!orderItems || orderItems.length === 0) {
//       return res.status(400).json({ message: "No order items" });
//     }

//     // =========================
//     // STOCK CHECK & REDUCTION
//     // =========================
//     for (const item of orderItems) {
//       const product = await Product.findById(item.product);

//       if (!product) {
//         return res.status(404).json({ message: "Product not found" });
//       }

//       if (product.countInStock < item.qty) {
//         return res.status(400).json({
//           message: `Not enough stock for ${product.name}`,
//         });
//       }

//       // Reduce stock
//       product.countInStock -= item.qty;
//       await product.save();
//     }

//     // =========================
//     // CREATE ORDER
//     // =========================
//     const order = new Order({
//       user: req.user._id,
//       orderItems,
//       shippingAddress,
//       paymentMethod,
//       itemsPrice,
//       taxPrice,
//       shippingPrice,
//       totalPrice,
//     });

//     const createdOrder = await order.save();
//     res.status(201).json(createdOrder);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Get logged-in user's orders
// // @route   GET /api/orders/myorders
// // @access  Private
// export const getMyOrders = async (req, res) => {
//   try {
//     const orders = await Order.find({ user: req.user._id });
//     res.json(orders);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Get all orders (Admin)
// // @route   GET /api/orders
// // @access  Admin
// export const getAllOrders = async (req, res) => {
//   try {
//     const orders = await Order.find().populate("user", "id name email");
//     res.json(orders);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Mark order as paid
// // @route   PUT /api/orders/:id/pay
// // @access  Private
// export const markOrderAsPaid = async (req, res) => {
//   try {
//     const order = await Order.findById(req.params.id);

//     if (!order) {
//       return res.status(404).json({ message: "Order not found" });
//     }

//     order.isPaid = true;
//     order.paidAt = Date.now();

//     const updatedOrder = await order.save();
//     res.json({
//       message: "Order marked as paid",
//       order: updatedOrder,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Mark order as delivered
// // @route   PUT /api/orders/:id/deliver
// // @access  Admin
// export const markOrderAsDelivered = async (req, res) => {
//   try {
//     const order = await Order.findById(req.params.id);

//     if (!order) {
//       return res.status(404).json({ message: "Order not found" });
//     }

//     order.isDelivered = true;
//     order.deliveredAt = Date.now();

//     const updatedOrder = await order.save();
//     res.json({
//       message: "Order marked as delivered",
//       order: updatedOrder,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };


import Order from "../models/Order.js";
import Product from "../models/Product.js";

// ==================================================
// @desc    Create new order
// @route   POST /api/orders
// @access  Private
// ==================================================
export const createOrder = async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    } = req.body;

    // 1️⃣ Validate order items
    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: "No order items provided" });
    }

    // 2️⃣ Validate shipping address (important for professional app)
    if (
      !shippingAddress ||
      !shippingAddress.address ||
      !shippingAddress.city ||
      !shippingAddress.postalCode ||
      !shippingAddress.country
    ) {
      return res.status(400).json({
        message: "Shipping address is incomplete",
      });
    }

    // 3️⃣ Check stock & reduce stock safely
    for (const item of orderItems) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({
          message: `Product not found`,
        });
      }

      if (product.countInStock < item.qty) {
        return res.status(400).json({
          message: `Not enough stock for ${product.name}`,
        });
      }

      product.countInStock -= item.qty;
      await product.save();
    }

    // 4️⃣ Create order
    const order = new Order({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ message: "Failed to create order" });
  }
};

// ==================================================
// @desc    Get logged-in user's orders ONLY
// @route   GET /api/orders/myorders
// @access  Private
// ==================================================
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    // Calculate status for each order if not set
    const ordersWithStatus = orders.map((order) => {
      const orderObj = order.toObject();
      if (!orderObj.status) {
        if (orderObj.isDelivered) {
          orderObj.status = "delivered";
        } else if (orderObj.isPaid) {
          orderObj.status = "processing";
        } else {
          orderObj.status = "pending";
        }
      }
      return orderObj;
    });

    res.json(ordersWithStatus);
  } catch (error) {
    console.error("Get my orders error:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

// ==================================================
// @desc    Get ALL orders (Admin only)
// @route   GET /api/orders
// @access  Admin
// ==================================================
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Get all orders error:", error);
    res.status(500).json({ message: "Failed to fetch all orders" });
  }
};

// ==================================================
// @desc    Mark order as paid
// @route   PUT /api/orders/:id/pay
// @access  Private
// ==================================================
export const markOrderAsPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.status = "processing"; // Update status when paid

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    console.error("Mark paid error:", error);
    res.status(500).json({ message: "Failed to mark order as paid" });
  }
};

// ==================================================
// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private (User can only see their own orders, Admin can see all)
// ==================================================
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user owns the order or is admin
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to view this order" });
    }

    // Calculate status if not set
    if (!order.status) {
      if (order.isDelivered) {
        order.status = "delivered";
      } else if (order.isPaid) {
        order.status = "processing";
      } else {
        order.status = "pending";
      }
    }

    res.json(order);
  } catch (error) {
    console.error("Get order by ID error:", error);
    res.status(500).json({ message: "Failed to fetch order" });
  }
};

// ==================================================
// @desc    Mark order as delivered
// @route   PUT /api/orders/:id/deliver
// @access  Admin
// ==================================================
export const markOrderAsDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.isDelivered = true;
    order.deliveredAt = Date.now();
    order.status = "delivered";

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    console.error("Mark delivered error:", error);
    res.status(500).json({ message: "Failed to mark order as delivered" });
  }
};
