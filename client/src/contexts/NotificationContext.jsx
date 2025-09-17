import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSocket } from './SocketContext';
import { useAuth, useUser } from "@clerk/clerk-react";
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useTranslation } from 'react-i18next';
// import { useNotification } from '../contexts/NotificationContext'

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useUser();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { getToken } = useAuth();
  const {t} = useTranslation()

  // Fetch notifications from API
  const fetchNotifications = async (page = 1, limit = 20) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_BASEURL}/api/notification?page=${page}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${await getToken()}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        // Đảm bảo data.notifications là một mảng
        const newNotifications = Array.isArray(data.notifications) ? data.notifications : [];
        
        if (page === 1) {
          setNotifications(newNotifications);
        } else {
          setNotifications(prev => {
            // Đảm bảo prev luôn là mảng
            const prevArray = Array.isArray(prev) ? prev : [];
            return [...prevArray, ...newNotifications];
          });
        }
        return data;
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASEURL}/api/notification/unread-count`,
        {
          headers: {
            'Authorization': `Bearer ${await getToken()}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    if (!user) return;
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASEURL}/api/notification/${notificationId}/read`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${await getToken()}`,
          },
        }
      );
      
      if (response.ok) {
        setNotifications(prev => {
          // Đảm bảo prev luôn là mảng
          const prevArray = Array.isArray(prev) ? prev : [];
          return prevArray.map(notif =>
            notif._id === notificationId
              ? { ...notif, is_read: true }
              : notif
          );
        });
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASEURL}/api/notification/mark-all-read`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${await getToken()}`,
          },
        }
      );
      
      if (response.ok) {
        setNotifications(prev => {
          // Đảm bảo prev luôn là mảng
          const prevArray = Array.isArray(prev) ? prev : [];
          return prevArray.map(notif => ({ ...notif, is_read: true }));
        });
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    if (!user) return;
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASEURL}/api/notification/${notificationId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${await getToken()}`,
          },
        }
      );
      
      if (response.ok) {
        setNotifications(prev => {
          // Đảm bảo prev luôn là mảng
          const prevArray = Array.isArray(prev) ? prev : [];
          return prevArray.filter(notif => notif._id !== notificationId);
        });
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Listen for real-time notifications
  useEffect(() => {
    if (socket && user) {
      const handleNewNotification = (notification) => {
        console.log('New notification received:', notification);
        
        // Add to notifications list - đảm bảo notifications luôn là mảng
        setNotifications(prev => {
          const prevArray = Array.isArray(prev) ? prev : [];
          return [notification, ...prevArray];
        });
        
        // Increment unread count
        setUnreadCount(prev => prev + 1);
        
        // Show toast notification
        const getNotificationMessage = (type, fromUser) => {
          switch (type) {
            case 'like_post':
              return `${fromUser.full_name} liked your post`;
            case 'like_comment':
              return `${fromUser.full_name} liked your comment`;
            case 'like_share':
              return `${fromUser.full_name} liked your share`;
            case 'comment_post':
              return `${fromUser.full_name} commented on your post`;
            case 'comment_share':
              return `${fromUser.full_name} commented on your share`;
            case 'reply_comment':
              return `${fromUser.full_name} replied to your comment`;
            case 'share_post':
              return `${fromUser.full_name} shared your post`;
            case 'follow':
              return `${fromUser.full_name} started following you`;
            case 'new_post':
              return `${fromUser.full_name} created a new post`;
            case 'new_story':
              return `${fromUser.full_name} created a new story`;
            default:
              return notification.message;
          }
        };

        toast.success(getNotificationMessage(notification.type, notification.from_user), {
          duration: 5000,
          position: 'bottom-right',
        });
      };

      socket.on('new_notification', handleNewNotification);

      return () => {
        socket.off('new_notification', handleNewNotification);
      };
    }
  }, [socket, user]);

  // Fetch initial data
  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [user]);

  const value = {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};