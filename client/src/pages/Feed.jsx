import React, { useEffect, useState, useCallback, useRef } from "react";
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const { getToken } = useAuth();
  const observerRef = useRef();
  const lastPostElementRef = useRef();

  const POSTS_PER_PAGE = 5; // Số bài mỗi lần load

  const fetchFeeds = async (pageNumber = 1, isLoadMore = false) => {
    try {
      if (!isLoadMore) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // Fetch cả posts và shares với pagination
      const [postsResponse, sharesResponse] = await Promise.all([
        api.get(`/api/post/feed?page=${pageNumber}&limit=${POSTS_PER_PAGE}`, {
          headers: { Authorization: `Bearer ${await getToken()}` },
        }),
        api.get(`/api/share/feed?page=${pageNumber}&limit=${POSTS_PER_PAGE}`, {
          headers: { Authorization: `Bearer ${await getToken()}` },
        }),
      ]);

      if (postsResponse.data.success && sharesResponse.data.success) {
        // Combine và sort theo thời gian
        const combinedFeed = [
          ...postsResponse.data.posts.map((post) => ({
            ...post,
            type: "post",
          })),
          ...sharesResponse.data.shares.map((share) => ({
            ...share,
            type: "share",
          })),
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (isLoadMore) {
          // Append new posts to existing feed
          setFeed((prevFeed) => [...prevFeed, ...combinedFeed]);
        } else {
          // Replace feed with new posts
          setFeed(combinedFeed);
        }

        // Update pagination info
        const totalPosts = postsResponse.data.totalPosts || 0;
        const totalShares = sharesResponse.data.totalShares || 0;
        const totalItems = totalPosts + totalShares;
        const calculatedTotalPages = Math.ceil(totalItems / POSTS_PER_PAGE);

        setTotalPages(calculatedTotalPages);
        setHasMore(pageNumber < calculatedTotalPages);
      } else {
        toast.error("Failed to load feed");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      if (!isLoadMore) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  // Load more posts when reaching the bottom
  const loadMorePosts = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFeeds(nextPage, true);
    }
  }, [page, loadingMore, hasMore]);

  // Intersection Observer callback
  const lastPostElementObserver = useCallback(
    (node) => {
      if (loading || loadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            loadMorePosts();
          }
        },
        {
          threshold: 0.1,
          rootMargin: "100px", // Load more posts 100px before reaching the bottom
        }
      );

      if (node) observerRef.current.observe(node);
    },
    [loading, loadingMore, hasMore, loadMorePosts]
  );

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
        item._id === originalPostId && item.type === "post"
          ? { ...item, share_count: (item.share_count || 0) + 1 }
          : item
      )
    );
    // Reset và fetch lại feed từ đầu để hiển thị share mới
    setPage(1);
    setFeed([]);
    fetchFeeds(1, false);
  };

  useEffect(() => {
    fetchFeeds(1, false);
  }, []);

  const renderFeedItem = (item, index) => {
    const isLastPost = index === feed.length - 1;
    const ref = isLastPost ? lastPostElementObserver : null;

    if (item.type === "share") {
      return (
        <div key={item._id} ref={ref}>
          <SharePostCard
            post={item}
            onPostUpdated={handlePostUpdated}
            onPostDeleted={handlePostDeleted}
          />
        </div>
      );
    } else {
      return (
        <div key={item._id} ref={ref}>
          <PostCard
            post={item}
            onPostUpdated={handlePostUpdated}
            onPostDeleted={handlePostDeleted}
            onPostVisibilityChanged={handlePostVisibilityChanged}
            onPostShared={handlePostShared}
          />
        </div>
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

          {/* Loading more skeleton */}
          {loadingMore && (
            <div className="space-y-6">
              {[...Array(2)].map((_, i) => (
                <SkeletonPostCard key={`loading-${i}`} />
              ))}
            </div>
          )}

          {/* No more posts message */}
          {!loading && !loadingMore && !hasMore && feed.length > 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                You've reached the end of your feed
              </p>
            </div>
          )}

          {/* Empty feed message */}
          {!loading && feed.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No posts available yet
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="max-xl:hidden sticky top-0">
        <div className="max-w-xs bg-white dark:bg-primary-dark text-xs p-4 rounded-md inline-flex flex-col gap-2 shadow">
          <h3 className="text-slate-800 dark:text-gray-400 font-semibold">
            Sponsored
          </h3>
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
