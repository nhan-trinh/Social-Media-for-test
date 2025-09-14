import { Inngest } from "inngest";
import User from "../models/User.js";
import Connection from "../models/Connections.js";
import sendEmail from "../configs/nodemailer.js";
import Story from "../models/Story.js";
import Message from "../models/Message.js";
import Comment from "../models/Comment.js";
import Post from "../models/Post.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "pingup-app" });
//
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } =
      event.data;
    let username = email_addresses[0].email_address.split("@")[0];

    const user = await User.findOne({ username });

    if (user) {
      username = username + Math.floor(Math.random() * 10000);
    }

    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      full_name: first_name + " " + last_name,
      profile_picture: image_url,
      username,
    };
    await User.create(userData);
  }
);

//
const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } =
      event.data;

    const updateUserData = {
      email: email_addresses[0].email_address,
      full_name: first_name + " " + last_name,
      profile_picture: image_url,
    };
    await User.findByIdAndUpdate(id, updateUserData);
  }
);

const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-from-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    const { id } = event.data;
    
    console.log("=== Starting user deletion process ===");
    console.log("User ID to delete:", id);
    
    try {
      // Kiểm tra user có tồn tại không trước khi xóa
      const existingUser = await User.findById(id);
      if (!existingUser) {
        console.log("User not found in database, skipping deletion");
        return { success: true, message: "User not found, already deleted" };
      }
      
      console.log("Found user:", existingUser.username);
      
      // 1. Xóa user trước (quan trọng)
      const deletedUser = await User.findByIdAndDelete(id);
      console.log("✅ User deleted:", deletedUser ? "Success" : "Failed");
      
      // 2. Xóa connections
      const deletedConnections = await Connection.deleteMany({
        $or: [{ from_user_id: id }, { to_user_id: id }],
      });
      console.log("✅ Connections deleted:", deletedConnections.deletedCount);
      
      // 3. Xóa stories
      const deletedStories = await Story.deleteMany({ user: id });
      console.log("✅ Stories deleted:", deletedStories.deletedCount);
      
      // 4. Xóa messages
      const deletedMessages = await Message.deleteMany({
        $or: [{ from_user_id: id }, { to_user_id: id }],
      });
      console.log("✅ Messages deleted:", deletedMessages.deletedCount);
      
      // 5. Xóa comments
      const deletedComments = await Comment.deleteMany({ user: id });
      console.log("✅ Comments deleted:", deletedComments.deletedCount);
      
      // 6. Xóa posts
      const deletedPosts = await Post.deleteMany({ user: id });
      console.log("✅ Posts deleted:", deletedPosts.deletedCount);
      
      // 7. Cleanup references trong user arrays
      const updatedUsers = await User.updateMany(
        {
          $or: [
            { connections: id },
            { followers: id },
            { following: id }
          ]
        },
        {
          $pull: {
            connections: id,
            followers: id,
            following: id
          }
        }
      );
      console.log("✅ User references cleaned:", updatedUsers.modifiedCount);
      
      // 8. Cleanup likes trong posts
      const updatedPosts = await Post.updateMany(
        { likes_count: id },
        { $pull: { likes_count: id } }
      );
      console.log("✅ Post likes cleaned:", updatedPosts.modifiedCount);
      
      // 9. Cleanup likes trong comments
      const updatedComments = await Comment.updateMany(
        { likes_count: id },
        { $pull: { likes_count: id } }
      );
      console.log("✅ Comment likes cleaned:", updatedComments.modifiedCount);
      
      // 10. Cleanup story views
      const updatedStories = await Story.updateMany(
        { views_count: id },
        { $pull: { views_count: id } }
      );
      console.log("✅ Story views cleaned:", updatedStories.modifiedCount);
      
      console.log("=== User deletion completed successfully ===");
      
      return {
        success: true,
        message: "User and all related data deleted successfully",
        userId: id,
        deletedCounts: {
          user: deletedUser ? 1 : 0,
          connections: deletedConnections.deletedCount,
          stories: deletedStories.deletedCount,
          messages: deletedMessages.deletedCount,
          comments: deletedComments.deletedCount,
          posts: deletedPosts.deletedCount,
          updatedUsers: updatedUsers.modifiedCount,
          updatedPosts: updatedPosts.modifiedCount,
          updatedComments: updatedComments.modifiedCount,
          updatedStories: updatedStories.modifiedCount
        }
      };
      
    } catch (error) {
      console.error("❌ Error in user deletion process:", error);
      console.error("Stack trace:", error.stack);
      
      // QUAN TRỌNG: Throw error để Inngest biết function failed
      throw new Error(`Failed to delete user ${id}: ${error.message}`);
    }
  }
);

