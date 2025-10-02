import fs from "fs/promises";
import imagekit from "../configs/imagekit.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";
import Share from "../models/Share.js";
import {
  handleLikePost,
  handleNewPost,
} from "../services/notificationService.js";

export const addPost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { content, post_type } = req.body;
    const images = req.files;

    let image_urls = [];

    if (images.length) {
      image_urls = await Promise.all(
        images.map(async (image) => {
          const fileBuffer = await fs.readFile(image.path);
          const response = await imagekit.upload({
            file: fileBuffer,
            fileName: image.originalname,
            folder: "posts",
          });

          // Detect if the uploaded file is a video
          const isVideo =
            (image.mimetype && image.mimetype.startsWith("video")) ||
            /\.(mp4|webm|ogg)$/i.test(image.originalname || "");

          if (isVideo) {
            // For videos, keep the original format URL so the browser can play it
            return response.url;
          }

          // For images, continue serving optimized WEBP with width/quality transformations
          const url = imagekit.url({
            path: response.filePath,
            transformation: [
              { quality: "auto" },
              { format: "webp" },
              { width: "1280" },
            ],
          });
          return url;
        })
      );
    }

    const post = await Post.create({
      user: userId,
      content,
      image_urls,
      post_type,
    });

    // Send notification to followers about new post
    const io = req.app.get("io");
    await handleNewPost(io, post._id, userId);

    res.json({ success: true, message: "Post created successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const getFeedPosts = async (req, res) => {
  try {
    // Lấy tất cả bài viết, không lọc theo userId
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .populate("user", "-email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments();
    const hasMore = page * limit < total;

    // Đảm bảo comments_count được đồng bộ cho mỗi post
    const postsWithCommentCount = await Promise.all(
      posts.map(async (post) => {
        if (post.comments_count === undefined || post.comments_count === null) {
          const commentCount = await Comment.countDocuments({ post: post._id });
          await Post.findByIdAndUpdate(post._id, {
            comments_count: commentCount,
          });
          return { ...post.toObject(), comments_count: commentCount };
        }
        return post.toObject();
      })
    );

    res.json({
      success: true,
      posts: postsWithCommentCount,
      hasMore,
      totalPosts: total,
      currentPage: page,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const likePost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { postId } = req.body;

    const post = await Post.findById(postId);

    if (post.likes_count.includes(userId)) {
      post.likes_count = post.likes_count.filter((user) => user !== userId);
      await post.save();
      res.json({ success: true, message: "Post unliked" });
    } else {
      post.likes_count.push(userId);
      await post.save();

      // Send notification for like
      const io = req.app.get("io");
      await handleLikePost(io, postId, userId, post.user);

      res.json({ success: true, message: "Post liked" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Delete post
export const deletePost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { postId } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.json({ success: false, message: "Post not found" });
    }

    // Chỉ owner mới được xóa post
    if (post.user.toString() !== userId) {
      return res.json({
        success: false,
        message: "Not authorized to delete this post",
      });
    }

    // Xóa tất cả comments của post này
    await Comment.deleteMany({ post: postId });

    // Cập nhật tất cả Share documents có shared_post trỏ đến post này
    // Thay vì xóa share, chúng ta đánh dấu shared_post là null và thêm thông tin deleted
    await Share.updateMany(
      { shared_post: postId },
      {
        $unset: { shared_post: 1 }, // Xóa reference đến post gốc
        $set: {
          shared_post_deleted: true,
          deleted_message: "Content isn't available right now",
        },
      }
    );

    // Xóa post gốc
    await Post.findByIdAndDelete(postId);

    res.json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Update post content
export const updatePost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { postId, content } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.json({ success: false, message: "Post not found" });
    }

    // Chỉ owner mới được edit post
    if (post.user.toString() !== userId) {
      return res.json({
        success: false,
        message: "Not authorized to edit this post",
      });
    }

    post.content = content;
    await post.save();

    res.json({
      success: true,
      message: "Post updated successfully",
      post,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
