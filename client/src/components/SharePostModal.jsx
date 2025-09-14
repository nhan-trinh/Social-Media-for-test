// SharePostModal.jsx
import { X, BadgeCheck, Share, Share2 } from "lucide-react";
import React, { useState } from "react";
import moment from "moment";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import useOutsideClickOrScroll from "../hooks/useOutsideClickOrScroll.js";

const SharePostModal = ({ isOpen, onClose, post }) => {
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const { getToken } = useAuth();
  const modalRef = useOutsideClickOrScroll(onClose);

  const handleShare = async () => {
    try {
      setIsSharing(true);
      const { data } = await api.post(
        "/api/share/add",
        { content, original_post_id: post._id },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        navigate("/");
        toast.success("Post shared!");
        onClose();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
    setIsSharing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] min-h-screen bg-black/30 backdrop-blur flex items-center justify-center p-4">
      <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl dark:bg-gray-900 max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Share className="w-5 h-5 text-indigo-600" />
            Share
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            disabled={isSharing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Body */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share Content
            </label>
            <textarea
              className="w-full resize-none max-h-20 mt-4 text-sm outline-none placeholder-gray-400"
              placeholder="What's on your mind?"
              onChange={(e) => setContent(e.target.value)}
              value={content}
            />

            {/* Preview post gốc */}
            <div className="rounded-xl p-4 bg-white shadow-md hover:shadow-lg transition">
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={post.user.profile_picture}
                  alt=""
                  className="w-10 h-10 rounded-full border border-gray-200 shadow-sm"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {post.user.full_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {moment(post.createdAt).fromNow()}
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-3">{post.content}</p>

              {post.image_urls?.length > 0 && (
                <div>
                  <div className="grid grid-cols-2 gap-2">
                    {post.image_urls.map((media, index) => {
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
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isSharing}
            className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={isSharing || !content.trim() || content.length > 500}
            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSharing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Updating...
              </>
            ) : (
              <>
                <Share className="w-4 h-4" />
                Share Post
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SharePostModal;
