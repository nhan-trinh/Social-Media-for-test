import React, { useEffect, useState } from "react";
import { assets } from "../assets/assets";
import StoriesBar from "../components/StoriesBar";
import PostCard from "../components/PostCard";
import SharePostCard from "../components/SharePostCard";
import RecentMessage from "../components/RecentMessage";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import SkeletonStoriesBar from "../components/SkeletonStoriesBar";
import SkeletonPostCard from "../components/SkeletonPostCard";

const Feed = () => {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  const { getToken } = useAuth();

  const fetchFeeds = async () => {
    try {
      setLoading(true);
      
      // Fetch cả posts và shares
      const [postsResponse, sharesResponse] = await Promise.all([
        api.get("/api/post/feed", {
          headers: { Authorization: `Bearer ${await getToken()}` },
        }),
        api.get("/api/share/feed", {
          headers: { Authorization: `Bearer ${await getToken()}` },
        })
      ]);

      if (postsResponse.data.success && sharesResponse.data.success) {
        // Combine và sort theo thời gian
        const combinedFeed = [
          ...postsResponse.data.posts.map(post => ({ ...post, type: 'post' })),
          ...sharesResponse.data.shares.map(share => ({ ...share, type: 'share' }))
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setFeed(combinedFeed);
      } else {
        toast.error("Failed to load feed");
      }
    } catch (error) {
      toast.error(error.message);
    }
    setLoading(false);
  };

  // Handler để cập nhật post sau khi edit
  const handlePostUpdated = (postId, newContent) => {
    setFeed((prevFeed) =>
      prevFeed.map((item) =>
        item._id === postId ? { ...item, content: newContent } : item
      )
    );
  };

  // Handler để xóa post khỏi feed khi delete
  const handlePostDeleted = (postId) => {
    setFeed((prevFeed) => prevFeed.filter((item) => item._id !== postId));
  };

  // Handler để hide/unhide post
  const handlePostVisibilityChanged = (postId, isHidden) => {
    console.log(
      `Post ${postId} visibility changed to: ${isHidden ? "hidden" : "visible"}`
    );
  };

  // Handler khi có share mới
  const handlePostShared = (originalPostId) => {
    setFeed((prevFeed) =>
      prevFeed.map((item) =>
        item._id === originalPostId && item.type === 'post'
          ? { ...item, share_count: (item.share_count || 0) + 1 }
          : item
      )
    );
    // Refresh feed để hiển thị share mới
    fetchFeeds();
  };

  useEffect(() => {
    fetchFeeds();
  }, []);

  const renderFeedItem = (item) => {
    if (item.type === 'share') {
      return (
        <SharePostCard
          key={item._id}
          post={item}
          onPostUpdated={handlePostUpdated}
          onPostDeleted={handlePostDeleted}
        />
      );
    } else {
      return (
        <PostCard
          key={item._id}
          post={item}
          onPostUpdated={handlePostUpdated}
          onPostDeleted={handlePostDeleted}
          onPostVisibilityChanged={handlePostVisibilityChanged}
          onPostShared={handlePostShared}
        />
      );
    }
  };

  return (
    <div className="h-full dark:bg-gray-900 overflow-y-scroll no-scrollbar py-10 xl:pr-5 flex items-start justify-center xl:gap-8">
      <div>
        {/* Nếu loading => show skeleton, ngược lại show StoriesBar */}
        {loading ? <SkeletonStoriesBar /> : <StoriesBar />}

        <div className="p-4 space-y-6">
          {loading
            ? [...Array(3)].map((_, i) => <SkeletonPostCard key={i} />) // render 3 skeleton posts
            : feed.map(renderFeedItem)}
        </div>
      </div>

      <div className="max-xl:hidden sticky top-0">
        <div className="max-w-xs bg-white dark:bg-primary-dark   text-xs p-4 rounded-md inline-flex flex-col gap-2 shadow">
          <h3 className="text-slate-800 dark:text-gray-400 font-semibold">Sponsored</h3>
          <img
            src={assets.sponsored_img}
            className="w-75 h-50 rounded-md"
            loading="lazy"
            decoding="async"
            width={300}
            height={200}
            alt=""
          />
          <p className="text-slate-600">Email marketing</p>
          <p className="text-slate-400 dark:text-gray-400">
            SuperCharge your marketing with a powerful, easy-to-use platform
            built for results.
          </p>
        </div>
        <RecentMessage />
      </div>
    </div>
  );
};

export default Feed;