import mongoose from "mongoose";

const shareSchema = new mongoose.Schema(
  {
    user: { type: String, ref: "User", required: true },
    content: { type: String },
    shared_post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
    likes_count: [{ type: String, ref: "User" }],
    comments_count: { type: Number, default: 0 }, // Add this field
    share_count: { type: Number, default: 0 },
    is_original: { type: Boolean, default: true },
  },
  { timestamps: true, minimize: false }
);

const Share = mongoose.model("Share", shareSchema);

export default Share;
