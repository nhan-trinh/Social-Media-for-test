import React, { createContext, useContext, useEffect, useState } from "react";
import { useSocket } from "./SocketContext";
import { useAuth, useUser } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useTranslation } from "react-i18next";
import notificationSound from "../sounds/notification.mp3";
import { useRef } from "react";

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useUser();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);

  // Tạo key unique cho mỗi user để tránh conflict
  const getStorageKey = (userId) => `notification_unread_count_${userId}`;

  // Khởi tạo unreadCount từ localStorage với user-specific key
  const [unreadCount, setUnreadCount] = useState(() => {
    if (user?.id) {
      const savedCount = localStorage.getItem(getStorageKey(user.id));
      console.log("Loading unread count from localStorage:", savedCount);
      return savedCount ? parseInt(savedCount, 10) : 0;
    }
    return 0;
  });

  const [isLoading, setIsLoading] = useState(false);
  const { getToken } = useAuth();
  const { t } = useTranslation();

  // Helper function để cập nhật unreadCount và lưu vào localStorage
  const updateUnreadCount = (newCount) => {
    const count = Math.max(0, newCount);
    console.log("Updating unread count:", count);
    setUnreadCount(count);

    if (user?.id) {
      localStorage.setItem(getStorageKey(user.id), count.toString());
      console.log("Saved to localStorage:", getStorageKey(user.id), count);
    }
  };

  // Đồng bộ unreadCount từ localStorage khi user thay đổi
  useEffect(() => {
    if (user?.id) {
      const savedCount = localStorage.getItem(getStorageKey(user.id));
      if (savedCount !== null) {
        const count = parseInt(savedCount, 10);
        console.log("User changed, loading count from localStorage:", count);
        setUnreadCount(count);
      }
    }
  }, [user?.id]);

  // Fetch notifications from API
  const fetchNotifications = async (page = 1, limit = 20) => {
    if (!user) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `${
          import.meta.env.VITE_BASEURL
        }/api/notification?page=${page}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${await getToken()}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const newNotifications = Array.isArray(data.notifications)
          ? data.notifications
          : [];

        if (page === 1) {
          setNotifications(newNotifications);
        } else {
          setNotifications((prev) => {
            const prevArray = Array.isArray(prev) ? prev : [];
            return [...prevArray, ...newNotifications];
          });
        }
        return data;
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch unread count và ưu tiên localStorage nếu có
  const fetchUnreadCount = async () => {
    if (!user) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASEURL}/api/notification/unread-count`,
        {
          headers: {
            Authorization: `Bearer ${await getToken()}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const serverCount = data.count || 0;

        // Kiểm tra xem localStorage có dữ liệu không
        const savedCount = localStorage.getItem(getStorageKey(user.id));

        if (savedCount !== null) {
          // Nếu có localStorage, ưu tiên sử dụng localStorage
          console.log(
            "Using localStorage count:",
            savedCount,
            "vs server count:",
            serverCount
          );
          const localCount = parseInt(savedCount, 10);
          setUnreadCount(localCount);

          // Tùy chọn: Đồng bộ với server nếu cần
          // updateUnreadCount(Math.max(localCount, serverCount));
        } else {
          // Nếu không có localStorage, sử dụng server count
          console.log("Using server count:", serverCount);
          updateUnreadCount(serverCount);
        }
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    if (!user) return;

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BASEURL
        }/api/notification/${notificationId}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${await getToken()}`,
          },
        }
      );

      if (response.ok) {
        setNotifications((prev) => {
          const prevArray = Array.isArray(prev) ? prev : [];
          return prevArray.map((notif) =>
            notif._id === notificationId ? { ...notif, is_read: true } : notif
          );
        });

        updateUnreadCount(unreadCount - 1);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASEURL}/api/notification/mark-all-read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${await getToken()}`,
          },
        }
      );

      if (response.ok) {
        setNotifications((prev) => {
          const prevArray = Array.isArray(prev) ? prev : [];
          return prevArray.map((notif) => ({ ...notif, is_read: true }));
        });

        updateUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    if (!user) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASEURL}/api/notification/${notificationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${await getToken()}`,
          },
        }
      );

      if (response.ok) {
        setNotifications((prev) => {
          const prevArray = Array.isArray(prev) ? prev : [];
          const deletedNotif = prevArray.find(
            (notif) => notif._id === notificationId
          );
          const filteredArray = prevArray.filter(
            (notif) => notif._id !== notificationId
          );

          if (deletedNotif && !deletedNotif.is_read) {
            updateUnreadCount(unreadCount - 1);
          }

          return filteredArray;
        });
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const notificationAudio = useRef(new Audio(notificationSound));

  // Listen for real-time notifications
  useEffect(() => {
    if (socket && user) {
      const handleNewNotification = (notification) => {
        console.log("New notification received:", notification);

        setNotifications((prev) => {
          const prevArray = Array.isArray(prev) ? prev : [];
          return [notification, ...prevArray];
        });

        updateUnreadCount(unreadCount + 1);

        const getNotificationMessage = (type, fromUser) => {
          switch (type) {
            case "like_post":
              return `${fromUser.full_name} liked your post`;
            case "like_comment":
              return `${fromUser.full_name} liked your comment`;
            case "like_share":
              return `${fromUser.full_name} liked your share`;
            case "comment_post":
              return `${fromUser.full_name} commented on your post`;
            case "comment_share":
              return `${fromUser.full_name} commented on your share`;
            case "reply_comment":
              return `${fromUser.full_name} replied to your comment`;
            case "share_post":
              return `${fromUser.full_name} shared your post`;
            case "follow":
              return `${fromUser.full_name} started following you`;
            case "new_post":
              return `${fromUser.full_name} created a new post`;
            case "new_story":
              return `${fromUser.full_name} created a new story`;
            case "change_profile":
              return `${fromUser.full_name} changed profile picture`;
            default:
              return notification.message;
          }
        };

        notificationAudio.current.play().catch(() => {});
        toast.success(
          getNotificationMessage(notification.type, notification.from_user),
          {
            duration: 5000,
            position: "bottom-right",
          }
        );
      };

      socket.on("new_notification", handleNewNotification);

      return () => {
        socket.off("new_notification", handleNewNotification);
      };
    }
  }, [socket, user, unreadCount]);

  // Fetch initial data
  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [user]);

  // Cleanup localStorage của các user khác khi user thay đổi
  useEffect(() => {
    if (!user) {
      // Có thể cleanup tất cả notification localStorage keys nếu cần
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("notification_unread_count_")) {
          // localStorage.removeItem(key); // Uncomment nếu muốn cleanup
        }
      });
      setUnreadCount(0);
    }
  }, [user]);

  // Debug: Log localStorage changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key?.startsWith("notification_unread_count_")) {
        console.log("LocalStorage changed:", e.key, e.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const value = {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updateUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
