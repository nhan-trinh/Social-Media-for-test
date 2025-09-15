// Fixed SharePostCard.jsx
import {
  BadgeCheck,
  Ellipsis,
  Heart,
  MessageCircle,
  Share2,
  Edit,
  Trash2,
  EyeOff,
  Undo2,
  AlertTriangle,
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import CommentModal from "./CommentModal";
import SharePostModal from "./SharePostModal";
import DeleteShareModal from "./DeleteShareModal";
import CommentShareModel from "./CommentShareModal";
import EditShareModal from "./EditShareModal";

const SharePostCard = ({
  post, // đây là document Share
  onPostUpdated,
  onPostDeleted,
  onPostVisibilityChanged
}) => {
  const [likes, setLikes] = useState(post.likes_count || []);
  const [shareCount, setShareCount] = useState(post.share_count || 0);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isOriginalPostCommentOpen, setIsOriginalPostCommentOpen] =
    useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSharingModalOpen, setIsSharingModalOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const dropdownRef = useRef(null);
  const isModalOpenRef = useRef(null);

  const currentUser = useSelector((state) => state.user.value);
  const { getToken } = useAuth();
  const navigate = useNavigate();

  // Kiểm tra nếu shared_post bị xóa
  const isOriginalPostDeleted =
    post.shared_post?.deleted === true || !post.shared_post;

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutsideComment = (e) => {
      if (
        isModalOpenRef.current &&
        !isModalOpenRef.current.contains(e.target)
      ) {
        setIsCommentModalOpen(false);
      }
    };

    if (isCommentModalOpen) {
      document.addEventListener("mousedown", handleClickOutsideComment);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutsideComment);
    };
  }, [isCommentModalOpen]);

  const getInitialCommentCount = () => {
    try {
      const savedCount = sessionStorage.getItem(`commentCount_${post._id}`);
      if (savedCount !== null) {
        const parsedCount = parseInt(savedCount);
        console.log(
          `Restored comment count from storage: ${parsedCount} for post ${post._id}`
        );
        return parsedCount;
      }
    } catch (error) {
      console.error("Error reading from sessionStorage:", error);
    }
    return post.comments_count || 0;
  };

  const [commentsCount, setCommentsCount] = useState(getInitialCommentCount);

  useEffect(() => {
    if (post.comments_count !== undefined && post.comments_count !== null) {
      const savedCount = sessionStorage.getItem(`commentCount_${post._id}`);
      if (savedCount === null) {
        setCommentsCount(post.comments_count);
      }
    }
  }, [post.comments_count, post._id]);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        `commentCount_${post._id}`,
        commentsCount.toString()
      );
    } catch (error) {
      console.error("Error saving to sessionStorage:", error);
    }
  }, [commentsCount, post._id]);

  const handleLike = async () => {
    try {
      const { data } = await api.post(
        `/api/share/like`,
        { shareId: post._id },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        setLikes((prev) =>
          prev.includes(currentUser._id)
            ? prev.filter((id) => id !== currentUser._id)
            : [...prev, currentUser._id]
        );
        toast.success(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const handleCommentUpdate = (change = 1) => {
    setCommentsCount((prev) => {
      const newCount = prev + change;
      console.log(`Comment count update: ${prev} + ${change} = ${newCount}`);
      return Math.max(0, newCount);
    });
  };

  const handleCommentsCountSync = (newCount) => {
    console.log(`Syncing comment count to: ${newCount} for post ${post._id}`);
    setCommentsCount(Math.max(0, newCount));

    try {
      sessionStorage.setItem(
        `commentCount_${post._id}`,
        Math.max(0, newCount).toString()
      );
    } catch (error) {
      console.error("Error saving to sessionStorage:", error);
    }
  };


    const handleHidePost = () => {
    setIsHidden(true);
    setIsDropdownOpen(false);
    toast.success("Post hidden");
    
    // Notify parent component
    if (onPostVisibilityChanged) {
      onPostVisibilityChanged(post._id, true);
    }
  };

  const handleUnhidePost = () => {
    setIsHidden(false);
    toast.success("Post restored");
    
    // Notify parent component
    if (onPostVisibilityChanged) {
      onPostVisibilityChanged(post._id, false);
    }
  };


  const handleDeletePost = () => {
    setIsDeleteModalOpen(true);
    setIsDropdownOpen(false);
  };

  const handleEditPost = () => {
    setIsEditModalOpen(true);
    setIsDropdownOpen(false);
  };

  // const handleHidePost = () => {
  //   setIsHidden(true);
  //   setIsDropdownOpen(false);
  // };

  // const handlePostUpdateSuccess = (postId, newContent) => {
  //   if (onPostUpdated) {
  //     onPostUpdated(postId, newContent);
  //   }
  // };

  const handlePostDeleteSuccess = (shareId) => {
    if (onPostDeleted) {
      onPostDeleted(shareId);
    }
  };

  const handleShareSuccess = () => {
    setShareCount((prev) => prev + 1);
    setIsSharingModalOpen(false);
  };

  const isOwner = currentUser._id === post.user._id;

  // Nếu bị ẩn
  if (isHidden) {
    return (
      <div className="bg-gray-100 rounded-xl dark:bg-gray-900 shadow p-4 space-y-4 w-full max-w-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <EyeOff className="w-5 h-5 text-gray-500 dark:text-gray-300" />
            <span className="text-gray-600 text-sm">Post hidden</span>
          </div>
          <button
            onClick={handleUnhidePost}
            className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition"
          >
            <Undo2 className="w-4 h-4" />
            Undo
          </button>
        </div>
        <div className="text-gray-500 dark:text-gray-400 text-sm">
          Post by @{post.user.username} • {moment(post.createdAt).fromNow()}
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white dark:bg-primary-dark rounded-xl shadow p-4 space-y-4 w-full max-w-2xl text-slate-900 dark:text-slate-100">
      <div className="flex items-start justify-between">
        <div
          onClick={() => navigate(`/profile/` + post.user._id)}
          className="flex items-center gap-3 cursor-pointer"
        >
          <img
            src={post.user.profile_picture}
            alt=""
            className="w-10 h-10 rounded-full shadow"
            loading="lazy"
            decoding="async"
            width={40}
            height={40}
          />
          <div>
            <div className="flex items-center dark:text-slate-200 space-x-1">
              <span>{post.user.full_name}</span>
              <BadgeCheck className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-sm">
              @{post.user.username} has shared{" "}
              {moment(post.createdAt).fromNow()}
            </div>
          </div>
        </div>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
          >
            <Ellipsis className="w-5 h-5 text-gray-500 dark:text-gray-300" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[150px] z-50">
              {isOwner ? (
                <>
                  <button
                    onClick={handleEditPost}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Post
                  </button>
                  <button
                    onClick={handleDeletePost}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-red-600 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Post
                  </button>
                </>
              ) : (
                <button
                  onClick={handleHidePost}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                >
                  <EyeOff className="w-4 h-4" />
                  Hide Post
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Nội dung chia sẻ */}
      {post.content && (
        <div className="px-4 pb-2">
          <p
            className="text-gray-800 dark:text-slate-200 leading-relaxed whitespace-pre-line"
            dangerouslySetInnerHTML={{
              __html: post.content.replace(
                /(#\w+)/g,
                '<span class="text-indigo-600 font-medium">$1</span>'
              ),
            }}
          />
        </div>
      )}

      {/* Block bài viết gốc */}
      {isOriginalPostDeleted ? (
        // Hiển thị khi bài gốc bị xóa
        <div className="mx-4 mb-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
          <div className="p-4 text-center">
            <AlertTriangle className="w-8 h-8 dark:text-gray-400 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {post.shared_post?.message || "Content isn't available right now"}
            </p>
          </div>
        </div>
      ) : (
        // Hiển thị bài gốc bình thường
        <div
          onClick={() => setIsOriginalPostCommentOpen(true)}
          className="mx-4 mb-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800 cursor-pointer"
        >
          <div className="p-3">
            {/* Header người đăng bài gốc */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/profile/` + post.shared_post.user._id);
              }}
              className="flex items-center gap-3 cursor-pointer"
            >
              <img
                src={post.shared_post.user.profile_picture}
                alt=""
                className="w-8 h-8 rounded-full shadow"
              />
              <div>
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-medium">
                    {post.shared_post.user.full_name}
                  </span>
                  <BadgeCheck className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-gray-500 text-xs">
                  @{post.shared_post.user.username} ·{" "}
                  {moment(post.shared_post.createdAt).fromNow()}
                </div>
              </div>
            </div>

            {/* Nội dung bài gốc */}
            {post.shared_post.content && (
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 mt-3 whitespace-pre-line">
                {post.shared_post.content}
              </p>
            )}

            {/* Media bài gốc */}
            {post.shared_post.image_urls?.length > 0 && (
              <div
                className={`grid gap-2 mt-2 ${
                  post.shared_post.image_urls.length === 1
                    ? "grid-cols-1"
                    : "grid-cols-2"
                }`}
              >
                {post.shared_post.image_urls.slice(0, 4).map((media, index) => {
                  const isVideo = /\.(mp4|webm|ogg)$/i.test(media);
                  return isVideo ? (
                    <video
                      key={index}
                      src={media}
                      controls
                      className={`w-full object-cover rounded-lg ${
                        post.shared_post.image_urls.length === 1
                          ? "h-auto max-h-64"
                          : "h-48"
                      }`}
                    />
                  ) : (
                    <img
                      src={media}
                      key={index}
                      className={`w-full object-cover rounded-lg ${
                        post.shared_post.image_urls.length === 1
                          ? "h-auto max-h"
                          : "h-24"
                      }`}
                      alt=""
                    />
                  );
                })}
                {post.shared_post.image_urls.length > 4 && (
                  <div className="relative">
                    <img
                      src={post.shared_post.image_urls[3]}
                      className="w-full h-24 object-cover rounded-lg"
                      alt=""
                    />
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-semibold">
                        +{post.shared_post.image_urls.length - 3}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 text-gray-600 dark:text-gray-300 text-sm pt-2 border-t border-gray-300 dark:border-gray-700">
        <div className="flex items-center gap-1">
          <Heart
            className={`w-4 h-4 cursor-pointer ${
              likes.includes(currentUser._id) && "text-red-500 fill-red-500"
            }`}
            onClick={handleLike}
          />
          <span>{likes.length}</span>
        </div>
        <div
          className="flex items-center gap-1 cursor-pointer hover:text-indigo-600"
          onClick={() => setIsCommentModalOpen(true)}
        >
          <MessageCircle className="w-4 h-4" />
          <span>{commentsCount}</span>
        </div>
        <div
          className={`flex items-center gap-1 cursor-pointer hover:text-indigo-600 ${
            isOriginalPostDeleted ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={() => !isOriginalPostDeleted && setIsSharingModalOpen(true)}
        >
          <Share2 className="w-4 h-4" />
          <span>{shareCount}</span>
        </div>
      </div>

      {/* Modals */}
      <CommentShareModel
        post={post}
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        currentUser={currentUser}
        onCommentAdded={handleCommentUpdate}
        initialCommentsCount={commentsCount}
        onCommentsCountSync={handleCommentsCountSync}
        ref={isModalOpenRef}
      />

      {/* Chỉ mở comment modal cho bài gốc nếu bài gốc chưa bị xóa */}
      {!isOriginalPostDeleted && post.shared_post && (
        <CommentModal
          post={post.shared_post}
          isOpen={isOriginalPostCommentOpen}
          onClose={() => setIsOriginalPostCommentOpen(false)}
          currentUser={currentUser}
        />
      )}

      <DeleteShareModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        post={post}
        onPostDeleted={handlePostDeleteSuccess}
        isSharePost={true}
      />

      <EditShareModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        post={post}
        onPostUpdated={onPostUpdated}
        isSharePost={true}
      />

      {/* Chỉ cho phép share nếu bài gốc chưa bị xóa */}
      {!isOriginalPostDeleted && (
        <SharePostModal
          isOpen={isSharingModalOpen}
          onClose={() => setIsSharingModalOpen(false)}
          post={post.shared_post || post}
          onShareSuccess={handleShareSuccess}
        />
      )}
    </div>
  );
};

export default SharePostCard;
