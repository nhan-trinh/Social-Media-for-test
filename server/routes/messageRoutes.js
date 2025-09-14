import express from "express";
import {
  getChatMessages,
  sendMessage,
  sseController,
} from "../controller/messageController.js"; // Note: controllers (plural) and .js extension
import { upload } from "../configs/multer.js";
import { protect } from "../middleware/auth.js";

const messageRouter = express.Router();

messageRouter.get("/:userId", sseController);
messageRouter.post("/send", upload.single("image"), protect, sendMessage);
messageRouter.post("/get", protect, getChatMessages);

export default messageRouter;
