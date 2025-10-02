import { Calendar, MapPin, PenBox, Verified } from "lucide-react";
import React, { useState } from "react";
import moment from "moment";
import { Link } from "react-router-dom";
import ProfileModal from "./profile/ProfileModal";

const UserProfileInfo = ({ user, posts, profileId, setShowEdit }) => {
  const [isOpenProfileModal, setIsOpenProfileModal] = useState(false);
  // Helper function to get count safely
  const getCount = (field, arrayField) => {
    // Try count field first (from sanitized data)
    if (user[field] !== undefined) {
      return user[field];
    }
    // Fallback to array length (for compatibility)
    if (user[arrayField] && Array.isArray(user[arrayField])) {
      return user[arrayField].length;
    }
    return 0;
  };

  const followersCount = getCount("followersCount", "followers");
  const followingCount = getCount("followingCount", "following");

  return (
    <>
      <div className="relative py-4 px-6 md:px-8 bg-white dark:bg-primary-dark">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="w-32 h-32 border-4 border-white dark:border-gray-900 shadow-lg absolute -top-16 rounded-full overflow-hidden">
            <img
              src={user.profile_picture || "/default-avatar.png"}
              alt={user.full_name || "Profile picture"}
              className="w-32 h-32 rounded-full object-cover cursor-pointer"
              onClick={() => setIsOpenProfileModal(true)}
              onError={(e) => (e.target.src = "/default-avatar.png")}
            />
          </div>

          <div className="w-full pt-16 md:pt-0 md:pl-36">
            <div className="flex flex-col md:flex-row items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {user.full_name || "No name set"}
                  </h1>
                  {user.isVerified && (
                    <Verified className="w-6 h-6 text-blue-500" />
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {user.username ? `@${user.username}` : "Add a username"}
                </p>

                {/* Show relationship status for other users */}
                {profileId && user.relationshipStatus && (
                  <div className="flex items-center gap-2 mt-2">
                    {user.relationshipStatus.isFollowing && (
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                        Following
                      </span>
                    )}
                    {user.relationshipStatus.isConnected && (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                        Connected
                      </span>
                    )}
                    {user.relationshipStatus.isFollower && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded-full">
                        Follows you
                      </span>
                    )}
                  </div>
                )}
              </div>

              {!profileId && (
                <button
                  onClick={() => setShowEdit(true)}
                  className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800 px-4 py-2 rounded-lg font-medium transition-colors mt-4 md:mt-0 cursor-pointer"
                >
                  <PenBox className="w-4 h-4" />
                  Edit
                </button>
              )}
            </div>

            <p className="text-gray-700 text-sm max-w-md mt-4 dark:text-gray-400">
              {user.bio || "No bio added yet."}
            </p>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 mt-4">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {user.location || "Add location"}
              </span>

              {/* Only show join date if available */}
              {user.createdAt && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Joined{" "}
                  <span className="font-medium">
                    {moment(user.createdAt).fromNow()}
                  </span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-6 mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
              <div>
                <span className="sm:text-xl font-bold text-gray-900 dark:text-white">
                  {posts?.length || 0}
                </span>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 ml-1.5">
                  Posts
                </span>
              </div>

              <div>
                <span className="sm:text-xl font-bold text-gray-900 dark:text-white">
                  {followersCount}
                </span>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 ml-1.5">
                  Followers
                </span>
              </div>

              <div>
                <span className="sm:text-xl font-bold text-gray-900 dark:text-white">
                  {followingCount}
                </span>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 ml-1.5">
                  Following
                </span>
              </div>

              {/* Show connections count if available */}
              {user.connectionsCount !== undefined && (
                <div>
                  <span className="sm:text-xl font-bold text-gray-900 dark:text-white">
                    {user.connectionsCount}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 ml-1.5">
                    Connections
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ProfileModal
        isOpen={isOpenProfileModal}
        onClose={() => setIsOpenProfileModal(false)}
        imageUrl={user.profile_picture}
        type="profile"
      />
    </>
  );
};

export default UserProfileInfo;
