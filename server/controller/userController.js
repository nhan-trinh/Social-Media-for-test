import { error } from "console";
import imagekit from "../configs/imagekit.js";
import User from "../models/User.js";
import fs from "fs";
import Connection from "../models/Connections.js";
import Post from "../models/Post.js";
import { inngest } from "../inngest/index.js";
import Share from "../models/Share.js";
import { handleFollow } from "../services/notificationService.js";

export const getUserData = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await User.findById(userId).select("-email -password -__v");
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const updateUserData = async (req, res) => {
  try {
    const { userId } = req.auth();
    let { username, bio, location, full_name } = req.body;

    const tempUser = await User.findById(userId);
    !username && (username = tempUser.username);

    if (tempUser.username !== username) {
      const user = await User.findOne({ username });
      if (user) {
        username = tempUser.username;
      }
    }

    const updateData = {
      username,
      bio,
      location,
      full_name,
    };

    const profile = req.files.profile && req.files.profile[0];
    const cover = req.files.cover && req.files.cover[0];

    if (profile) {
      const buffer = fs.readFileSync(profile.path); 
      const response = await imagekit.upload({
        file: buffer,
        fileName: profile.originalname,
      });

      const url = imagekit.url({
        path: response.filePath,
        transformation: [
          { quality: "auto" },
          { format: "webp" },
          { width: "512" },
        ],
      });
      updateData.profile_picture = url;
    }

    if (cover) {
      const buffer = fs.readFileSync(cover.path);
      const response = await imagekit.upload({
        file: buffer,
        fileName: cover.originalname,
      });

      const url = imagekit.url({
        path: response.filePath,
        transformation: [
          { quality: "auto" },
          { format: "webp" },
          { width: "1280" },
        ],
      });
      updateData.cover_photo = url;
    }

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-email -password -__v");

    res.json({ success: true, user, message: "Profile Updated successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const discoverUsers = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { input } = req.body;

    const allUsers = await User.find({
      $or: [
        { username: new RegExp(input, "i") },
        { full_name: new RegExp(input, "i") },
        { location: new RegExp(input, "i") },
      ],
    }).select("-email -password -__v");
    
    const filteredUser = allUsers.filter((user) => user._id.toString() !== userId);
    res.json({ success: true, users: filteredUser });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const followUser = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;

    const user = await User.findById(userId);

    if (user.following.includes(id)) {
      return res.json({
        success: false,
        message: "You are already following this user",
      });
    }

    user.following.push(id);
    await user.save();

    const toUser = await User.findById(id);
    toUser.followers.push(userId);
    await toUser.save();

    // Send notification for follow
    const io = req.app.get("io");
    await handleFollow(io, userId, id);

    res.json({ success: true, message: "Now you are following this user" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;

    const user = await User.findById(userId);
    user.following = user.following.filter((user) => user.toString() !== id);
    await user.save();

    const toUser = await User.findById(id);
    toUser.followers = toUser.followers.filter((user) => user.toString() !== userId);
    await toUser.save();

    res.json({
      success: true,
      message: "You are no longer following this user",
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const sendConnectionRequest = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;

    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const connectionsRequests = await Connection.find({
      from_user_id: userId,
      created_at: { $gt: last24Hours },
    });
    if (connectionsRequests.length >= 20) {
      return res.json({
        success: false,
        message:
          "You have sent more than 20 connection requests in last 24 hours",
      });
    }

    const connection = await Connection.findOne({
      $or: [
        { from_user_id: userId, to_user_id: id },
        { from_user_id: id, to_user_id: userId },
      ],
    });

    if (!connection) {
      const newConnection = await Connection.create({
        from_user_id: userId,
        to_user_id: id,
      });

      await inngest.send({
        name: "app/connection-request",
        data: { connectionId: newConnection._id },
      });

      return res.json({
        success: true,
        message: "Connection request sent successfully",
      });
    } else if (connection && connection.status === "accepted") {
      return res.json({
        success: false,
        message: "You are already connected with this user",
      });
    }

    return res.json({ success: false, message: "connections request pending" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const getUserConnection = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await User.findById(userId)
      .populate({
        path: "connections",
        select: "-email -password -__v"
      })
      .populate({
        path: "followers", 
        select: "-email -password -__v"
      })
      .populate({
        path: "following",
        select: "-email -password -__v"
      })
      .select("-email -password -__v");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const connections = user.connections;
    const followers = user.followers;
    const following = user.following;

    const pendingConnections = (
      await Connection.find({ to_user_id: userId, status: "pending" }).populate({
        path: "from_user_id",
        select: "-email -password -__v"
      })
    ).map((connection) => connection.from_user_id);

    res.json({
      success: true,
      connections,
      followers,
      following,
      pendingConnections,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const accepteConnectionRequest = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;

    const connection = await Connection.findOne({
      from_user_id: id,
      to_user_id: userId,
    });

    if (!connection) {
      return res.json({ success: false, message: "Connection not found" });
    }

    const user = await User.findById(userId);
    user.connections.push(id);
    await user.save();

    const toUser = await User.findById(id);
    toUser.connections.push(userId);
    await toUser.save();

    connection.status = "accepted";
    await connection.save();

    res.json({ success: true, message: "Connection accepted successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const getUserProfiles = async (req, res) => {
  try {
    const { profileId } = req.body;
    const profile = await User.findById(profileId).select("-email -password -__v");

    if (!profile) {
      return res.json({ success: true, message: "Profile not found" });
    }
    
    const posts = await Post.find({ user: profileId }).populate({
      path: "user",
      select: "-email -password -__v"
    });
    
    const shares = await Share.find({ user: profileId })
      .populate({
        path: "user",
        select: "-email -password -__v"
      })
      .populate({
        path: "shared_post",
        populate: { 
          path: "user",
          select: "-email -password -__v"
        },
      })
      .sort({ createdAt: -1 });
      
    res.json({ success: true, profile, posts, shares });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};