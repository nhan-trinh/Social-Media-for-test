import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: String, ref: "User", required: true }, // User who receives the notification
    from_user: { type: String, ref: "User", required: true }, // User who triggered the notification
    type: {
      type: String,
      enum: [
        "like_post",
        "like_comment", 
        "like_share",
        "comment_post",
        "comment_share",
        "reply_comment",
        "share_post",
        "follow",
        "new_post",
        "new_story",
        "change_profile"
      ],
      required: true,
    },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    comment: { type: mongoose.Schema.Types.ObjectId, ref: "Comment" },
    share: { type: mongoose.Schema.Types.ObjectId, ref: "Share" },
    story: { type: mongoose.Schema.Types.ObjectId, ref: "Story" },
    message: { type: String, required: true },
    profile: {type: String},
    is_read: { type: Boolean, default: false },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, minimize: false }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
