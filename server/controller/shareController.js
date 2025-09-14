import Share from "../models/Share.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";
import { handleSharePost, handleLikeShare } from "../services/notificationService.js";

export const addSharePost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { content, original_post_id } = req.body;

    const originalPost = await Post.findById(original_post_id).populate("user");
    if (!originalPost) {
      return res.json({ success: false, message: "Post not found" });
    }

    if (originalPost.shared_post) {
      return res.json({
        success: false,
        message: "You cannot share a shared post",
      });
    }

    const existingShare = await Share.findOne({
      user: userId,
      shared_post: original_post_id,
    });

    if (existingShare) {
      return res.json({
        success: false,
        message: "You have already shared this post",
      });
    }

    const sharePost = await Share.create({
      user: userId,
      content: content || "",
      shared_post: original_post_id,
      is_original_post: false,
      likes_count: [],
      comments_count: 0,
      share_count: 0,
      shared_post_deleted: false, // Track if shared post is deleted
    });

    await Post.findByIdAndUpdate(original_post_id, {
      $inc: { share_count: 1 },
    });

    const populatedSharePost = await Share.findById(sharePost._id)
      .populate("user")
      .populate({
        path: "shared_post",
        populate: {
          path: "user",
        },
      });

    // Send notification for share
    const io = req.app.get("io");
    await handleSharePost(io, original_post_id, sharePost._id, userId, originalPost.user);

    res.json({
      success: true,
      message: "Post shared successfully",
      share: populatedSharePost,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const getSharedPosts = async (req, res) => {
  try {
    const shares = await Share.find()
      .populate("user")
      .populate({
        path: "shared_post",
        populate: {
          path: "user",
        },
      })
      .sort({ createdAt: -1 });

    const formattedShares = shares.map(share => {
      // Nếu shared_post bị xóa hoặc không tồn tại
      if (!share.shared_post || share.shared_post_deleted) {
        return {
          ...share.toObject(),
          shared_post: {
            deleted: true,
            message: share.deleted_message || "Content isn't available right now"
          }
        };
      }
      return share.toObject();
    });

    const postsWithCommentCount = await Promise.all(
      formattedShares.map(async (share) => { 
        if (share.comments_count === undefined || share.comments_count === null) {
          const commentCount = await Comment.countDocuments({ post: share._id });
          await Share.findByIdAndUpdate(share._id, {
            comments_count: commentCount,
          });
          return { ...share, comments_count: commentCount };
        }
        return share;
      })
    );

    res.json({ success: true, shares: postsWithCommentCount });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const likeSharePost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { shareId } = req.body;

    const share = await Share.findById(shareId);

    if (share.likes_count.includes(userId)) {
      share.likes_count = share.likes_count.filter((user) => user !== userId);
      await share.save();
      res.json({ success: true, message: "Post unliked" });
    } else { 
      share.likes_count.push(userId);
      await share.save();
      
      // Send notification for like
      const io = req.app.get("io");
      await handleLikeShare(io, shareId, userId, share.user);
      
      res.json({ success: true, message: "Post liked" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const deleteSharePost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { shareId } = req.body;

    const share = await Share.findById(shareId);
    if (!share) {
      return res.json({ success: false, message: "Post not found" });
    }

    if (share.user.toString() !== userId) {
      return res.json({
        success: false,
        message: "You are not authorized to delete this post",
      });
    }
    await Comment.deleteMany({ post: shareId });

    await Share.findByIdAndDelete(shareId);
    res.json({ success: true, message: "Shared post deleted successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const updateSharePost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { shareId, content } = req.body;

    const share = await Share.findById(shareId);
    if (!share) {
      return res.json({ success: false, message: "Post not found" });
    }

    if (share.user.toString() !== userId) {
      return res.json({
        success: false,
        message: "You are not authorized to update this post",
      });
    }

    share.content = content;
    await share.save();

    res.json({ success: true, message: "Shared post updated successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const getPostShare = async (req, res) => {
  try {
    const { postId } = req.params;

    const shares = await Share.find({ shared_post: postId })
      .populate("user")
      .sort({ createdAt: -1 });

    res.json({ success: true, shares, count: shares.length });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const getUserShares = async (req, res) => {
  try {
    const { userId } = req.params;

    const shares = await Share.find({ user: userId })
      .populate("user")
      .populate({
        path: "shared_post",
        populate: {
          path: "user",
        },
      })
      .sort({ createdAt: -1 });

    const formattedShares = shares.map(share => {
      // Nếu shared_post bị xóa hoặc không tồn tại
      if (!share.shared_post || share.shared_post_deleted) {
        return {
          ...share.toObject(),
          shared_post: {
            deleted: true,
            message: share.deleted_message || "Content isn't available right now"
          }
        };
      }
      return share.toObject();
    });
    
    res.json({ success: true, shares: formattedShares, count: formattedShares.length });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};