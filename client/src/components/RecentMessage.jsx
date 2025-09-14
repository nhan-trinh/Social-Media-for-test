import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import moment from "moment";
import { useAuth, useUser } from "@clerk/clerk-react";
import api from "../api/axios";
import toast from "react-hot-toast";

const RecentMessage = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useUser();
  const { getToken } = useAuth();

  const fetchRecentMessages = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const token = await getToken();
      const { data } = await api.get("/api/user/recent-messages", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        const groupMessages = data.messages.reduce((acc, message) => {
          const senderId = message.from_user_id._id;
          if (
            !acc[senderId] ||
            new Date(message.createdAt) > new Date(acc[senderId].createdAt)
          ) {
            acc[senderId] = message;
          }
          return acc;
        }, {});

        const sortedMessages = Object.values(groupMessages).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setMessages(sortedMessages);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error fetching recent messages:", error);
      toast.error("Không thể tải tin nhắn gần đây");
    } finally {
      setLoading(false);
    }
  }, [user, getToken]);

  // Chỉ load một lần khi user login
  useEffect(() => {
    if (user) {
      fetchRecentMessages();
    } else {
      setMessages([]);
    }
  }, [user, fetchRecentMessages]);

  const truncateText = (text, maxLength = 25) => {
    if (!text) return "Media";
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  if (loading && messages.length === 0) {
    return (
      <div className="bg-white max-w-xs mt-4 p-4 dark:bg-gray-900 min-h-4 rounded-md shadow text-xs text-slate-800">
        <h3 className="font-semibold text-slate-800 mb-4">Recent Messages</h3>
        <div className="flex flex-col space-y-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="flex items-start gap-2 animate-pulse">
              <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                <div className="h-2 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white max-w-xs mt-4 p-4 min-h-4 dark:bg-primary-dark rounded-md shadow text-xs text-slate-800">
      <div className="flex items-center dark:text-gray-400 justify-between mb-4">
        <h3 className="font-semibold dark:text-gray-400 text-slate-800">Recent Messages</h3>
        <button
          onClick={fetchRecentMessages}
          className="text-indigo-500 hover:text-indigo-700 text-[10px] opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
          disabled={loading}
        >
          {loading ? "..." : "↻"}
        </button>
      </div>

      <div className="flex flex-col max-h-56 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center dark:text-gray-400 py-4 text-slate-500">
            <p>Chưa có tin nhắn nào</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <Link
              to={`/messages/${message.from_user_id._id}`}
              key={message._id || `${message.from_user_id._id}-${index}`}
              className="flex items-start gap-2 py-2 hover:bg-slate-100 rounded"
            >
              <img
                src={message.from_user_id.profile_picture}
                alt={message.from_user_id.full_name}
                className="w-8 h-8 rounded-full object-cover"
              />

              <div className="w-full min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                  <p className="font-medium text-slate-700 dark:text-gray-400 truncate">
                    {message.from_user_id.full_name}
                  </p>
                  <p className="text-[10px] text-slate-400 flex-shrink-0 ml-1">
                    {moment(message.createdAt).fromNow()}
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-slate-600 dark:text-gray-400 truncate flex-1">
                    {truncateText(message.text)}
                  </p>

                  {!message.seen && (
                    <div className="flex-shrink-0 ml-2">
                      <div className="bg-indigo-500 text-white w-4 h-4 flex items-center justify-center rounded-full text-[10px]">
                        1
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentMessage;