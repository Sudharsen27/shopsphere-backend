import Coupon from "../models/Coupon.js";

// Public: list active coupons for display on checkout (code + description only, no sensitive data)
export const getPublicOffers = async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    })
      .select("code type value minOrderAmount usedCount usageLimit")
      .lean();

    const valid = (coupons || []).filter((c) => {
      if (c.usageLimit != null && (c.usedCount || 0) >= c.usageLimit) return false;
      return true;
    });

    const offers = valid.map((c) => ({
      code: c.code,
      type: c.type,
      value: c.value,
      minOrderAmount: c.minOrderAmount || 0,
      description:
        c.type === "percentage"
          ? `${c.value}% off${c.minOrderAmount ? ` on orders over ₹${Number(c.minOrderAmount).toLocaleString()}` : ""}`
          : `₹${c.value} off${c.minOrderAmount ? ` on orders over ₹${Number(c.minOrderAmount).toLocaleString()}` : ""}`,
    }));

    res.json(offers);
  } catch (error) {
    console.error("Get public offers error:", error);
    res.status(500).json({ message: "Failed to load offers" });
  }
};

export const validateCoupon = async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    if (!code || typeof code !== "string" || !code.trim()) {
      return res.status(400).json({ valid: false, message: "Coupon code is required" });
    }
    const subtotalNum = parseFloat(subtotal);
    if (isNaN(subtotalNum) || subtotalNum < 0) {
      return res.status(400).json({ valid: false, message: "Invalid subtotal" });
    }

    const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });
    if (!coupon) {
      return res.status(200).json({ valid: false, message: "Invalid or expired coupon" });
    }
    if (!coupon.isActive) {
      return res.status(200).json({ valid: false, message: "This coupon is no longer active" });
    }
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return res.status(200).json({ valid: false, message: "This coupon has expired" });
    }
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return res.status(200).json({ valid: false, message: "This coupon has reached its usage limit" });
    }
    if (subtotalNum < (coupon.minOrderAmount || 0)) {
      return res.status(200).json({
        valid: false,
        message: `Minimum order amount is ₹${(coupon.minOrderAmount || 0).toLocaleString()} to use this coupon`,
      });
    }

    let discountAmount = 0;
    if (coupon.type === "percentage") {
      discountAmount = Math.min((subtotalNum * coupon.value) / 100, subtotalNum);
    } else {
      discountAmount = Math.min(coupon.value, subtotalNum);
    }
    discountAmount = Math.round(discountAmount * 100) / 100;

    res.status(200).json({
      valid: true,
      message: "Coupon applied",
      couponCode: coupon.code,
      discountAmount,
      totalAfterDiscount: Math.round((subtotalNum - discountAmount) * 100) / 100,
    });
  } catch (error) {
    console.error("Validate coupon error:", error);
    res.status(500).json({ valid: false, message: "Failed to validate coupon" });
  }
};

export const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    console.error("Get coupons error:", error);
    res.status(500).json({ message: "Failed to fetch coupons" });
  }
};

export const getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    res.json(coupon);
  } catch (error) {
    console.error("Get coupon error:", error);
    res.status(500).json({ message: "Failed to fetch coupon" });
  }
};

export const createCoupon = async (req, res) => {
  try {
    const { code, type, value, minOrderAmount, expiresAt, usageLimit, isActive } = req.body;
    if (!code || !type || value === undefined) {
      return res.status(400).json({ message: "Code, type, and value are required" });
    }
    if (!["percentage", "fixed"].includes(type)) {
      return res.status(400).json({ message: "Type must be 'percentage' or 'fixed'" });
    }
    if (type === "percentage" && (value < 0 || value > 100)) {
      return res.status(400).json({ message: "Percentage value must be between 0 and 100" });
    }
    if (type === "fixed" && value < 0) {
      return res.status(400).json({ message: "Fixed value must be positive" });
    }
    const existing = await Coupon.findOne({ code: code.trim().toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: "A coupon with this code already exists" });
    }
    const coupon = new Coupon({
      code: code.trim().toUpperCase(),
      type,
      value: Number(value),
      minOrderAmount: minOrderAmount != null ? Number(minOrderAmount) : 0,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      usageLimit: usageLimit != null && usageLimit !== "" ? Number(usageLimit) : null,
      isActive: isActive !== false,
    });
    await coupon.save();
    res.status(201).json(coupon);
  } catch (error) {
    console.error("Create coupon error:", error);
    res.status(500).json({ message: "Failed to create coupon" });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    const { code, type, value, minOrderAmount, expiresAt, usageLimit, isActive } = req.body;
    if (code !== undefined) coupon.code = code.trim().toUpperCase();
    if (type !== undefined) coupon.type = type;
    if (value !== undefined) coupon.value = Number(value);
    if (minOrderAmount !== undefined) coupon.minOrderAmount = Number(minOrderAmount);
    if (expiresAt !== undefined) coupon.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit !== null && usageLimit !== "" ? Number(usageLimit) : null;
    if (isActive !== undefined) coupon.isActive = isActive;
    await coupon.save();
    res.json(coupon);
  } catch (error) {
    console.error("Update coupon error:", error);
    res.status(500).json({ message: "Failed to update coupon" });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    res.json({ message: "Coupon deleted successfully" });
  } catch (error) {
    console.error("Delete coupon error:", error);
    res.status(500).json({ message: "Failed to delete coupon" });
  }
};
