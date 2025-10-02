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
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import CommentModal from "./CommentModal";
import DeleteModal from "../components/DeleteModal";
import EditModal from "../components/EditModalComment";
import SharePostModal from "./SharePostModal";
import { useTranslation } from "react-i18next";
import likeSound from "../sounds/like.mp3";
import commentSound from "../sounds/comment.mp3";

const PostCard = ({
  post,
  onPostUpdated,
  onPostDeleted,
  onPostVisibilityChanged,
  onPostShared,
}) => {
  const [currentContent, setCurrentContent] = useState(post.content);
  const postWithHashtags = currentContent.replace(
    /(#\w+)/g,
    '<span class="text-indigo-600">$1</span>'
  );
  const [likes, setLikes] = useState(post.likes_count);
  const [shareCount, setShareCount] = useState(post.share_count || 0);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSharingModalOpen, setIsSharingModalOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const dropdownRef = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    setCurrentContent(post.content);
  }, [post.content]);

  useEffect(() => {
    setShareCount(post.share_count || 0);
  }, [post.share_count]);

  const getInitialCommentCount = () => {
    try {
      const savedCount = sessionStorage.getItem(`commentCount_${post._id}`);
      if (savedCount !== null) {
        return parseInt(savedCount);
      }
    } catch (error) {
      console.error("Error reading from sessionStorage:", error);
    }
    return post.comments_count || 0;
  };

  const [commentsCount, setCommentsCount] = useState(getInitialCommentCount);
  const currentUser = useSelector((state) => state.user.value);
  const { getToken } = useAuth();
  const navigate = useNavigate();

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

  const likeAudio = useRef(new Audio(likeSound));
  const commentAudio = useRef(new Audio(commentSound));

  const handleLike = async () => {
    try {
      const { data } = await api.post(
        `/api/post/like`,
        { postId: post._id },
        {
          headers: {
            Authorization: `Bearer ${await getToken()}`,
          },
        }
      );

      if (data.success) {
        toast.success(data.message);
        likeAudio.current.play().catch(() => {});
        setLikes((prev) => {
          if (prev.includes(currentUser._id)) {
            return prev.filter((id) => id !== currentUser._id);
          } else {
            return [...prev, currentUser._id];
          }
        });
      } else {
        toast(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleCommentUpdate = (change = 1) => {
    setCommentsCount((prev) => Math.max(0, prev + change));
  };

  const handleCommentsCountSync = (newCount) => {
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
    if (onPostVisibilityChanged) {
      onPostVisibilityChanged(post._id, true);
    }
  };

  const handleUnhidePost = () => {
    setIsHidden(false);
    toast.success("Post restored");
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

  const handlePostUpdateSuccess = (postId, newContent) => {
    setCurrentContent(newContent);
    if (onPostUpdated) {
      onPostUpdated(postId, newContent);
    }
  };

  const handlePostDeleteSuccess = (postId) => {
    if (onPostDeleted) {
      onPostDeleted(postId);
    }
  };

  const handleShareSuccess = () => {
    setShareCount((prev) => prev + 1);
    setIsSharingModalOpen(false);
    if (onPostShared) {
      onPostShared(post._id);
    }
  };

  const isOwner = currentUser._id === post.user._id;

  // Render media item helper
  const renderMediaItem = (media, index, className) => {
    const isVideo = /\.(mp4|webm|ogg)$/i.test(media);
    
    return isVideo ? (
      <video
        key={index}
        src={media}
        controls
        preload="metadata"
        className={className}
      />
    ) : (
      <img
        src={media}
        key={index}
        className={className}
        alt=""
        loading="lazy"
        decoding="async"
      />
    );
  };

  // Smart grid layout based on media count
  const renderMediaGrid = () => {
    const mediaCount = post.image_urls.length;
    
    if (mediaCount === 0) return null;

    // Single media - full width
    if (mediaCount === 1) {
      return (
        <div className="w-full">
          {renderMediaItem(
            post.image_urls[0],
            0,
            "w-full h-auto max-h object-cover rounded-lg"
          )}
        </div>
      );
    }

    // Two media - side by side
    if (mediaCount === 2) {
      return (
        <div className="grid grid-cols-2 gap-2">
          {post.image_urls.map((media, index) =>
            renderMediaItem(media, index, "w-full h-90 object-cover rounded-lg")
          )}
        </div>
      );
    }

    // Three media - first large on left, two stacked on right
    if (mediaCount === 3) {
      return (
        <div className="grid grid-cols-2 gap-2">
          <div className="row-span-2">
            {renderMediaItem(
              post.image_urls[0],
              0,
              "w-full h-full object-cover rounded-lg"
            )}
          </div>
          <div className="space-y-2">
            {renderMediaItem(
              post.image_urls[1],
              1,
              "w-full h-[calc(50%-4px)] object-cover rounded-lg"
            )}
            {renderMediaItem(
              post.image_urls[2],
              2,
              "w-full h-[calc(50%-4px)] object-cover rounded-lg"
            )}
          </div>
        </div>
      );
    }

    // Four media - 2x2 grid
    if (mediaCount === 4) {
      return (
        <div className="grid grid-cols-2 gap-2">
          {post.image_urls.map((media, index) =>
            renderMediaItem(media, index, "w-full h-48 object-cover rounded-lg")
          )}
        </div>
      );
    }

    // Five or more media - 2x2 grid with "+X more" overlay on last image
    if (mediaCount >= 5) {
      return (
        <div className="grid grid-cols-2 gap-2">
          {post.image_urls.slice(0, 3).map((media, index) =>
            renderMediaItem(media, index, "w-full h-48 object-cover rounded-lg")
          )}
          <div className="relative">
            {renderMediaItem(
              post.image_urls[3],
              3,
              "w-full h-48 object-cover rounded-lg"
            )}
            {mediaCount > 4 && (
              <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center rounded-lg cursor-pointer hover:bg-opacity-75 transition">
                <span className="text-white text-2xl font-bold">
                  +{mediaCount - 4}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  if (isHidden) {
    return (
      <div className="bg-gray-100 rounded-xl dark:bg-primary-dark shadow p-4 space-y-4 w-full max-w-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <EyeOff className="w-5 h-5 text-gray-500 dark:text-gray-300" />
            <span className="text-gray-600 dark:text-gray-300 text-sm">
              {t("Post hidden")}
            </span>
          </div>
          <button
            onClick={handleUnhidePost}
            className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition"
          >
            <Undo2 className="w-4 h-4" />
            {t("Undo")}
          </button>
        </div>
        <div className="text-gray-500 dark:text-gray-400 text-sm">
          {t("Post by")} @{post.user.username} •{" "}
          {moment(post.createdAt).fromNow()}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-primary-dark rounded-xl shadow p-4 space-y-4 w-full max-w-2xl text-slate-900 dark:text-slate-100">
        <div className="flex items-start justify-between">
          <div
            onClick={() => navigate(`/profile/` + post.user._id)}
            className="flex items-center gap-3 cursor-pointer"
          >
            <img
              src={post.user.profile_picture}
              alt=""
              className="w-10 h-10 rounded-full ring ring-gray-100 dark:ring-gray-800 shadow"
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
                @{post.user.username} {t("has posted")}{" "}
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
                      {t("Edit Post")}
                    </button>
                    <button
                      onClick={handleDeletePost}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-red-600 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      {t("Delete Post")}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleHidePost}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                  >
                    <EyeOff className="w-4 h-4" />
                    {t("Hide Post")}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {currentContent && (
          <div
            className="text-gray-800 dark:text-slate-200 text-sm whitespace-pre-line"
            dangerouslySetInnerHTML={{ __html: postWithHashtags }}
          />
        )}

        {post.image_urls.length > 0 && (
          <div
            onClick={() => setIsCommentModalOpen(true)}
            className="cursor-pointer"
          >
            {renderMediaGrid()}
          </div>
        )}

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
            onClick={() => {
              commentAudio.current.play().catch(() => {});
              setIsCommentModalOpen(true);
            }}
          >
            <MessageCircle className="w-4 h-4" />
            <span>{commentsCount}</span>
          </div>
          <div
            className="flex items-center gap-1 cursor-pointer hover:text-indigo-600"
            onClick={() => setIsSharingModalOpen(true)}
          >
            <Share2 className="w-4 h-4" />
            <span>{shareCount}</span>
          </div>
        </div>
      </div>

      <CommentModal
        post={post}
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        currentUser={currentUser}
        onCommentAdded={handleCommentUpdate}
        initialCommentsCount={commentsCount}
        onCommentsCountSync={handleCommentsCountSync}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        post={post}
        onPostDeleted={handlePostDeleteSuccess}
      />

      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        post={post}
        onPostUpdated={handlePostUpdateSuccess}
      />

      <SharePostModal
        isOpen={isSharingModalOpen}
        onClose={() => setIsSharingModalOpen(false)}
        post={post}
        onShareSuccess={handleShareSuccess}
      />
    </>
  );
};

export default PostCard;