import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Check, Trash2, RefreshCw } from "lucide-react";
import { useNotification } from "../contexts/NotificationContext";
import NotificationsCard from "../components/NotificationsCard";
import Pagination from "../components/Pagination"; // Sửa đường dẫn import
import Loading from "../components/Loading";
import { useTranslation } from "react-i18next";

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

  const { t } = useTranslation();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Tính toán dữ liệu cho pagination
  const totalItems = notifications.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNotifications = notifications.slice(startIndex, endIndex);

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Reset về trang 1 khi có notifications mới
  useEffect(() => {
    if (notifications.length > 0 && currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [notifications.length, currentPage, totalPages]);

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    // Scroll to top khi chuyển trang
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          (<Loading height="60vh" />)
          <p className="text-gray-600 dark:text-gray-400">
            Loading notifications...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {t("Notifications")}
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
                <span>{t("Mark all as read")}</span>
              </button>
            )}
          </div>
        </div>

        {/* Thông tin phân trang */}
        {totalItems > 0 && (
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400">
            {t("Showing")} {startIndex + 1}-{Math.min(endIndex, totalItems)} of{" "}
            {totalItems} {t("notifications")}
          </div>
        )}

        {/* Notifications List */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Bell className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t("No notifications yet")}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-center">
                {t(
                  "When someone likes, comments, shares, or follows you, you'll see it here."
                )}
              </p>
            </div>
          ) : (
            currentNotifications.map((notification) => (
              <NotificationsCard
                key={notification._id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
              />
            ))
          )}
        </div>

        {/* Pagination Component - Chỉ hiển thị khi có nhiều hơn 1 trang */}
        {totalPages > 1 && (
          <div className="px-4 pb-4">
            <Pagination
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              setCurrentPage={handlePageChange}
            />
          </div>
        )}

        {/* Loading indicator khi đang tải */}
        {isLoading && notifications.length > 0 && (
          <div className="p-4 text-center">
            (<Loading height="60vh" />)
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsFeed;
