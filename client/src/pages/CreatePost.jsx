import React, { useState } from "react";
import { Image, X } from "lucide-react";
import toaster, { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import "../css/Uploadfile.css";
import { useTranslation } from "react-i18next";
const CreatePost = () => {
  const navigate = useNavigate();

  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const user = useSelector((state) => state.user.value);

  const { getToken } = useAuth();

  const handleSubmit = async () => {
    if (!images.length && !content) {
      return toast.error("Please add at least one image or text");
    }
    setLoading(true);

    const postType =
      images.length && content
        ? "text_with_image"
        : images.length
        ? "image"
        : "text";

    try {
      const formData = new FormData();
      formData.append("content", content);
      formData.append("post_type", postType);
      images.map((image) => {
        formData.append("images", image);
      });

      const { data } = await api.post("/api/post/add", formData, {
        headers: {
          Authorization: `Bearer ${await getToken()}`,
        },
      });

      if (data.success) {
        navigate("/");
      } else {
        console.log(data.message);
        throw new Error(data.message);
      }
    } catch (error) {
      console.log(error.message);
      throw new Error(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-900">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-teal-50 mb-2">
            {t("Create Post")}
          </h1>
          <p className="text-slate-600 dark:text-gray-400">
            {t("Share your thoughts with the world")}
          </p>
        </div>

        <div className="max-w-xl bg-white dark:bg-primary-dark p-4 sm:p-8 sm:pb-3 rounded-xl shadow-md space-y-4">
          <div className="flex items-center gap-3">
            <img
              src={user.profile_picture}
              alt=""
              className="w-12 h-12 rounded-full shadow"
            />
            <div>
              <h2 className="font-semibold">{user.full_name}</h2>
              <p className="text-sm text-gray-500">@{user.username}</p>
            </div>
          </div>
          <textarea
            className="w-full resize-none max-h-20 mt-4 text-sm outline-none placeholder-gray-400"
            placeholder="What's up?"
            onChange={(e) => setContent(e.target.value)}
            value={content}
          />
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {images.map((file, i) => (
                <div key={i} className="relative group">
                  {file.type.startsWith("image") ? (
                    <img
                      src={URL.createObjectURL(file)}
                      className="h-20 rounded-md"
                      alt=""
                    />
                  ) : (
                    <video
                      src={URL.createObjectURL(file)}
                      className="h-20 rounded-md"
                      controls
                    />
                  )}
                  <div
                    onClick={() =>
                      setImages(images.filter((_, index) => index !== i))
                    }
                    className="absolute hidden group-hover:flex justify-center items-center top-0 right-0 bottom-0 left-0 bg-black/40 rounded-md cursor-pointer"
                  >
                    <X className="w-6 h-6 text-white" />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between pt-3 border-t border-gray-300">
            <label
              htmlFor="images"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition cursor-pointer"
            >
              <div className="file-upload-container">
                <div className="folder">
                  <div className="front-side">
                    <div className="tip" />
                    <div className="cover" />
                  </div>
                  <div className="back-side cover" />
                </div>
              </div>
            </label>
            <input
              type="file"
              id="images"
              accept="image/*,video/*"
              hidden
              multiple
              onChange={(e) => setImages([...images, ...e.target.files])}
            />

            <button
              disabled={loading}
              onClick={() =>
                toaster.promise(handleSubmit(), {
                  loading: "uploading....",
                  success: <p>{t("Post Added")}</p>,
                  error: <p>{t("Post not Added")}</p>,
                })
              }
              className="text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 
            active:scale-95 transition text-white font-medium px-8 py-2 rounded-md cursor-pointer"
            >
              {t("Post")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
