import React, { useState, useRef } from "react";
import { X, Image as ImageIcon, AlertCircle } from "lucide-react";
import toaster, { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import "../css/Uploadfile.css";
import { useTranslation } from "react-i18next";
import successSound from "../sounds/success.mp3";

const CreatePost = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  
  const user = useSelector((state) => state.user.value);
  const { getToken } = useAuth();
  const successAudio = useRef(new Audio(successSound));
  const fileInputRef = useRef(null);

  const MAX_FILES = 10;
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Check total count
    if (images.length + files.length > MAX_FILES) {
      toast.error(`You can only upload up to ${MAX_FILES} files`);
      return;
    }

    // Validate file sizes
    const invalidFiles = files.filter(file => file.size > MAX_FILE_SIZE);
    if (invalidFiles.length > 0) {
      toast.error("Some files exceed 50MB size limit");
      return;
    }

    setImages([...images, ...files]);
  };

  const removeImage = (indexToRemove) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

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
      images.forEach((image) => {
        formData.append("images", image);
      });

      const { data } = await api.post("/api/post/add", formData, {
        headers: {
          Authorization: `Bearer ${await getToken()}`,
        },
      });

      if (data.success) {
        successAudio.current.play().catch(() => {});
        navigate("/");
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.log(error.message);
      throw new Error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Render preview grid based on number of images
  const renderPreviewGrid = () => {
    const count = images.length;
    
    if (count === 0) return null;

    // Single image
    if (count === 1) {
      return (
        <div className="w-full">
          {renderPreviewItem(images[0], 0, "w-full h-auto max-h-80 object-cover rounded-lg")}
        </div>
      );
    }

    // Two images
    if (count === 2) {
      return (
        <div className="grid grid-cols-2 gap-2">
          {images.map((file, i) => 
            renderPreviewItem(file, i, "w-full h-40 object-cover rounded-lg")
          )}
        </div>
      );
    }

    // Three images
    if (count === 3) {
      return (
        <div className="grid grid-cols-2 gap-2">
          <div className="row-span-2">
            {renderPreviewItem(images[0], 0, "w-full h-full object-cover rounded-lg")}
          </div>
          <div className="space-y-2">
            {images.slice(1).map((file, i) => 
              renderPreviewItem(file, i + 1, "w-full h-[calc(50%-4px)] object-cover rounded-lg")
            )}
          </div>
        </div>
      );
    }

    // Four or more images - 2x2 grid
    return (
      <div className="grid grid-cols-2 gap-2">
        {images.slice(0, 4).map((file, i) => 
          renderPreviewItem(file, i, "w-full h-40 object-cover rounded-lg")
        )}
        {count > 4 && (
          <div className="col-start-2 row-start-2 relative">
            {renderPreviewItem(images[3], 3, "w-full h-40 object-cover rounded-lg")}
            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded-lg">
              <span className="text-white text-xl font-semibold">
                +{count - 4} more
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPreviewItem = (file, index, className) => {
    return (
      <div key={index} className="relative group">
        {file.type.startsWith("image") ? (
          <img
            src={URL.createObjectURL(file)}
            className={className}
            alt=""
          />
        ) : (
          <video
            src={URL.createObjectURL(file)}
            className={className}
            controls
          />
        )}
        <button
          onClick={() => removeImage(index)}
          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
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
            className="w-full resize-none min-h-20 max-h-40 mt-4 text-sm outline-none placeholder-gray-400 dark:bg-primary-dark dark:text-slate-100"
            placeholder="What's up?"
            onChange={(e) => setContent(e.target.value)}
            value={content}
          />

          {images.length > 0 && (
            <div className="mt-4">
              {renderPreviewGrid()}
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <ImageIcon className="w-3 h-3" />
                <span>
                  {images.length} {images.length === 1 ? 'file' : 'files'} selected
                  {images.length >= MAX_FILES && ` (Maximum ${MAX_FILES})`}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-gray-300 dark:border-gray-700">
            <label
              htmlFor="images"
              className={`flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition cursor-pointer ${
                images.length >= MAX_FILES ? 'opacity-50 cursor-not-allowed' : ''
              }`}
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
              <span className="text-xs">
                {images.length > 0 ? 'Add more' : 'Add photos/videos'}
              </span>
            </label>
            
            <input
              ref={fileInputRef}
              type="file"
              id="images"
              accept="image/*,video/*"
              hidden
              multiple
              disabled={images.length >= MAX_FILES}
              onChange={handleFileSelect}
            />

            <button
              disabled={loading || (!images.length && !content)}
              onClick={() =>
                toaster.promise(handleSubmit(), {
                  loading: "Uploading....",
                  success: <p>{t("Post Added")}</p>,
                  error: <p>{t("Post not Added")}</p>,
                })
              }
              className="text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 
                active:scale-95 transition text-white font-medium px-8 py-2 rounded-md cursor-pointer
                disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {loading ? "Posting..." : t("Post")}
            </button>
          </div>

          {images.length >= MAX_FILES && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Maximum {MAX_FILES} files reached. Remove some to add more.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePost;