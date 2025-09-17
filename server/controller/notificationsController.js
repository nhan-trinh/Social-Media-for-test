import Notification from "../models/Notification.js";
import User from "../models/User.js";

export const getNotifications = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { page = 1, limit = 5 } = req.query;

    const notifications = await Notification.find({ user: userId })
      .populate("from_user", "full_name username profile_picture")
      .populate("post", "content image_urls")
      .populate("comment", "content")
      .populate("share", "content")
      .populate("story", "image_urls")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments({ user: userId });

    res.json({
      notifications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Error fetching notifications" });
  }
};

export const getUnReadNotifications = async (req, res) => {
  try {
    const { userId } = req.auth();
    const count = await Notification.countDocuments({
      user: userId,
      is_read: false,
    });
    res.json(count);
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ message: "Error fetching unread count" });
  }
};

export const markNotifications = async (req, res) => {
  try {
    const {userId} = req.auth()
    const notification = await Notification.findByIdAndUpdate(
      { _id: req.params.id, user: userId },
      { is_read: true },
      { new: true }
    );

    if (!notification) {
      return res.json({ success: false, message: "Notification not found" });
    }
    res.json(notification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Error marking notification as read" });
  }
};

export const markAllNotifications = async (req, res) => {
  try {
    const {userId} = req.auth()
    await Notification.updateMany(
      { user: userId, is_read: false },
      { is_read: true }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res
      .status(500)
      .json({ message: "Error marking all notifications as read" });
  }
};

export const deleteNotifications = async (req, res) => {
  try {
    const {userId} = req.auth()
    const notification = await Notification.findByIdAndDelete({
      _id: req.params.id,
      user: userId,
    });

    if (!notification) {
      return res.json({ success: false, message: "Notification not found" });
    }

    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: "Error deleting notification" });
  }
};
