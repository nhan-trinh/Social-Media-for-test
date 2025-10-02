import React, { useEffect, useState } from "react";
import { MessageSquare, ChevronRight } from "lucide-react";
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
      return date.toLocaleDateString("vi-VN", { 
        day: '2-digit',
        month: '2-digit'
      });
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
    <div className="min-h-screen dark:bg-gray-900 bg-slate-50">
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-1">
            {t("Messages")}
          </h1>
          <p className="text-sm text-slate-600 dark:text-gray-400">
            {t("Talk to your friends and family")}
          </p>
        </div>

        <div className="space-y-2">
          {connections.map((user) => {
            const lastMessage = recentMessages[user._id];
            const unseenCount = unseenCounts[user._id] || 0;
            const hasUnread = unseenCount > 0;

            return (
              <div
                key={user._id}
                onClick={() => handleChatClick(user._id)}
                className={`
                  relative bg-white dark:bg-gray-800 rounded-xl p-4
                  hover:bg-gray-50 dark:hover:bg-gray-750 
                  transition-all duration-200 cursor-pointer
                  border border-gray-100 dark:border-gray-700
                  hover:shadow-md hover:-translate-y-0.5
                  ${hasUnread ? 'ring-2 ring-indigo-500/20' : ''}
                `}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar with online status */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={user.profile_picture}
                      alt={user.full_name}
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-white dark:ring-gray-800"
                    />
                    {hasUnread && (
                      <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs font-bold rounded-full h-6 min-w-[24px] px-1.5 flex items-center justify-center shadow-lg">
                        {unseenCount > 99 ? "99+" : unseenCount}
                      </span>
                    )}
                  </div>

                  {/* Message content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className={`text-base font-semibold text-slate-900 dark:text-white truncate ${hasUnread ? 'font-bold' : ''}`}>
                        {user.full_name}
                      </h3>
                      {lastMessage && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                          {formatTime(lastMessage.createdAt)}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      @{user.username}
                    </p>

                    {lastMessage ? (
                      <div className="flex items-center gap-2">
                        {lastMessage.message_type === "image" && (
                          <span className="text-gray-400">📷</span>
                        )}
                        <p className={`text-sm truncate ${
                          hasUnread 
                            ? 'text-slate-900 dark:text-white font-medium' 
                            : 'text-gray-600 dark:text-gray-300'
                        }`}>
                          {lastMessage.from_user_id === currentUserId && (
                            <span className="text-gray-500">You: </span>
                          )}
                          {lastMessage.message_type === "image"
                            ? "Image"
                            : lastMessage.text}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                        {t("No messages yet")}
                      </p>
                    )}
                  </div>

                  {/* Arrow icon */}
                  <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                </div>
              </div>
            );
          })}

          {connections.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <MessageSquare className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-lg font-medium mb-2">
                {t("No messages yet")}
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">
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