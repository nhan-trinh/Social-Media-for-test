import imagekit from "../configs/imagekit.js";
import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import Share from "../models/Share.js";
import fs from "fs";
import { 
  handleCommentPost, 
  handleCommentShare, 
  handleReplyComment, 
  handleLikeComment 
} from "../services/notificationService.js";

// Thêm comment mới cho post thường
export const addComment = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { postId, content, comment_type ,parentCommentId } = req.body;
    // const media = req.file;

    // let media_url = ''

    // if(comment_type === 'image' || comment_type === 'video'){
    //   const fileBuffer = fs.readFileSync(media.path)
    //   const response = await imagekit.upload({
    //     file: fileBuffer,
    //     fileName: media.originalname, 
    //   })
    //   media_url = response.url
    // }

    // Kiểm tra post có tồn tại không
    const post = await Post.findById(postId);
    if (!post) {
      return res.json({ success: false, message: "Post not found" });
    }

    // Tạo comment mới
    const comment = await Comment.create({
      user: userId,
      post: postId,
      content,
      parent_comment: parentCommentId || null,
      post_type: "post",
      // comment_type,
      // media_url,
    });

    // Cập nhật comments_count trong Post
    await Post.findByIdAndUpdate(postId, {
      $inc: { comments_count: 1 },
    });

    // Populate user info
    const populatedComment = await Comment.findById(comment._id).populate(
      "user"
    );

    // Send notification for comment
    const io = req.app.get("io");
    if (parentCommentId) {
      // This is a reply to a comment
      const parentComment = await Comment.findById(parentCommentId);
      await handleReplyComment(io, parentCommentId, comment._id, userId, parentComment.user);
    } else {
      // This is a comment on a post
      await handleCommentPost(io, postId, comment._id, userId, post.user);
    }

    res.json({
      success: true,
      message: "Comment added successfully",
      comment: populatedComment,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Lấy comments của một post thường
export const getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;

    const comments = await Comment.find({
      post: postId,
      parent_comment: null,
      post_type: "post",
    })
      .populate("user", "-email")
      .sort({ createdAt: -1 });

    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ parent_comment: comment._id })
          .populate("user")
          .sort({ createdAt: 1 });
        return {
          ...comment.toObject(),
          replies,
        };
      })
    );

    res.json({
      success: true,
      comments: commentsWithReplies,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Thêm comment cho share post
export const addCommentToShare = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { shareId, content, parentCommentId } = req.body;

    const share = await Share.findById(shareId);
    if (!share) {
      return res.json({ success: false, message: "Share post not found" });
    }

    const commentShare = await Comment.create({
      user: userId,
      share: shareId, // Use share field instead of post
      content,
      parent_comment: parentCommentId || null,
      post_type: "share",
    });

    await Share.findByIdAndUpdate(shareId, {
      $inc: { comments_count: 1 },
    });

    const populatedCommentShare = await Comment.findById(
      commentShare._id
    ).populate("user");

    // Send notification for comment on share
    const io = req.app.get("io");
    if (parentCommentId) {
      // This is a reply to a comment
      const parentComment = await Comment.findById(parentCommentId);
      await handleReplyComment(io, parentCommentId, commentShare._id, userId, parentComment.user);
    } else {
      // This is a comment on a share
      await handleCommentShare(io, shareId, commentShare._id, userId, share.user);
    }

    res.json({
      success: true,
      message: "Comment added successfully",
      comment: populatedCommentShare,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Lấy comments của share post
export const getPostCommentShare = async (req, res) => {
  try {
    const { shareId } = req.params;

    const comments = await Comment.find({
      share: shareId,
      parent_comment: null,
      post_type: "share",
    })
      .populate("user")
      .sort({ createdAt: -1 });

    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ parent_comment: comment._id })
          .populate("user")
          .sort({ createdAt: -1 });
        return {
          ...comment.toObject(),
          replies,
        };
      })
    );

    res.json({
      success: true,
      comments: commentsWithReplies,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Like/Unlike comment (works for both post and share)
export const likeComment = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { commentId } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.json({ success: false, message: "Comment not found" });
    }

    if (comment.likes_count.includes(userId)) {
      // Unlike
      comment.likes_count = comment.likes_count.filter(
        (user) => user !== userId
      );
      await comment.save();
      res.json({ success: true, message: "Comment unliked" });
    } else {
      // Like
      comment.likes_count.push(userId);
      await comment.save();
      
      // Send notification for like
      const io = req.app.get("io");
      await handleLikeComment(io, commentId, userId, comment.user);
      
      res.json({ success: true, message: "Comment liked" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Xóa comment (works for both post and share)
export const deleteComment = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { commentId } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.json({ success: false, message: "Comment not found" });
    }

    // Kiểm tra quyền xóa dựa trên post_type
    let canDelete = false;

    if (comment.post_type === "post" && comment.post) {
      const post = await Post.findById(comment.post);
      canDelete =
        comment.user.toString() === userId || post.user.toString() === userId;
    } else if (comment.post_type === "share" && comment.share) {
      const share = await Share.findById(comment.share);
      canDelete =
        comment.user.toString() === userId || share.user.toString() === userId;
    }

    if (!canDelete) {
      return res.json({
        success: false,
        message: "Not authorized to delete this comment",
      });
    }

    // Đếm số lượng comments sẽ bị xóa
    const commentCount = await Comment.countDocuments({
      $or: [{ _id: commentId }, { parent_comment: commentId }],
    });

    // Xóa comment và tất cả replies
    await Comment.deleteMany({
      $or: [{ _id: commentId }, { parent_comment: commentId }],
    });

    // Cập nhật comments_count tương ứng
    if (comment.post_type === "post" && comment.post) {
      await Post.findByIdAndUpdate(comment.post, {
        $inc: { comments_count: -commentCount },
      });
      // Đảm bảo không bị âm
      const updatedPost = await Post.findById(comment.post);
      if (updatedPost && updatedPost.comments_count < 0) {
        await Post.findByIdAndUpdate(comment.post, { comments_count: 0 });
      }
    } else if (comment.post_type === "share" && comment.share) {
      await Share.findByIdAndUpdate(comment.share, {
        $inc: { comments_count: -commentCount },
      });
      // Đảm bảo không bị âm
      const updatedShare = await Share.findById(comment.share);
      if (updatedShare && updatedShare.comments_count < 0) {
        await Share.findByIdAndUpdate(comment.share, { comments_count: 0 });
      }
    }

    res.json({
      success: true,
      message: "Comment deleted successfully",
      deletedCount: commentCount,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Cập nhật comment (works for both post and share)
export const updateComment = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { commentId, content } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.json({ success: false, message: "Comment not found" });
    }

    // Chỉ cho phép user tạo comment cập nhật
    if (comment.user.toString() !== userId) {
      return res.json({
        success: false,
        message: "Not authorized to update this comment",
      });
    }

    comment.content = content;
    await comment.save();

    const updatedComment = await Comment.findById(commentId).populate("user");

    res.json({
      success: true,
      message: "Comment updated successfully",
      comment: updatedComment,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Sync comments count
export const syncCommentsCount = async (req, res) => {
  try {
    // Sync for posts
    const posts = await Post.find();
    for (const post of posts) {
      const actualCount = await Comment.countDocuments({
        post: post._id,
        post_type: "post",
      });
      await Post.findByIdAndUpdate(post._id, { comments_count: actualCount });
    }

    // Sync for shares
    const shares = await Share.find();
    for (const share of shares) {
      const actualCount = await Comment.countDocuments({
        share: share._id,
        post_type: "share",
      });
      await Share.findByIdAndUpdate(share._id, { comments_count: actualCount });
    }

    res.json({
      success: true,
      message: "Comments count synced for all posts and shares",
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
