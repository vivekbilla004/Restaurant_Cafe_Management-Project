const Notification = require("../models/Notification");

// @desc    Get unread notifications for a restaurant
// @route   GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      restaurantId: req.user.restaurantId,
      isRead: false,
    }).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
const markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ message: "Notification cleared" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update notification" });
  }
};

module.exports = { getNotifications, markAsRead };
