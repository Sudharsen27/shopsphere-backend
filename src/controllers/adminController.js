import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { sendLowStockAlertEmail } from "../utils/emailService.js";

const LOW_STOCK_THRESHOLD = parseInt(process.env.LOW_STOCK_THRESHOLD || "5", 10);

/**
 * Get dashboard stats for admin: orders, revenue, low stock, recent orders, top products, sales over time.
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

    // Low stock: countInStock <= threshold
    const lowStockProducts = await Product.find({ countInStock: { $lte: LOW_STOCK_THRESHOLD } })
      .select("name countInStock price")
      .limit(50)
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

    // Sales over time: last 30 days (for charts)
    const days = parseInt(req.query.days, 10) || 30;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const salesOverTime = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          orders: { $sum: 1 },
          revenue: { $sum: { $cond: [{ $in: ["$status", ["processing", "shipped", "delivered"]] }, "$totalPrice", 0] } },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: "$_id", orders: 1, revenue: 1, _id: 0 } },
    ]);

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
      salesOverTime,
    });
  } catch (error) {
    console.error("Admin getStats error:", error);
    res.status(500).json({ message: "Failed to load dashboard stats" });
  }
};

/**
 * Bulk update or delete products. POST /api/admin/products/bulk
 * Body: { ids: string[], action: 'delete' | 'updateStock', countInStock?: number }
 */
export const bulkUpdateProducts = async (req, res) => {
  try {
    const { ids, action, countInStock } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ids array is required" });
    }
    if (action === "delete") {
      const result = await Product.deleteMany({ _id: { $in: ids } });
      return res.json({ message: `Deleted ${result.deletedCount} products`, deletedCount: result.deletedCount });
    }
    if (action === "updateStock" && typeof countInStock === "number") {
      const result = await Product.updateMany({ _id: { $in: ids } }, { $set: { countInStock } });
      return res.json({ message: `Updated ${result.modifiedCount} products`, modifiedCount: result.modifiedCount });
    }
    res.status(400).json({ message: "Invalid action or missing countInStock" });
  } catch (error) {
    console.error("Bulk products error:", error);
    res.status(500).json({ message: "Failed to update products" });
  }
};

/**
 * Bulk update order status. POST /api/admin/orders/bulk
 * Body: { ids: string[], status: string }
 */
export const bulkUpdateOrders = async (req, res) => {
  try {
    const { ids, status } = req.body;
    const valid = ["pending", "processing", "shipped", "delivered", "cancelled"];
    if (!ids || !Array.isArray(ids) || ids.length === 0 || !valid.includes(status)) {
      return res.status(400).json({ message: "ids array and valid status required" });
    }
    const ordersBeforeUpdate = await Order.find({ _id: { $in: ids } })
      .select("_id user")
      .lean();

    const result = await Order.updateMany(
      { _id: { $in: ids } },
      { $set: { status } }
    );
    if (status === "delivered") {
      await Order.updateMany({ _id: { $in: ids } }, { $set: { isDelivered: true, deliveredAt: new Date() } });
    }

    const notifications = ordersBeforeUpdate
      .filter((order) => order.user)
      .map((order) => ({
        userId: order.user,
        orderId: order._id,
        title: "Order Update",
        message: `Your order status is now ${status}`,
      }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.json({ message: `Updated ${result.modifiedCount} orders`, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error("Bulk orders error:", error);
    res.status(500).json({ message: "Failed to update orders" });
  }
};

/**
 * Export orders as CSV. GET /api/admin/orders/export
 */
export const exportOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).populate("user", "name email").lean();
    const headers = "Order ID,Date,Customer,Email,Total,Status,Payment\n";
    const rows = orders
      .map(
        (o) =>
          `"${o._id}","${new Date(o.createdAt).toISOString()}","${(o.user?.name || "").replace(/"/g, '""')}","${(o.user?.email || "").replace(/"/g, '""')}",${o.totalPrice || 0},"${o.status || ""}","${o.isPaid ? "Paid" : "Unpaid"}"`
      )
      .join("\n");
    const csv = headers + rows;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=orders-${new Date().toISOString().slice(0, 10)}.csv`);
    res.send(csv);
  } catch (error) {
    console.error("Export orders error:", error);
    res.status(500).json({ message: "Failed to export orders" });
  }
};

/**
 * Export products as CSV. GET /api/admin/products/export
 */
export const exportProducts = async (req, res) => {
  try {
    const products = await Product.find().lean();
    const headers = "ID,Name,Price,Stock,Category,Brand\n";
    const rows = products
      .map(
        (p) =>
          `"${p._id}","${(p.name || "").replace(/"/g, '""')}",${p.price || 0},${p.countInStock ?? 0},"${(p.category || "").replace(/"/g, '""')}","${(p.brand || "").replace(/"/g, '""')}"`
      )
      .join("\n");
    const csv = headers + rows;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=products-${new Date().toISOString().slice(0, 10)}.csv`);
    res.send(csv);
  } catch (error) {
    console.error("Export products error:", error);
    res.status(500).json({ message: "Failed to export products" });
  }
};

/**
 * Send low-stock alert email to admin. POST /api/admin/low-stock/alert
 */
export const sendLowStockAlert = async (req, res) => {
  try {
    const products = await Product.find({ countInStock: { $lte: LOW_STOCK_THRESHOLD } })
      .select("name countInStock price")
      .limit(100)
      .lean();
    const result = await sendLowStockAlertEmail(products, LOW_STOCK_THRESHOLD);
    res.json({ message: result.sent ? "Low-stock alert email sent" : result.message || "Email not sent" });
  } catch (error) {
    console.error("Low-stock alert error:", error);
    res.status(500).json({ message: "Failed to send alert" });
  }
};
