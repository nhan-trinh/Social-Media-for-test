import {
  BadgeCheck,
  X,
  Send,
  Heart,
  Trash2,
  Edit,
  Reply,
  ImageIcon,
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import moment from "moment";
import api from "../api/axios";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import DeleteCommentModal from "./DeleteCommentModal";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";

const CommentModal = ({
  post,
  isOpen,
  onClose,
  currentUser,
  onCommentAdded,
  onCommentsCountSync,
}) => {
  // const [likes, setLikes] = useState(post.likes_count || []);
  // const [shareCount, setShareCount] = useState(post.share_count || 0);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);

  const dispatch = useDispatch();
  // const [text, setText] = useState("");
  const [image, setImage] = useState([]);

  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen && post._id) {
      fetchComments();
    }
  }, [isOpen, post._id]);

  // Sync comments count khi modal được mở và comments đã load xong
  useEffect(() => {
    if (isOpen && comments.length >= 0 && onCommentsCountSync && !loading) {
      // Tính tổng số comments (bao gồm cả replies)
      const totalComments = comments.reduce((total, comment) => {
        return total + 1 + (comment.replies ? comment.replies.length : 0);
      }, 0);

      // console.log(
      //   `Total comments calculated: ${totalComments} for post ${post._id}`
      // );
      // Sync với PostCard và lưu vào sessionStorage
      onCommentsCountSync(totalComments);

      // Lưu vào sessionStorage để persist qua navigation
      try {
        sessionStorage.setItem(
          `commentCount_${post._id}`,
          totalComments.toString()
        );
      } catch (error) {
        console.error("Error saving comment count to sessionStorage:", error);
      }
    }
  }, [isOpen, comments, onCommentsCountSync, loading, post._id]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/comment/${post._id}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setComments(data.comments);
      }
    } catch {
      toast.error("Không thể tải bình luận");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!comment.trim && !image()) return;

    try {
      setSubmitting(true);
      const token = await getToken();
      // const formData = new FormData();
      // formData.append("text", text);
      // image && formData.append("image", image);
      const { data } = await api.post(
        "/api/comment/add",
        { postId: post._id, content: comment.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success("Comment added");
        setComment(""); // Clear input

        // Add new comment to the beginning of the list
        const newComment = {
          ...data.comment,
          replies: [],
        };
        setComments((prev) => [newComment, ...prev]);

        // Call the callback to update comment count in PostCard
        if (onCommentAdded) {
          console.log("Adding 1 comment");
          onCommentAdded(1); // +1 comment
        }
      } else {
        toast.error(data.message || "Cannot add comment");
      }
    } catch (error) {
      toast.error("Cannot add comment");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (e, parentCommentId) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      setReplySubmitting(true);
      const token = await getToken();
      const { data } = await api.post(
        "/api/comment/add",
        {
          postId: post._id,
          content: replyContent.trim(),
          parentCommentId: parentCommentId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success("Reply added");
        setReplyContent("");
        setReplyingTo(null);

        // Add reply to the specific comment
        setComments((prev) =>
          prev.map((c) => {
            if (c._id === parentCommentId) {
              return {
                ...c,
                replies: [...(c.replies || []), data.comment],
              };
            }
            return c;
          })
        );

        // Call the callback to update comment count
        if (onCommentAdded) {
          console.log("Adding 1 reply");
          onCommentAdded(1);
        }
      } else {
        toast.error(data.message || "Cannot add reply");
      }
    } catch (error) {
      toast.error("Cannot add reply");
      console.error(error);
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId) => {
    if (!editContent.trim()) return;

    try {
      const token = await getToken();
      const { data } = await api.post(
        "/api/comment/update",
        { commentId, content: editContent.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success("Comment updated");
        setEditingCommentId(null);
        setEditContent("");

        // Update comment in the list
        setComments((prev) =>
          prev.map((c) => {
            if (c._id === commentId) {
              return { ...c, content: editContent.trim() };
            }
            // Also check in replies
            if (c.replies && c.replies.length > 0) {
              const updatedReplies = c.replies.map((reply) =>
                reply._id === commentId
                  ? { ...reply, content: editContent.trim() }
                  : reply
              );
              return { ...c, replies: updatedReplies };
            }
            return c;
          })
        );
      } else {
        toast.error(data.message || "Cannot update the comment");
      }
    } catch (error) {
      toast.error("Cannot update the comment");
      console.error(error);
    }
  };

  const handleDeleteComment = (commentId) => {
    setCommentToDelete(commentId);
    setIsDeleteModalOpen(true);
  };

  const handleCommentDeleted = (deletedCommentId, postId) => {
    // Xóa comment khỏi danh sách
    setComments((prev) => {
      // Tìm và xóa comment chính
      const filteredComments = prev.filter((c) => c._id !== deletedCommentId);

      // Tìm và xóa reply trong các comment
      return filteredComments.map((c) => {
        if (c.replies && c.replies.length > 0) {
          return {
            ...c,
            replies: c.replies.filter(
              (reply) => reply._id !== deletedCommentId
            ),
          };
        }
        return c;
      });
    });

    // Cập nhật comment count
    if (onCommentAdded) {
      onCommentAdded(-1); // Giảm 1 comment
    }

    // Đóng modal
    setIsDeleteModalOpen(false);
    setCommentToDelete(null);
  };

  const handleLikeComment = async (commentId) => {
    try {
      const token = await getToken();
      const { data } = await api.post(
        "/api/comment/like",
        { commentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        // Update likes in the comment list
        setComments((prev) =>
          prev.map((c) => {
            if (c._id === commentId) {
              const isLiked = c.likes_count?.includes(currentUser._id);
              return {
                ...c,
                likes_count: isLiked
                  ? c.likes_count.filter((id) => id !== currentUser._id)
                  : [...(c.likes_count || []), currentUser._id],
              };
            }

            // Also check in replies
            if (c.replies && c.replies.length > 0) {
              const updatedReplies = c.replies.map((reply) => {
                if (reply._id === commentId) {
                  const isLiked = reply.likes_count?.includes(currentUser._id);
                  return {
                    ...reply,
                    likes_count: isLiked
                      ? reply.likes_count.filter((id) => id !== currentUser._id)
                      : [...(reply.likes_count || []), currentUser._id],
                  };
                }
                return reply;
              });
              return { ...c, replies: updatedReplies };
            }
            return c;
          })
        );
      }
    } catch (error) {
      toast.error("Không thể thực hiện hành động");
      console.error(error);
    }
  };

  const handleReply = (commentId, username) => {
    setReplyingTo(commentId);
    setReplyContent(`@${username} `);
  };



  // Early return sau khi tất cả hooks đã được gọi
  if (!isOpen) return null;

  const postWithHashtags = post.content?.replace(
    /(#\w+)/g,
    '<span class="text-indigo-600 font-medium cursor-pointer hover:underline">$1</span>'
  );

  return (
    <>
      <div className="fixed inset-0 z-[110] min-h-screen bg-black/80 backdrop-blur text-white flex">
        <div className="bg-white text-zinc-900 w-full h-full flex flex-col md:flex-row overflow-hidden">
          {/* Left Side - Images/Videos */}
          <div className="flex-1 bg-black md:flex items-center justify-center relative hidden">
            {post.image_urls?.length > 0 ? (
              <div className="w-full h-full flex items-center justify-center">
                {post.image_urls.map((media, i) => {
                  const isVideo = /\.(mp4|webm|ogg)$/i.test(media);
                  return isVideo ? (
                    <video
                      key={i}
                      src={media}
                      controls
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <img
                      key={i}
                      src={media}
                      alt=""
                      className="max-w-full max-h-full object-contain"
                    />
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>{t("No media to display")}</p>
              </div>
            )}
          </div>

          {/* Right Side - Content and Comments */}
          <div className="w-full md:w-96 md:min-w-96 flex flex-col bg-white dark:bg-gray-900 md:border-l border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg dark:text-white font-semibold">
                {t("Comments")}
              </h3>
              <button
                onClick={() => {
                  onClose();
                }}
                className="p-2 hover:bg-gray-100 dark:bg-gray-500 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Post Info */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div
                onClick={() => navigate(`/profile/` + post.user._id)}
                className="flex items-center gap-3 cursor-pointer"
              >
                <img
                  src={post.user.profile_picture}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover shadow"
                />
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-sm dark:text-white">
                      {post.user.full_name}
                    </span>
                    <BadgeCheck className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="text-xs text-gray-500">
                    @{post.user.username} • {moment(post.createdAt).fromNow()}
                  </p>
                </div>
              </div>

              {post.content && (
                <p
                  className="text-gray-800 dark:text-white text-sm leading-relaxed mt-3"
                  dangerouslySetInnerHTML={{ __html: postWithHashtags }}
                />
              )}

              {/* <div className="flex items-center gap-4 text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                <span>{post.post.likes_count.length || 0} likes</span>
                <span>{post.post.comments_count || 0} comments</span>
                <span>{post.post.share_count || 0} shares</span>
              </div> */}

              {/* Mobile only - Show images here */}
              <div className="md:hidden mt-3">
                {post.image_urls?.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {post.image_urls.map((media, i) => {
                      const isVideo = /\.(mp4|webm|ogg)$/i.test(media);
                      return isVideo ? (
                        <video
                          key={i}
                          src={media}
                          controls
                          className={`w-full h-48 object-cover rounded-lg ${
                            post.image_urls.length === 1 && "col-span-2 h-auto"
                          }`}
                        />
                      ) : (
                        <img
                          key={i}
                          src={media}
                          alt=""
                          className={`w-full h-48 object-cover rounded-lg ${
                            post.image_urls.length === 1 && "col-span-2 h-auto"
                          }`}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Comments */}
            <div className="flex-1 overflow-y-auto px-4 py-2">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex gap-2 animate-pulse">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-1">
                        <div className="w-24 h-3 bg-gray-200 rounded"></div>
                        <div className="w-full h-3 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <p className="text-center text-gray-500 py-4 text-sm">
                  {t("Be the first one to comment!")}
                </p>
              ) : (
                <div className="space-y-3 ">
                  {comments.map((c) => (
                    <div key={c._id} className="space-y-2">
                      {/* Main comment */}
                      <div className="flex gap-2 ">
                        <img
                          onClick={() => navigate(`/profile/` + c.user._id)}
                          src={c.user.profile_picture}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="bg-gray-100 rounded-lg px-3 py-2 dark:bg-primary-dark">
                            <div className="flex items-center gap-1 mb-1">
                              <span
                                onClick={() =>
                                  navigate(`/profile/` + c.user._id)
                                }
                                className="font-medium text-xs text-zinc-900 cursor-pointer dark:text-white hover:underline"
                              >
                                {c.user.full_name}
                              </span>
                            </div>
                            {editingCommentId === c._id ? (
                              <div className="flex gap-1 mt-1">
                                <input
                                  value={editContent}
                                  onChange={(e) =>
                                    setEditContent(e.target.value)
                                  }
                                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleUpdateComment(c._id);
                                    } else if (e.key === "Escape") {
                                      setEditingCommentId(null);
                                      setEditContent("");
                                    }
                                  }}
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleUpdateComment(c._id)}
                                  className="px-2 py-1 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                                >
                                  {t("Save")}
                                </button>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-800 dark:text-gray-400">
                                {c.content}
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span className="text-xs">
                              {moment(c.createdAt).fromNow()}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLikeComment(c._id);
                              }}
                              className="flex items-center gap-1 hover:text-red-500 transition cursor-pointer"
                            >
                              <Heart
                                className={`w-3 h-3 ${
                                  c.likes_count?.includes(currentUser._id)
                                    ? "text-red-500 fill-red-500"
                                    : ""
                                }`}
                              />
                              {c.likes_count?.length > 0 && (
                                <span className="text-xs">
                                  {c.likes_count.length}
                                </span>
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReply(c._id, c.user.username);
                              }}
                              className="text-xs hover:text-indigo-500 transition cursor-pointer"
                            >
                              {t("Reply")}
                            </button>
                            {c.user._id === currentUser._id && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingCommentId(c._id);
                                    setEditContent(c.content);
                                  }}
                                  className="text-xs hover:text-indigo-500 transition cursor-pointer"
                                >
                                  {t("Edit")}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteComment(c._id);
                                  }}
                                  className="text-xs hover:text-red-500 transition cursor-pointer"
                                >
                                  {t("Delete")}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Reply Input for this comment */}
                      {replyingTo === c._id && (
                        <div className="ml-10">
                          <form
                            onSubmit={(e) => handleSubmitReply(e, c._id)}
                            className="flex gap-2"
                          >
                            <img
                              src={currentUser.profile_picture}
                              alt=""
                              className="w-6 h-6 rounded-full object-cover"
                            />
                            <div className="flex-1 flex items-center bg-gray-50 border border-gray-300 rounded-full px-2 py-1 focus-within:border-indigo-500 transition">
                              <input
                                type="text"
                                value={replyContent}
                                onChange={(e) =>
                                  setReplyContent(e.target.value)
                                }
                                placeholder={`Reply to @${c.user.username}...`}
                                className="flex-1 bg-transparent outline-none text-xs text-zinc-900 placeholder-gray-400"
                                disabled={replySubmitting}
                                autoFocus
                              />
                              <button
                                type="submit"
                                disabled={
                                  !replyContent.trim() || replySubmitting
                                }
                                className="ml-1 p-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {replySubmitting ? (
                                  <div className="animate-spin rounded-full h-2 w-2 border-b border-white"></div>
                                ) : (
                                  <Send className="w-2 h-2" />
                                )}
                              </button>
                            </div>
                          </form>
                        </div>
                      )}

                      {/* Replies */}
                      {c.replies && c.replies.length > 0 && (
                        <div className="ml-10 space-y-2">
                          {c.replies.map((reply) => (
                            <div key={reply._id} className="flex gap-2">
                              <img
                                onClick={() =>
                                  navigate(`/profile/` + reply.user._id)
                                }
                                src={reply.user.profile_picture}
                                alt=""
                                className="w-6 h-6 rounded-full object-cover cursor-pointer"
                              />
                              <div className="flex-1">
                                <div className="bg-gray-50 dark:bg-primary-dark rounded-lg px-2 py-1">
                                  <div className="flex items-center gap-1 mb-1">
                                    <span
                                      onClick={() =>
                                        navigate(`/profile/` + reply.user._id)
                                      }
                                      className="font-medium text-xs text-zinc-900 dark:text-white cursor-pointer hover:underline"
                                    >
                                      {reply.user.full_name}
                                    </span>
                                  </div>
                                  {editingCommentId === reply._id ? (
                                    <div className="flex gap-1 mt-1">
                                      <input
                                        value={editContent}
                                        onChange={(e) =>
                                          setEditContent(e.target.value)
                                        }
                                        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            handleUpdateComment(reply._id);
                                          } else if (e.key === "Escape") {
                                            setEditingCommentId(null);
                                            setEditContent("");
                                          }
                                        }}
                                        autoFocus
                                      />
                                      <button
                                        onClick={() =>
                                          handleUpdateComment(reply._id)
                                        }
                                        className="px-2 py-1 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition cursor-pointer"
                                      >
                                        {t("Save")}
                                      </button>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-gray-800 dark:text-gray-400">
                                      {reply.content}
                                    </p>
                                  )}
                                </div>

                                {/* Reply Actions */}
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 cursor-pointer">
                                  <span className="text-xs">
                                    {moment(reply.createdAt).fromNow()}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleLikeComment(reply._id);
                                    }}
                                    className="flex items-center gap-1 hover:text-red-500 transition"
                                  >
                                    <Heart
                                      className={`w-3 h-3 ${
                                        reply.likes_count?.includes(
                                          currentUser._id
                                        )
                                          ? "text-red-500 fill-red-500 cousror-pointer"
                                          : ""
                                      }`}
                                    />
                                    {reply.likes_count?.length > 0 && (
                                      <span className="text-xs">
                                        {reply.likes_count.length}
                                      </span>
                                    )}
                                  </button>
                                  {reply.user._id === currentUser._id && (
                                    <>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingCommentId(reply._id);
                                          setEditContent(reply.content);
                                        }}
                                        className="text-xs hover:text-indigo-500 transition cursor-pointer"
                                      >
                                        {t("Edit")}
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteComment(reply._id);
                                        }}
                                        className="text-xs hover:text-red-500 transition cursor-pointer"
                                      >
                                        {t("Delete")}
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comment Input */}
            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
              <form onSubmit={handleSubmitComment} className="flex gap-2">
                <img
                  src={currentUser.profile_picture}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1 flex items-center bg-gray-50 dark:bg-gray-500 border border-gray-300 rounded-full px-3 py-2 focus-within:border-indigo-500 transition">
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t("Write a comment...")}
                    className="flex-1 bg-transparent outline-none text-sm text-zinc-900 placeholder-gray-400"
                    disabled={submitting}
                  />
                  {/* <label htmlFor="image">
                    {image ? (
                      <img
                        src={URL.createObjectURL(image)}
                        alt=""
                        className="h-8 rounded"
                      />
                    ) : (
                      <ImageIcon className="size-7 text-gray-400 cursor-pointer" />
                    )}
                    <input
                      type="file"
                      id="image"
                      accept="image/*"
                      hidden
                      onChange={(e) => setImage(e.target.files[0])}
                    />
                  </label> */}
                  <button
                    type="submit"
                    disabled={!comment.trim() || submitting}
                    className="ml-2 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                    ) : (
                      <Send className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <DeleteCommentModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCommentToDelete(null);
        }}
        commentId={commentToDelete}
        postId={post._id}
        onCommentDeleted={handleCommentDeleted}
      />
    </>
  );
};

export default CommentModal;
