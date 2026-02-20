import crypto from "crypto";
import Order from "../models/Order.js";

// Initialize Razorpay instance (lazy load)
let RazorpayInstance = null;
let cachedKeyId = null;
let cachedKeySecret = null;

const getRazorpayInstance = async () => {
  // Read env vars dynamically each time (in case they're updated)
  const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
  const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
  
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    console.error("❌ Razorpay keys missing:", {
      hasKeyId: !!RAZORPAY_KEY_ID,
      hasKeySecret: !!RAZORPAY_KEY_SECRET,
      keyIdValue: RAZORPAY_KEY_ID ? `${RAZORPAY_KEY_ID.substring(0, 10)}...` : "undefined",
    });
    return null;
  }
  
  // Recreate instance if keys changed
  if (!RazorpayInstance || cachedKeyId !== RAZORPAY_KEY_ID || cachedKeySecret !== RAZORPAY_KEY_SECRET) {
    try {
      const Razorpay = (await import("razorpay")).default;
      RazorpayInstance = new Razorpay({
        key_id: RAZORPAY_KEY_ID,
        key_secret: RAZORPAY_KEY_SECRET,
      });
      cachedKeyId = RAZORPAY_KEY_ID;
      cachedKeySecret = RAZORPAY_KEY_SECRET;
      console.log("✅ Razorpay instance initialized");
    } catch (error) {
      console.error("❌ Failed to initialize Razorpay:", error);
      return null;
    }
  }
  
  return RazorpayInstance;
};

// ==================================================
// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
// @access  Private
// ==================================================
export const createRazorpayOrder = async (req, res) => {
  try {
    const { orderId, amount } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({ message: "Order ID and amount are required" });
    }

    // Verify order exists and belongs to user
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (order.isPaid) {
      return res.status(400).json({ message: "Order already paid" });
    }

    const razorpay = await getRazorpayInstance();
    
    if (!razorpay) {
      return res.status(500).json({ message: "Payment gateway not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your environment variables." });
    }

    // Convert amount to paise (Razorpay uses smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    // Create order in Razorpay
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `order_${orderId}`,
      notes: {
        orderId: orderId.toString(),
        userId: req.user._id.toString(),
      },
    });

    res.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Create Razorpay order error:", error);
    res.status(500).json({ message: "Failed to create payment order" });
  }
};

// ==================================================
// @desc    Verify Razorpay payment
// @route   POST /api/payments/verify
// @access  Private
// ==================================================
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return res.status(400).json({ message: "Payment verification data missing" });
    }

    // Verify order exists and belongs to user
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Verify signature
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
    if (!RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ message: "Payment gateway secret not configured" });
    }
    
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(text)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // Update order payment status
    order.isPaid = true;
    order.paidAt = new Date();
    order.status = "processing";
    order.paymentMethod = "Online Payment";
    order.paymentId = razorpay_payment_id;
    order.razorpayOrderId = razorpay_order_id;

    await order.save();

    res.json({
      success: true,
      message: "Payment verified successfully",
      order: order,
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({ message: "Failed to verify payment" });
  }
};

// ==================================================
// @desc    Razorpay webhook handler
// @route   POST /api/payments/webhook
// @access  Public (Razorpay calls this)
// ==================================================
export const razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    if (!signature) {
      return res.status(400).json({ message: "Missing signature" });
    }

    // Verify webhook signature
    const text = JSON.stringify(req.body);
    const generatedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(text)
      .digest("hex");

    if (generatedSignature !== signature) {
      return res.status(400).json({ message: "Invalid webhook signature" });
    }

    const event = req.body.event;
    const paymentData = req.body.payload.payment.entity;

    if (event === "payment.captured") {
      // Find order by payment ID
      const order = await Order.findOne({ paymentId: paymentData.id });

      if (order && !order.isPaid) {
        order.isPaid = true;
        order.paidAt = new Date();
        order.status = "processing";
        await order.save();
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ message: "Webhook processing failed" });
  }
};
