import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

/**
 * Get dashboard stats for admin: orders, revenue, low stock, recent orders, top products.
 * GET /api/admin/stats
 */
export const getStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total orders and revenue (all time, paid orders only for revenue)
    const allOrders = await Order.find().lean();
    const totalOrders = allOrders.length;
    const paidOrders = allOrders.filter((o) => o.isPaid || o.status === "delivered" || o.status === "shipped" || o.status === "processing");
    const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

    const ordersToday = allOrders.filter((o) => new Date(o.createdAt) >= startOfToday);
    const revenueToday = ordersToday
      .filter((o) => o.isPaid || ["delivered", "shipped", "processing"].includes(o.status))
      .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

    const ordersThisMonth = allOrders.filter((o) => new Date(o.createdAt) >= startOfMonth);
    const revenueThisMonth = ordersThisMonth
      .filter((o) => o.isPaid || ["delivered", "shipped", "processing"].includes(o.status))
      .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

    // Low stock: countInStock <= 5
    const lowStockProducts = await Product.find({ countInStock: { $lte: 5 } })
      .select("name countInStock price")
      .limit(20)
      .lean();

    // Recent orders (last 10)
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("user", "name email")
      .lean();

    // Top products by quantity sold (from order items)
    const orderItems = await Order.aggregate([
      { $unwind: "$orderItems" },
      { $group: { _id: "$orderItems.product", totalQty: { $sum: "$orderItems.qty" }, totalRevenue: { $sum: { $multiply: ["$orderItems.price", "$orderItems.qty"] } } } },
      { $sort: { totalQty: -1 } },
      { $limit: 10 },
      { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
      { $unwind: "$product" },
      { $project: { name: "$product.name", totalQty: 1, totalRevenue: 1, _id: 0, productId: "$_id" } },
    ]);

    const totalUsers = await User.countDocuments();

    res.json({
      totalOrders,
      totalRevenue,
      revenueToday,
      revenueThisMonth,
      ordersToday: ordersToday.length,
      ordersThisMonth: ordersThisMonth.length,
      totalUsers,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
      recentOrders,
      topProducts: orderItems,
    });
  } catch (error) {
    console.error("Admin getStats error:", error);
    res.status(500).json({ message: "Failed to load dashboard stats" });
  }
};
