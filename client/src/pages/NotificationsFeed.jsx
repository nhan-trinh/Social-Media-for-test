import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Check, Trash2, RefreshCw } from "lucide-react";
import { useNotification } from "../contexts/NotificationContext";
import NotificationsCard from "../components/NotificationsCard";

const NotificationsFeed = () => {
  const {
    notifications = [], // Default to empty array
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotification();

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchNotifications(1);
    setPage(1);
    setHasMore(true);
  }, []);

  const handleLoadMore = async () => {
    if (isLoading || !hasMore) return;
    
    const nextPage = page + 1;
    const data = await fetchNotifications(nextPage);
    
    if (data && data.notifications && data.notifications.length === 0) {
      setHasMore(false);
    } else {
      setPage(nextPage);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  // Safe check - notifications is now guaranteed to be an array
  if (isLoading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {unreadCount}
                </span>
              )}
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <Check className="w-4 h-4" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Bell className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No notifications yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-center">
                When someone likes, comments, shares, or follows you, you'll see it here.
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationsCard
                key={notification._id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
              />
            ))
          )}
        </div>

        {/* Load More Button */}
        {hasMore && notifications.length > 0 && (
          <div className="p-4 text-center">
            <button
              onClick={handleLoadMore}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>Load More</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsFeed;