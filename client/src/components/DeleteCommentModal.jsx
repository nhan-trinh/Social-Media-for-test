import { X, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import useOutsideClickOrScroll from "../hooks/useOutsideClickOrScroll";
import { useTranslation } from "react-i18next";
// import successSound from "../sounds/success.mp3";

const DeleteCommentModal = ({
  isOpen,
  onClose,
  commentId, // Thêm prop commentId
  onCommentDeleted, // Đổi tên callback cho phù hợp
  postId, // Thêm postId để cập nhật count
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { getToken } = useAuth();
  const modalRef = useOutsideClickOrScroll(onClose);
  const { t } = useTranslation();

  // const successAudio = useRef(new Audio(successSound));

  const handleDelete = async () => {
    if (!commentId) {
      toast.error("No comment selected for deletion");
      return;
    }

    try {
      setIsDeleting(true);
      const token = await getToken();
      const { data } = await api.post(
        "/api/comment/delete",
        { commentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        // successAudio.current.play().catch(() => {});
        toast.success("Comment deleted successfully");
        onClose();
        // Callback để parent component xử lý việc remove comment khỏi UI
        if (onCommentDeleted) {
          onCommentDeleted(commentId, postId);
        }
      } else {
        toast.error(data.message || "Failed to delete comment");
      }
    } catch (error) {
      toast.error("Failed to delete comment");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] min-h-screen bg-black/30 backdrop-blur text-white flex items-center justify-center p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-2xl dark:bg-gray-900 shadow-2xl max-w-md w-full p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900  dark:text-gray-400 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            {t("Delete Comment")}
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
          <p className="text-gray-600 mb-4 dark:text-gray-400">
            {t(
              "Are you sure you want to delete this post? This action cannot be undone."
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
          >
            {t("Cancel")}
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {t("Deleting...")}
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                {t("Delete")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteCommentModal;
