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
import User from "../models/User.js";
import { sendOrderConfirmationEmail, sendOrderDeliveredEmail, sendOrderShippedEmail } from "../utils/emailService.js";

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
      // Set initial status based on payment method
      status: paymentMethod === "COD" ? "pending" : "pending",
      isPaid: paymentMethod === "COD" ? false : false, // Will be updated after payment
    });

    const createdOrder = await order.save();
    
    // Populate user for email
    await createdOrder.populate("user", "name email");
    
    // Send order confirmation email to customer (and BCC to client if CLIENT_EMAIL set)
    sendOrderConfirmationEmail(createdOrder, createdOrder.user)
      .then((result) => {
        if (result?.success) {
          console.log(`✅ Order confirmation email sent for order ${createdOrder._id} to ${createdOrder.user?.email}`);
        } else {
          console.warn(`⚠️ Order confirmation email skipped or failed:`, result?.error || "unknown");
        }
      })
      .catch((err) => {
        console.error("❌ Failed to send order confirmation email:", err?.message || err);
        // Don't fail the request if email fails
      });
    
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
// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
// @access  Admin
// ==================================================
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const order = await Order.findById(req.params.id).populate("user", "name email");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = status;

    // Set timestamps based on status
    if (status === "delivered" && !order.isDelivered) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }

    const updatedOrder = await order.save();

    // Send email notifications based on status (non-blocking)
    if (updatedOrder.user) {
      if (status === "shipped") {
        sendOrderShippedEmail(updatedOrder, updatedOrder.user).catch((err) => {
          console.error("Failed to send shipped email:", err);
        });
      } else if (status === "delivered") {
        sendOrderDeliveredEmail(updatedOrder, updatedOrder.user).catch((err) => {
          console.error("Failed to send delivery email:", err);
        });
      }
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ message: "Failed to update order status" });
  }
};

// ==================================================
// @desc    Mark order as delivered
// @route   PUT /api/orders/:id/deliver
// @access  Admin
// ==================================================
export const markOrderAsDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.isDelivered = true;
    order.deliveredAt = Date.now();
    order.status = "delivered";

    const updatedOrder = await order.save();
    
    // Send delivery confirmation email (non-blocking)
    if (updatedOrder.user) {
      sendOrderDeliveredEmail(updatedOrder, updatedOrder.user).catch((err) => {
        console.error("Failed to send delivery confirmation email:", err);
        // Don't fail the request if email fails
      });
    }
    
    res.json(updatedOrder);
  } catch (error) {
    console.error("Mark delivered error:", error);
    res.status(500).json({ message: "Failed to mark order as delivered" });
  }
};
