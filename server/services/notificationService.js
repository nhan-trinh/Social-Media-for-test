import Notification from "../models/Notification.js";
import User from "../models/User.js";
import Connections from "../models/Connections.js";
import { type } from "os";

// Helper function to get user's connections (followers)
const getUserConnections = async (userId) => {
  const user = await User.findById(userId).populate("followers");
  return user?.followers || [];
};

// Helper function to get user's following list
const getUserFollowing = async (userId) => {
  const user = await User.findById(userId).populate("following");
  return user?.following || [];
};

// Helper function to send notification via Socket.IO
const sendNotification = (io, userId, notification) => {
  io.to(`user_${userId}`).emit("new_notification", notification);
};

// Create and send notification
export const createNotification = async (io, notificationData) => {
  try {
    const {
      user,
      from_user,
      type,
      post,
      comment,
      share,
      story,
      message,
      metadata = {},
    } = notificationData;

    // Don't send notification to self
    if (user === from_user) return null;

    const notification = new Notification({
      user,
      from_user,
      type,
      post,
      comment,
      share,
      story,
      message,
      metadata,
    });

    await notification.save();

    // Populate the notification for sending
    const populatedNotification = await Notification.findById(notification._id)
      .populate("from_user", "full_name username profile_picture")
      .populate("post", "content image_urls")
      .populate("comment", "content")
      .populate("share", "content")
      .populate("story", "image_urls");

    // Send via Socket.IO
    sendNotification(io, user, populatedNotification);

    return populatedNotification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
};

// Notification handlers for different actions
export const handleLikePost = async (io, postId, userId, postOwnerId) => {
  const fromUser = await User.findById(userId);
  if (!fromUser) return;

  return createNotification(io, {
    user: postOwnerId,
    from_user: userId,
    type: "like_post",
    post: postId,
    message: `${fromUser.full_name} liked your post`,
    metadata: { postId },
  });
};

export const handleLikeComment = async (io, commentId, userId, commentOwnerId) => {
  const fromUser = await User.findById(userId);
  if (!fromUser) return;

  return createNotification(io, {
    user: commentOwnerId,
    from_user: userId,
    type: "like_comment",
    comment: commentId,
    message: `${fromUser.full_name} liked your comment`,
    metadata: { commentId },
  });
};

export const handleLikeShare = async (io, shareId, userId, shareOwnerId) => {
  const fromUser = await User.findById(userId);
  if (!fromUser) return;

  return createNotification(io, {
    user: shareOwnerId,
    from_user: userId,
    type: "like_share",
    share: shareId,
    message: `${fromUser.full_name} liked your share`,
    metadata: { shareId },
  });
};

export const handleCommentPost = async (io, postId, commentId, userId, postOwnerId) => {
  const fromUser = await User.findById(userId);
  if (!fromUser) return;

  return createNotification(io, {
    user: postOwnerId,
    from_user: userId,
    type: "comment_post",
    post: postId,
    comment: commentId,
    message: `${fromUser.full_name} commented on your post`,
    metadata: { postId, commentId },
  });
};

export const handleCommentShare = async (io, shareId, commentId, userId, shareOwnerId) => {
  const fromUser = await User.findById(userId);
  if (!fromUser) return;

  return createNotification(io, {
    user: shareOwnerId,
    from_user: userId,
    type: "comment_share",
    share: shareId,
    comment: commentId,
    message: `${fromUser.full_name} commented on your share`,
    metadata: { shareId, commentId },
  });
};

export const handleReplyComment = async (io, parentCommentId, replyId, userId, parentCommentOwnerId) => {
  const fromUser = await User.findById(userId);
  if (!fromUser) return;

  return createNotification(io, {
    user: parentCommentOwnerId,
    from_user: userId,
    type: "reply_comment",
    comment: replyId,
    message: `${fromUser.full_name} replied to your comment`,
    metadata: { parentCommentId, replyId },
  });
};

export const handleSharePost = async (io, postId, shareId, userId, postOwnerId) => {
  const fromUser = await User.findById(userId);
  if (!fromUser) return;

  return createNotification(io, {
    user: postOwnerId,
    from_user: userId,
    type: "share_post",
    post: postId,
    share: shareId,
    message: `${fromUser.full_name} shared your post`,
    metadata: { postId, shareId },
  });
};

export const handleFollow = async (io, userId, followedUserId) => {
  const fromUser = await User.findById(userId);
  if (!fromUser) return;

  return createNotification(io, {
    user: followedUserId,
    from_user: userId,
    type: "follow",
    message: `${fromUser.full_name} started following you`,
    metadata: { followedUserId },
  });
};

export const handleNewPost = async (io, postId, userId) => {
  const fromUser = await User.findById(userId);
  if (!fromUser) return;

  // Get all followers
  const followers = await getUserConnections(userId);
  
  // Send notification to all followers
  const notifications = [];
  for (const follower of followers) {
    const notification = await createNotification(io, {
      user: follower._id,
      from_user: userId,
      type: "new_post",
      post: postId,
      message: `${fromUser.full_name} created a new post`,
      metadata: { postId },
    });
    if (notification) notifications.push(notification);
  }

  return notifications;
};

export const handleNewStory = async (io, storyId, userId) => {
  const fromUser = await User.findById(userId);
  if (!fromUser) return;

  // Get all followers
  const followers = await getUserConnections(userId);
  
  // Send notification to all followers
  const notifications = [];
  for (const follower of followers) {
    const notification = await createNotification(io, {
      user: follower._id,
      from_user: userId,
      type: "new_story",
      story: storyId,
      message: `${fromUser.full_name} created a new story`,
      metadata: { storyId },
    });
    if (notification) notifications.push(notification);
  }

  return notifications;
};

export const updateProfilePictureAndCoverPhoto = async (io, userId, profilePictureUrl) => { 
  const fromUser = await User.findById(userId)
  if(!fromUser) return;

  const followers = await getUserConnections(userId)

  const notifications = []
  for (const follower of followers) {
    const notification = await createNotification(io, {
      user: follower._id,
      from_user: userId,
      type: "change_profile",
      frofile: profilePictureUrl,
      message: `${fromUser.full_name} changed profile picture`,
      metadata: {profilePictureUrl }
    })
    if(notification) notifications.push(notification)
  }
  return notifications;
}