import React from "react";
import {
  Bell,
  Heart,
  MessageCircle,
  Share,
  UserPlus,
  Image,
  FileText,
  X,
} from "lucide-react";

import api from "../api/axios";

const NotificationsCard = ({ notification, onMarkAsRead, onDelete }) => {
  const getNotificationIcon = (type) => {
    const iconClasses = "w-4 h-4";
    switch (type) {
      case "like_post":
      case "like_comment":
      case "like_share":
        return <Heart className={`${iconClasses} text-red-500`} />;
      case "comment_post":
      case "comment_share":
      case "reply_comment":
        return <MessageCircle className={`${iconClasses} text-blue-500`} />;
      case "share_post":
        return <Share className={`${iconClasses} text-green-500`} />;
      case "follow":
        return <UserPlus className={`${iconClasses} text-purple-500`} />;
      case "new_post":
        return <FileText className={`${iconClasses} text-orange-500`} />;
      case "new_story":
        return <Image className={`${iconClasses} text-pink-500`} />;
      case "change_profile":
        return <Image className={`${iconClasses} text-pink-500`} />;
      default:
        return <Bell className={`${iconClasses} text-gray-500`} />;
    }
  };

  const getIconBackground = (type) => {
    switch (type) {
      case "like_post":
      case "like_comment":
      case "like_share":
        return "bg-red-50 dark:bg-red-900/20";
      case "comment_post":
      case "comment_share":
      case "reply_comment":
        return "bg-blue-50 dark:bg-blue-900/20";
      case "share_post":
        return "bg-green-50 dark:bg-green-900/20";
      case "follow":
        return "bg-purple-50 dark:bg-purple-900/20";
      case "new_post":
        return "bg-orange-50 dark:bg-orange-900/20";
      case "new_story":
        return "bg-pink-50 dark:bg-pink-900/20";
      case "change_profile":
        return "bg-pink-50 dark:bg-pink-900/20";
      default:
        return "bg-gray-50 dark:bg-gray-800";
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffInMinutes = Math.floor((now - notifDate) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}p`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification._id);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(notification._id);
  };

  return (
    <div
      className={`relative group p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
        !notification.is_read ? "bg-blue-50/30 dark:bg-blue-900/5" : ""
      }`}
      onClick={handleClick}
    >
      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
      >
        <X className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
      </button>

      <div className="flex items-start space-x-3 pr-8">
        {/* Icon */}
        <div
          className={`w-10 h-10 rounded-full ${getIconBackground(
            notification.type
          )} flex items-center justify-center flex-shrink-0`}
        >
          {getNotificationIcon(notification.type)}
        </div>

        {/* User avatar */}
        <div className="flex-shrink-0">
          <img
            src={
              notification.from_user?.profile_picture || "/default-avatar.png"
            }
            alt={notification.from_user?.full_name}
            className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-gray-600"
          />
        </div>

        <div className="flex-1 min-w-0">
          {/* Main notification text */}
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm text-gray-900 dark:text-white">
              <span className="font-semibold">
                {notification.from_user?.full_name || "Someone"}
              </span>{" "}
              <span className="font-normal text-gray-600 dark:text-gray-300">
                {notification.message
                  ?.replace(notification.from_user?.full_name, "")
                  .trim() || "interacted with your content"}
                {/* {notification.post.content} */}
              </span>
            </p>
            {!notification.is_read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
            )}
          </div>

          {/* Time */}
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {formatTimeAgo(notification.createdAt)}
          </p>

          {notification.post &&
            ["like_share"].includes(notification.type) && (
              <div className="mt-2 p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                  {notification.post.content}
                </p>
              </div>
            )}

          {/* Post preview */}
          {notification.post && (
            <div className="mt-2 p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                {notification.post.content}
              </p>
            </div>
          )}

          {/* Comment preview */}
          {notification.comment && (
            <div className="mt-2 p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                <span className="text-gray-400">"</span>
                {notification.comment.content}
                <span className="text-gray-400">"</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsCard;
