import { X, Edit, BadgeCheck } from "lucide-react";
import React, { useState, useEffect } from "react";
import moment from "moment";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import useOutsideClickOrScroll from "../hooks/useOutsideClickOrScroll";

const EditModal = ({ isOpen, onClose, post, onPostUpdated }) => {
  const [content, setContent] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const { getToken } = useAuth();
  const modalRef = useOutsideClickOrScroll(onClose);

  // Initialize content when modal opens
  useEffect(() => {
    if (isOpen && post.content) {
      setContent(post.content);
    }
  }, [isOpen, post.content]);

  const handleUpdate = async () => {
    if (!content.trim()) {
      toast.error("Content cannot be empty");
      return;
    }

    try {
      setIsUpdating(true);
      const token = await getToken();
      const { data } = await api.post(
        "/api/post/update",
        { 
          postId: post._id, 
          content: content.trim() 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success("Post updated successfully");
        onClose();
        // Callback để parent component cập nhật UI
        if (onPostUpdated) {
          onPostUpdated(post._id, content.trim());
        }
      } else {
        toast.error(data.message || "Failed to update post");
      }
    } catch (error) {
      toast.error("Failed to update post");
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleUpdate();
    }
  };

  if (!isOpen) return null;

  const postWithHashtags = content.replace(
    /(#\w+)/g,
    '<span class="text-indigo-600 font-medium">$1</span>'
  );

  return (
    <div className="fixed inset-0 z-[110] min-h-screen bg-black/30 backdrop-blur flex items-center justify-center p-4">
      <div ref={modalRef} className="bg-white rounded-2xl dark:bg-gray-900 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-400 flex items-center gap-2">
            <Edit className="w-5 h-5 text-indigo-600 dark:text-gray-400" />
            Edit Post
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            disabled={isUpdating}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* User Info */}
          <div className="flex items-center gap-3 mb-4">
            <img
              src={post.user.profile_picture}
              alt=""
              className="w-12 h-12 rounded-full shadow"
            />
            <div>
              <div className="flex items-center gap-1">
                <span className="font-semibold">{post.user.full_name}</span>
                <BadgeCheck className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-sm text-gray-500">
                @{post.user.username} • {moment(post.createdAt).fromNow()}
              </p>
            </div>
          </div>

          {/* Content Editor */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
              Post Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What's on your mind?"
              className="w-full min-h-[120px] p-3 border border-gray-300 dark:border-gray-700 rounded-lg resize-none outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
              disabled={isUpdating}
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500">
                Press Cmd/Ctrl + Enter to save
              </p>
              <span className={`text-xs ${content.length > 500 ? 'text-red-500' : 'text-gray-500'}`}>
                {content.length}/500
              </span>
            </div>
          </div>

          {/* Preview */}
          {/* {content.trim() && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview
              </label>
              <div className="bg-gray-50 rounded-lg p-3 border">
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={post.user.profile_picture}
                    alt=""
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-sm">{post.user.full_name}</span>
                      <BadgeCheck className="w-3 h-3 text-blue-500" />
                    </div>
                    <p className="text-xs text-gray-500">
                      @{post.user.username} • now
                    </p>
                  </div>
                </div>
                <div
                  className="text-gray-800 text-sm whitespace-pre-line"
                  dangerouslySetInnerHTML={{ __html: postWithHashtags }}
                />
              </div>
            </div>
          )} */}

          {/* Images (if any) */}
          {post.image_urls?.length > 0 && (
            <div className="mb-4">
              {/* <label className="block text-sm font-medium text-gray-700 mb-2">
                Images (cannot be edited)
              </label> */}
              <div className="grid grid-cols-2 gap-2">
            {post.image_urls.map((media, index) => {
              // Kiểm tra định dạng file để render đúng loại
              const isVideo = /\.(mp4|webm|ogg)$/i.test(media);
              return isVideo ? (
                <video
                  key={index}
                  src={media}
                  controls
                  className={`w-full h-48 object-cover rounded-lg ${
                    post.image_urls.length === 1 && "col-span-2 h-auto"
                  }`}
                />
              ) : (
                <img
                  src={media}
                  key={index}
                  className={`w-full h-48 object-cover rounded-lg ${
                    post.image_urls.length === 1 && "col-span-2 h-auto"
                  }`}
                  alt=""
                />
              );
            })}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Images cannot be changed when editing a post
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={isUpdating}
            className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={isUpdating || !content.trim() || content.length > 500}
            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isUpdating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Updating...
              </>
            ) : (
              <>
                <Edit className="w-4 h-4" />
                Update Post
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;