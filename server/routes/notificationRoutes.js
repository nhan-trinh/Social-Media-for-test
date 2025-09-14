import express from "express";
import { protect } from "../middleware/auth.js";
import {
  deleteNotifications,
  getNotifications,
  getUnReadNotifications,
  markAllNotifications,
  markNotifications,
} from "../controller/notificationsController.js";

const notificationRouter = express.Router();

notificationRouter.get("/", protect, getNotifications);
notificationRouter.get("/unread-count", protect, getUnReadNotifications);
notificationRouter.patch("/:id/read", protect, markNotifications);
notificationRouter.patch("/mark-all-read", protect, markAllNotifications);
notificationRouter.delete("/:id", protect, deleteNotifications);

export default notificationRouter;

// import express from "express";
// import { protect as auth } from "../middleware/auth.js";
// import Notification from "../models/Notification.js";
// import User from "../models/User.js";

// const router = express.Router();

// // Get all notifications for a user
// router.get("/", auth, async (req, res) => {
//   try {
//     const { userId } = req.auth();
//     const { page = 1, limit = 20 } = req.query;

//     const notifications = await Notification.find({ user: userId })
//       .populate("from_user", "full_name username profile_picture")
//       .populate("post", "content image_urls")
//       .populate("comment", "content")
//       .populate("share", "content")
//       .populate("story", "image_urls")
//       .sort({ createdAt: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit);

//     const total = await Notification.countDocuments({ user: userId });

//     res.json({
//       notifications,
//       totalPages: Math.ceil(total / limit),
//       currentPage: page,
//       total,
//     });
//   } catch (error) {
//     console.error("Error fetching notifications:", error);
//     res.status(500).json({ message: "Error fetching notifications" });
//   }
// });

// // Get unread notification count
// router.get("/unread-count", auth, async (req, res) => {
//   try {
//     const { userId } = req.auth();
//     const count = await Notification.countDocuments({
//       user: userId,
//       is_read: false,
//     });
//     res.json({ count });
//   } catch (error) {
//     console.error("Error fetching unread count:", error);
//     res.status(500).json({ message: "Error fetching unread count" });
//   }
// });

// // Mark notification as read
// router.patch("/:id/read", auth, async (req, res) => {
//   try {
//     const { userId } = req.auth();
//     const notification = await Notification.findOneAndUpdate(
//       { _id: req.params.id, user: userId },
//       { is_read: true },
//       { new: true }
//     );

//     if (!notification) {
//       return res.status(404).json({ message: "Notification not found" });
//     }

//     res.json(notification);
//   } catch (error) {
//     console.error("Error marking notification as read:", error);
//     res.status(500).json({ message: "Error marking notification as read" });
//   }
// });

// // Mark all notifications as read
// router.patch("/mark-all-read", auth, async (req, res) => {
//   try {
//     const { userId } = req.auth();
//     await Notification.updateMany(
//       { user: userId, is_read: false },
//       { is_read: true }
//     );

//     res.json({ message: "All notifications marked as read" });
//   } catch (error) {
//     console.error("Error marking all notifications as read:", error);
//     res
//       .status(500)
//       .json({ message: "Error marking all notifications as read" });
//   }
// });

// // Delete notification
// router.delete("/:id", auth, async (req, res) => {
//   try {

//     const {userId} = req.auth()
//     const notification = await Notification.findOneAndDelete({
//       _id: req.params.id,
//       user: userId,
//     });

//     if (!notification) {
//       return res.status(404).json({ message: "Notification not found" });
//     }

//     res.json({ message: "Notification deleted successfully" });
//   } catch (error) {
//     console.error("Error deleting notification:", error);
//     res.status(500).json({ message: "Error deleting notification" });
//   }
// });

// export default router;
