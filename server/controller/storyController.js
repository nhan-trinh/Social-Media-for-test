import fs from "fs";
import imagekit from "../configs/imagekit.js";
import Story from "../models/Story.js";
import User from "../models/User.js";
import { inngest } from "../inngest/index.js";
import { handleNewStory } from "../services/notificationService.js";

export const addUserStory = async (req, res) => {
  try {
    const { userId } = req.auth(); // lấy userId từ token xác thực thông qua middleware auth
    const { content, media_type, background_color } = req.body; // lấy nội dụng từ body request
    const media = req.file; // lấy media từ file request

    let media_url = ""; // khởi tạo 1 URl rỗng

    if (media_type === "image" || media_type === "video") {
      // nếu story là ảnh hoặc video
      const fileBuffer = fs.readFileSync(media.path); // thì sẽ đọc file tạm bằng fs.readFileSync(media.path)
      const response = await imagekit.upload({
        // upload file lên imagekit nhận về response.url
        file: fileBuffer,
        fileName: media.originalname,
      });
      media_url = response.url;
    }
    const story = await Story.create({
      // tạo một document Story mới trong MongoDB, gồm:
      user: userId, // id cửa người dùng
      content, // nội dung
      media_url, // link ảnh/video (nếu có).
      media_type, // loại story (image/text/video)
      background_color, // chọn nền
    });

    await inngest.send({
      name: "app/story.delete",
      data: { storyId: story._id },
    });

    // Send notification for new story
    const io = req.app.get("io");
    await handleNewStory(io, story._id, userId);

    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const getStories = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await User.findById(userId);

    const userIds = [userId, ...user.connections, ...user.following];
    const stories = await Story.find({ user: { $in: userIds } })
      .populate("user")
      .sort({ createdAt: -1 });

    res.json({ success: true, stories });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const deleteStory = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { storyId } = req.body;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.json({ success: false, message: "Story not found" });
    }

    if (story.user.toString() !== userId) {
      return res.json({
        success: false,
        message: "You are not authorized to delete this story",
      });
    }

    await Story.findByIdAndDelete(storyId);
    res.json({ success: true, message: "Story deleted successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
