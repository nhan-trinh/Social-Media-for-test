import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Loading from "../components/Loading";
import UserProfileInfo from "../components/UserProfileInfo";
import PostCard from "../components/PostCard";
import moment from "moment";
import ProfileModal from "../components/ProfileModal";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import SkeletonUserProfile from "../components/SkeletonUserProfile";
import SkeletonPostCard from "../components/SkeletonPostCard";
import SharePostCard from "../components/SharePostCard";

const Profile = () => {
  const currentUser = useSelector((state) => state.user.value);

  const { getToken } = useAuth();
  const { profileId } = useParams();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [shares, setShares] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [showEdit, setShowEdit] = useState(false);

  const fetchUser = async (profileId) => {
    const token = await getToken();
    try {
      const { data } = await api.post(
        `/api/user/profiles`,
        { profileId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (data.success) {
        setUser(data.profile);
        setPosts(data.posts);
        setShares(data.shares);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };
  // Handler để cập nhật post sau khi edit
  const handlePostUpdated = (postId, newContent) => {
    setPosts((prevFeed) =>
      prevFeed.map((post) =>
        post._id === postId ? { ...post, content: newContent } : post
      )
    );
  };

  // Handler để xóa post khỏi feed khi delete
  const handlePostDeleted = (postId) => {
    setPosts((prevFeed) => prevFeed.filter((post) => post._id !== postId));
  };

  useEffect(() => {
    if (profileId) {
      fetchUser(profileId);
    } else {
      fetchUser(currentUser._id);
    }
  }, [profileId, currentUser]);

  return user ? (
    <div className="relative h h-full overflow-y-scroll bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow overflow-hidden ">
          <div className="h-40 md:h-56 bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200">
            {user.cover_photo && (
              <img
                src={user.cover_photo}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <UserProfileInfo
            user={user}
            posts={posts}
            profileId={profileId}
            setShowEdit={setShowEdit}
          />
        </div>

        <div className="mt-6">
          <div className="bg-white dark:bg-primary-dark rounded-xl shadow p-1 flex max-w-md mx-auto">
            {["posts", "media", "likes", "shares"].map((tab) => (
              <button
                onClick={() => setActiveTab(tab)}
                key={tab}
                className={`flex-1 px-4 py-2 text-sm font-medium dark:text-white rounded-lg transition-colors cursor-pointer ${
                  activeTab === tab
                    ? "bg-indigo-600 text-white "
                    : "text-gray-600 hover:text-gray-900 dark:hover:text-gray-400"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === "posts" && (
            <div className="mt-6 flex flex-col items-center gap-6">
              {posts
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onPostUpdated={handlePostUpdated}
                    onPostDeleted={handlePostDeleted}
                  />
                ))}
            </div>
          )}

          {activeTab === "shares" && (
            <div className="mt-6 flex flex-col items-center gap-6">
              {shares
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map((share) => (
                  <SharePostCard
                    key={share._id}
                    post={share}
                    onPostUpdated={handlePostUpdated}
                    onPostDeleted={handlePostDeleted}
                  />
                ))}
            </div>
          )}

          {activeTab === "media" && (
            <div className="flex flex-wrap mt-6 max-w-6xl">
              {posts
                .filter((post) => post.image_urls.length > 0)
                .map((post) => (
                  <>
                    {post.image_urls.map((image, index) => (
                      <Link
                        target="_blank"
                        to={image}
                        key={index}
                        className="relative group"
                      >
                        <img
                          src={image}
                          key={index}
                          className="w-64 aspect-video object-cover"
                          alt=""
                        />
                        <p className="absolute bottom-0 right-0 text-xs p-1 px-3 backdrop-blur-xl text-white opacity-0 group-hover:opacity-100 transition duration-300">
                          Posted {moment(post.createdAt).fromNow()}
                        </p>
                      </Link>
                    ))}
                  </>
                ))}
            </div>
          )}
        </div>
      </div>
      {showEdit && <ProfileModal setShowEdit={setShowEdit} />}
    </div>
  ) : ( 
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <SkeletonUserProfile />
      <div className="mt-6 flex flex-col items-center gap-6">
        {[1, 2, 3].map((i) => (
          <SkeletonPostCard key={i} />
        ))}
      </div>
    </div>
  );
};

export default Profile;
