import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import moment from "moment";
import StoriesModal from "./StoriesModal";
import StoryViewers from "./StoryViewers";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const StoriesBar = () => {
  const { getToken } = useAuth();

  const [stories, setStories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [viewStory, setviewStory] = useState(null);
  const { t } = useTranslation();

  const fetchStories = async () => {
    try {
      const token = await getToken();
      const { data } = await api.get("api/story/get", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        // Lọc ra những stories có user hợp lệ
        const validStories = data.stories.filter(
          (story) => story && story.user
        );
        setStories(validStories);
      } else {
        toast(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  return (
    <div className="w-screen sm:w-[calc(100vw-240px)] dark:bg-gray-900 lg:max-w-2xl no-scrollbar overflow-x-auto px-4">
      <div className="flex gap-4 pb-5">
        <div
          onClick={() => setShowModal(true)}
          className="rounded-lg shadow-sm min-w-30 max-w-30 max-h-40 aspect-[3/4] cursor-pointer hover:shadow-lg transition-all duration-200 border-2 border-dashed border-indigo-300 dark:border-indigo-500 bg-gradient-to-b from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800"
        >
          <div className="h-full flex flex-col items-center justify-center p-4">
            <div className="size-10 bg-indigo-500 rounded-full flex items-center justify-center mb-3">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 text-center">
              {t("Create Stories")}
            </p>
          </div>
        </div>
        {stories.map((story, index) => {
          // Kiểm tra story và story.user trước khi render
          if (!story || !story.user) {
            return null;
          }

          return (
            <div
              onClick={() => setviewStory(story)}
              key={index}
              className={`relative rounded-lg shadow min-w-30 max-w-30 max-h-40 cursor-pointer hover:shadow-lg transition-all duration-200 bg-gradient-to-b from-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-800 dark:from-gray-800 dark:to-gray-900 hover:dark:from-gray-700 hover:dark:to-gray-800 active:scale-95`}
            >
              <img
                src={story.user.profile_picture || "/default-avatar.png"} // Fallback image
                alt="User avatar"
                className="absolute size-8 top-3 left-3 z-10 rounded-full ring ring-gray-100 dark:ring-gray-800 shadow"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  // Fallback nếu ảnh không load được
                  e.target.src = "/default-avatar.png";
                }}
              />
              <p className="absolute top-18 left-3 text-white/60 dark:text-slate-300/70 text-sm truncate max-w-24">
                {story.content || ""}
              </p>
              <p className="text-white absolute bottom-1 right-2 z-10 text-xs">
                {moment(story.createdAt).fromNow()}
              </p>
              {story.media_type !== "text" && story.media_url && (
                <div className="absolute inset-0 z-1 rounded-lg bg-black overflow-hidden">
                  {story.media_type === "image" ? (
                    <img
                      src={story.media_url}
                      alt="Story media"
                      className="h-full w-full object-cover hover:scale-110 transition duration-500 opacity-70 hover:opacity-70"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        // Ẩn ảnh nếu không load được
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <video
                      src={story.media_url}
                      className="h-full w-full object-cover hover:scale-110 transition duration-500 opacity-70 hover:opacity-80"
                      preload="none"
                      onError={(e) => {
                        // Ẩn video nếu không load được
                        e.target.style.display = "none";
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showModal && (
        <StoriesModal setShowModal={setShowModal} fetchStories={fetchStories} />
      )}
      {viewStory && (
        <StoryViewers viewStory={viewStory} setviewStory={setviewStory} />
      )}
    </div>
  );
};

export default StoriesBar;