const sendNewConnectionRequestReminder = inngest.createFunction(
  { id: "send-new-connection-request-reminder" },
  { event: "/app/connection-request" },
  async ({ event, step }) => {
    const { connectionId } = event.data;

    await step.run("send-connection-request-mail", async () => {
      const connection = await Connection.findById(connectionId).populate(
        "from_user_id to_user_id"
      );
      const subject = `👏 New Connection request`;
      const body = `<div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Hi ${connection.to_user_id.full_name},</h2>
            <p>You have a new connection request from ${connection.from_user_id.full_name} - @${connection.from_user_id.username}</p>
            <p>Click <a href="${process.env.FRONTEND_URL}/connections" style="color: #10b981;">here</a> to accept or reject the request</p>
            <br/>
            <p>Thanks,<br/>PingUp - Stay Connected</p>
            </div>`;

      await sendEmail({
        to: connection.to_user_id.email,
        subject,
        body,
      });
    });
    const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await step.sleepUntil("wait-for-24-hours", in24Hours);
    await step.run("send-connection-request-reminder", async () => {
      const connection = await Connection.findById(connectionId).populate(
        "from_user_id to_user_id"
      );

      if (connection.status === "accepted") {
        return { message: "Already accepted" };
      }
      const subject = `👏 New Connection request`;
      const body = `<div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Hi ${connection.to_user_id.full_name},</h2>
            <p>You have a new connection request from ${connection.from_user_id.full_name} - @${connection.from_user_id.username}</p>
            <p>Click <a href="${process.env.FRONTEND_URL}/connections" style="color: #10b981;">here</a> to accept or reject the request</p>
            <br/>
            <p>Thanks,<br/>PingUp - Stay Connected</p>
            </div>`;

      await sendEmail({
        to: connection.to_user_id.email,
        subject,
        body,
      });
      return { message: "Reminder sent" };
    });
  }
);

const deleteStory = inngest.createFunction(
  { id: "story-delete" },
  { event: "app/story.delete" },
  async ({ event, step }) => {
    const { storyId } = event.data;
    const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await step.sleepUntil("wait-for-24-hours", in24Hours);
    await step.run("delete-story", async () => {
      await Story.findByIdAndDelete(storyId);
      return { message: "Story delete" };
    });
  }
);

const sendNotificationOfUnseenMessages = inngest.createFunction(
  { id: "send-unseen-messages-notification" },
  { cron: "TZ=America/New_York 0 9 * * *" },
  async ({ step }) => {
    const messages = await Message.find({ seen: false }).populate("to_user_id");
    const unseenCount = {};

    messages.map((message) => {
      unseenCount[message.to_user_id._id] =
        (unseenCount[message.to_user_id._id] || 0) + 1;
    });
    for (const userId in unseenCount) {
      const user = await User.findById(userId);

      const subject = `You have ${unseenCount[userId]} unseen messages`;

      const body = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Hi ${user.full_name}</h2>
        <p>You have ${unseenCount[userId]} unseen messages</p>
        <p>Click <a href="${process.env.FRONTEND_URL}/messages" style="color: #10b981;">here</a> to view them</p>
        <br/>
        <p>Thanks,<br/>PingUp - Stay Connected</p>
      </div>
      `;

      await sendEmail({
        to: user.email,
        subject,
        body,
      });
    }
    return { message: "Notification sent." };
  }
);

// Create an empty array where we'll export future Inngest functions
export const functions = [
  syncUserCreation,
  syncUserUpdation,
  syncUserDeletion,
  sendNewConnectionRequestReminder,
  deleteStory,
  sendNotificationOfUnseenMessages,
];
