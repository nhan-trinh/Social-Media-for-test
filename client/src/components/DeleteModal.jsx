import { X, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import useOutsideClickOrScroll from "../hooks/useOutsideClickOrScroll";

const DeleteModal = ({ isOpen, onClose, post, onPostDeleted }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { getToken } = useAuth();
  const modalRef = useOutsideClickOrScroll(onClose);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const token = await getToken();
      const { data } = await api.post(
        "/api/post/delete",
        { postId: post._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success("Post deleted successfully");
        onClose();
        // Callback để parent component xử lý việc remove post khỏi UI
        if (onPostDeleted) {
          onPostDeleted(post._id);
        }
      } else {
        toast.error(data.message || "Failed to delete post");
      }
    } catch (error) {
      toast.error("Failed to delete post");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] min-h-screen bg-black/30 backdrop-blur text-white flex items-center justify-center p-4">
      <div ref={modalRef} className="bg-white rounded-2xl dark:bg-gray-900 shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-400 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            Delete Post
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            disabled={isDeleting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Are you sure you want to delete this post? This action cannot be undone.
          </p>
          
          {/* Post Preview */}
          {/* <div className="bg-gray-50 rounded-lg p-3 border">
            <div className="flex items-center gap-2 mb-2">
              <img
                src={post.user.profile_picture}
                alt=""
                className="w-6 h-6 rounded-full"
              />
              <span className="text-sm font-medium">{post.user.full_name}</span>
              <span className="text-xs text-gray-500">@{post.user.username}</span>
            </div>
            {post.content && (
              <p className="text-sm text-gray-700 line-clamp-3">
                {post.content}
              </p>
            )}
            {post.image_urls?.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {post.image_urls.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt=""
                    className={`rounded-xl object-cover w-full h-44 hover:scale-[1.02] transition ${
                      post.image_urls.length === 1 && "col-span-2 h-64"
                    }`}
                  />
                ))}
              </div>
            )}
          </div> */}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;