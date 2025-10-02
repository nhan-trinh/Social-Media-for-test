import express from "express";
import {
  deleteMessage,
  getChatMessages,
  sendMessage,
  sseController,
} from "../controller/messageController.js"; 
import { upload } from "../configs/multer.js";
import { protect } from "../middleware/auth.js";

const messageRouter = express.Router();

messageRouter.get("/:userId", sseController);
messageRouter.post("/send", upload.single("image"), protect, sendMessage);
messageRouter.post("/get", protect, getChatMessages);
messageRouter.delete("/:messageId", protect, deleteMessage)

export default messageRouter;
