import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import { fetchUser } from "../features/user/userSlice";

const WhoToFollow = () => {
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [followingStates, setFollowingStates] = useState({}); // Track individual follow states
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);

  const { getToken } = useAuth();
  const currentUser = useSelector((state) => state.user.value);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const USERS_PER_PAGE = 3;

  // Fetch suggested users
  const fetchSuggestedUsers = async (page = 1, isLoadMore = false) => {
    try {
      if (!isLoadMore) {
        setLoadingSuggestions(true);
      }

      // Sử dụng API discover để lấy users
      const { data } = await api.post(
        "/api/user/discover",
        { input: "" }, // Empty input để lấy random users
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        }
      );

      if (data.success && data.users) {
        // Filter users: loại bỏ current user và users đã follow
        const filteredUsers = data.users.filter(
          (user) =>
            user._id !== currentUser?._id &&
            !currentUser?.following?.includes(user._id)
        );

        // Pagination logic
        const startIndex = (page - 1) * USERS_PER_PAGE;
        const endIndex = startIndex + USERS_PER_PAGE;
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

        if (isLoadMore) {
          setSuggestedUsers((prev) => [...prev, ...paginatedUsers]);
        } else {
          setSuggestedUsers(paginatedUsers);
        }

        // Check if there are more users
        setHasMoreUsers(endIndex < filteredUsers.length);
      } else {
        setSuggestedUsers([]);
        setHasMoreUsers(false);
      }
    } catch (error) {
      console.error("Error fetching suggested users:", error.message);
      setSuggestedUsers([]);
      setHasMoreUsers(false);
    } finally {
      if (!isLoadMore) {
        setLoadingSuggestions(false);
      }
    }
  };

  // Handle follow action
  const handleFollow = async (userId) => {
    try {
      // Set loading state for this specific user
      setFollowingStates((prev) => ({ ...prev, [userId]: "loading" }));

      const { data } = await api.post(
        "/api/user/follow",
        { id: userId },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (data.success) {
        toast.success(data.message);

        // Update following state for this user - GIỮ LẠI TRONG DANH SÁCH
        setFollowingStates((prev) => ({ ...prev, [userId]: "following" }));

        // Update Redux store nhưng KHÔNG fetch lại suggested users
        // Sử dụng callback để cập nhật user mà không trigger re-fetch
        dispatch(fetchUser(await getToken()));
      } else {
        toast.error(data.message);
        setFollowingStates((prev) => ({ ...prev, [userId]: "follow" }));
      }
    } catch (error) {
      toast.error(error.message);
      setFollowingStates((prev) => ({ ...prev, [userId]: "follow" }));
    }
  };

  // Handle show more
  const handleShowMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchSuggestedUsers(nextPage, true);
  };

  // Initialize suggestions only once when component mounts
  useEffect(() => {
    if (currentUser) {
      fetchSuggestedUsers(1, false);
      setCurrentPage(1);
    }
  }, []);

  const getButtonState = (userId) => {
    // Ưu tiên trạng thái từ local state trước
    if (followingStates[userId]) {
      return followingStates[userId];
    }
    // Nếu không có trạng thái local, kiểm tra từ currentUser
    return currentUser?.following?.includes(userId) ? "following" : "follow";
  };

  const renderFollowButton = (user) => {
    const buttonState = getButtonState(user._id);

    switch (buttonState) {
      case "loading":
        return (
          <button
            disabled
            className="px-4 py-1.5 bg-gray-400 text-white text-xs rounded-md transition-colors"
          >
            ...
          </button>
        );
      case "following":
        return (
          <button
            disabled
            className="px-4 py-1.5 bg-green-600 text-white text-xs rounded-md transition-colors cursor-pointer"
          >
            Following
          </button>
        );
      default:
        return (
          <button
            onClick={() => handleFollow(user._id)}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md transition-colors cursor-pointer"
          >
            Follow
          </button>
        );
    }
  };

  return (
    <div className="max-w-xs bg-white dark:bg-primary-dark overflow-y-scroll no-scrollbar rounded-md shadow">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-slate-800 dark:text-gray-300 font-semibold text-lg">
          Who to follow
        </h3>
      </div>

      <div className="p-4">
        {loadingSuggestions ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : suggestedUsers.length > 0 ? (
          <div className="space-y-4">
            {suggestedUsers.map((user) => (
              <div key={user._id} className="flex items-center justify-between">
                <div
                  className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate(`/profile/${user._id}`)}
                >
                  <img
                    src={user.profile_picture || "/default-avatar.png"}
                    alt={user.full_name}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                      {user.full_name}
                    </p>
                    {user.username && (
                      <p className="text-gray-500 text-xs truncate">
                        @{user.username}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {user.followers?.length || 0} followers
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-2">
                  {renderFollowButton(user)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            No suggestions available
          </p>
        )}
      </div>

      {(suggestedUsers.length > 0 || hasMoreUsers) && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {hasMoreUsers ? (
            <button
              onClick={handleShowMore}
              className="text-blue-600 dark:text-blue-400 text-sm font-medium w-full text-left cursor-pointer"
            >
              Show more
            </button>
          ) : (
            <button
              onClick={() => navigate("/discover")}
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium w-full text-left"
            >
              Discover more people
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default WhoToFollow;
