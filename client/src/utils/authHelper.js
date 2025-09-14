import { useAuth, useUser } from "@clerk/clerk-react";
import toast from "react-hot-toast";

/**
 * Hook để xử lý authentication một cách nhất quán
 */
export const useAuthHelper = () => {
  const { getToken } = useAuth();
  const { user } = useUser();

  /**
   * Lấy token và kiểm tra authentication
   * @returns {Promise<string|null>} Token nếu có, null nếu không
   */
  const getValidToken = async () => {
    if (!user) {
      console.warn("No user found");
      return null;
    }

    try {
      const token = await getToken();
      if (!token) {
        console.warn("No token available");
        toast.error("Authentication failed. Please login again.");
        return null;
      }
      return token;
    } catch (error) {
      console.error("Error getting token:", error);
      toast.error("Authentication failed. Please login again.");
      return null;
    }
  };

  /**
   * Kiểm tra xem user có authenticated không
   * @returns {boolean}
   */
  const isAuthenticated = () => {
    return !!user;
  };

  /**
   * Xử lý lỗi authentication
   * @param {Error} error - Error object
   * @param {string} defaultMessage - Default error message
   */
  const handleAuthError = (error, defaultMessage = "Authentication failed") => {
    console.error("Auth error:", error);
    
    if (error.response?.status === 401) {
      toast.error("Session expired. Please refresh the page and try again.");
    } else {
      toast.error(error.response?.data?.message || defaultMessage);
    }
  };

  return {
    getValidToken,
    isAuthenticated,
    handleAuthError,
    user
  };
};

/**
 * Utility function để retry API call với token refresh
 * @param {Function} apiCall - Function thực hiện API call
 * @param {number} maxRetries - Số lần retry tối đa
 * @returns {Promise<any>}
 */
export const retryWithAuth = async (apiCall, maxRetries = 2) => {
  let retryCount = 0;
  
  while (retryCount <= maxRetries) {
    try {
      return await apiCall();
    } catch (error) {
      if (error.response?.status === 401 && retryCount < maxRetries) {
        retryCount++;
        console.log(`Retrying API call... (${retryCount}/${maxRetries})`);
        // Đợi một chút trước khi retry
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        continue;
      }
      throw error;
    }
  }
};
