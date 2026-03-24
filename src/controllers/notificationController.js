import Notification from "../models/Notification.js";

// @desc    Get logged-in user's notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    return res.json(notifications);
  } catch (error) {
    console.error("Get notifications error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
export const markNotificationAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    notification.isRead = true;
    await notification.save();

    return res.json(notification);
  } catch (error) {
    console.error("Mark notification as read error:", error);
    return res.status(500).json({ message: error.message });
  }
};
