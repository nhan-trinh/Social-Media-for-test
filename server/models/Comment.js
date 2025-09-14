import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    user: { type: String, ref: "User", required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" }, // Removed required: true
    share: { type: mongoose.Schema.Types.ObjectId, ref: "Share" }, // Added share field
    content: { type: String, required: true },
    // media_url: { type: String },
    // comment_type: { type: String, enum: ["text", "image", "video"] },
    likes_count: [{ type: String, ref: "User" }],
    parent_comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    }, // For replies
    post_type: {
      type: String,
      enum: ["post", "share"],
      default: "post",
    }, // Phân biệt comment thuộc post thường hay share post
  },
  { timestamps: true, minimize: false }
);

// Custom validation để đảm bảo có ít nhất một trong hai: post hoặc share
commentSchema.pre("save", function (next) {
  if (this.post_type === "post" && !this.post) {
    return next(new Error("Post ID is required for post type comment"));
  }
  if (this.post_type === "share" && !this.share) {
    return next(new Error("Share ID is required for share type comment"));
  }
  if (!this.post && !this.share) {
    return next(new Error("Either post or share ID must be provided"));
  }
  next();
});

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;
