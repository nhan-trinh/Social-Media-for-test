import React, { useEffect, useState } from "react";
import { Eye, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useSelector } from "react-redux";
import api from "../api/axios";
import { useTranslation } from "react-i18next";

const Message = () => {
  const { t } = useTranslation();
  const { connections } = useSelector((state) => state.connections);
  const { getToken, userId: currentUserId } = useAuth();
  const navigate = useNavigate();
  const [recentMessages, setRecentMessages] = useState({});
  const [unseenCounts, setUnseenCounts] = useState({});

  // Fetch tin nhắn gần đây cho mỗi connection
  const fetchRecentMessages = async () => {
    try {
      const token = await getToken();
      const messagesData = {};
      const unseenData = {};

      for (const connection of connections) {
        const { data } = await api.post(
          "/api/message/get",
          { to_user_id: connection._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (data.success && data.messages.length > 0) {
          const sortedMessages = data.messages.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          messagesData[connection._id] = sortedMessages[0];

          const unseenCount = data.messages.filter(
            (msg) => msg.from_user_id === connection._id && !msg.seen
          ).length;
          unseenData[connection._id] = unseenCount;
        }
      }

      setRecentMessages(messagesData);
      setUnseenCounts(unseenData);
    } catch (error) {
      console.error("Error fetching recent messages:", error);
    }
  };

  useEffect(() => {
    if (connections.length > 0) {
      fetchRecentMessages();
    }
  }, [connections]);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString("vi-VN");
    }
  };

  const handleChatClick = (userId) => {
    setUnseenCounts((prev) => ({
      ...prev,
      [userId]: 0,
    }));
    navigate(`/messages/${userId}`);
  };

  return (
    <div className="min-h-screen dark:bg-gray-900 relative bg-slate-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {t("Messages")}
            </h1>
            {/* Connection status sẽ được quản lý từ global state */}
          </div>
          <p className="text-slate-600 dark:text-gray-400">
            {t("Talk to your friends and family")}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {connections.map((user) => {
            const lastMessage = recentMessages[user._id];
            const unseenCount = unseenCounts[user._id] || 0;

            return (
              <div
                key={user._id}
                className={`max-w-xl flex flex-wrap gap-5 p-6 bg-white dark:bg-primary-dark shadow rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  unseenCount > 0 ? "border-l-4 border-blue-500" : ""
                }`}
                onClick={() => handleChatClick(user._id)}
              >
                <div className="relative">
                  <img
                    src={user.profile_picture}
                    alt=""
                    className="rounded-full size-12 mx-auto cursor-pointer ring ring-gray-100 dark:ring-gray-800 shadow"
                  />
                  {unseenCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                      {unseenCount > 99 ? "99+" : unseenCount}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p
                        className={`font-medium text-slate-700 dark:text-white ${
                          unseenCount > 0 ? "font-bold" : ""
                        }`}
                      >
                        {user.full_name}
                      </p>
                      <p className="text-slate-500 text-sm">@{user.username}</p>
                    </div>
                    {lastMessage && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatTime(lastMessage.createdAt)}
                      </span>
                    )}
                  </div>

                  {lastMessage ? (
                    <div className="mt-2">
                      <p
                        className={`text-sm text-gray-600 truncate ${
                          unseenCount > 0 ? "font-medium" : ""
                        }`}
                      >
                        {lastMessage.from_user_id === currentUserId
                          ? "You: "
                          : ""}
                        {lastMessage.message_type === "image"
                          ? "📷 Image"
                          : lastMessage.text}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 mt-2">
                      {t("No messages yet")}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2 mt-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChatClick(user._id);
                    }}
                    className="size-10 flex items-center justify-center text-sm rounded bg-slate-100 dark:bg-gray-900 hover:bg-slate-200 text-slate-800 active:scale-95 transition cursor-pointer gap-1"
                  >
                    <MessageSquare className="w-4 h-4 dark:text-gray-50" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/profile/${user._id}`);
                    }}
                    className="size-10 flex items-center justify-center text-sm rounded bg-slate-100 dark:bg-gray-900 hover:bg-slate-200 text-slate-800 active:scale-95 transition cursor-pointer"
                  >
                    <Eye className="w-4 h-4  dark:text-gray-50" />
                  </button>
                </div>
              </div>
            );
          })}

          {connections.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">{t("No messages yet")}</p>
              <p className="text-gray-400">
                {t("Connect with friends to start messaging")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
