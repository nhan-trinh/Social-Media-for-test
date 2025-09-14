import express from "express";
import { protect } from "../middleware/auth.js";
import {
  addSharePost,
  deleteSharePost,
  getPostShare,
  getSharedPosts,
  getUserShares,
  likeSharePost,
  updateSharePost,
} from "../controller/shareController.js";

const shareRouter = express.Router();

shareRouter.post("/add", protect, addSharePost);
shareRouter.get("/feed", protect, getSharedPosts);
shareRouter.post("/like", protect, likeSharePost);
shareRouter.post("/delete", protect, deleteSharePost);
shareRouter.post("/update", protect, updateSharePost);

shareRouter.get("/posts/:postId", protect, getPostShare);
shareRouter.get("/user/:userId", protect, getUserShares);

export default shareRouter;
