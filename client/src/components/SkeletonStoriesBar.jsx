import React from "react";

const SkeletonStoriesBar = () => {
  return (
    <div className="w-screen sm:w-[calc(100vw-240px)] lg:max-w-2xl overflow-x-auto px-4">
      <div className="flex gap-4 pb-5 animate-pulse">
        {/* Create story skeleton */}
        <div className="rounded-lg min-w-30 max-w-30 max-h-40 aspect-[3/4] bg-gray-200"></div>
        {/* 3 fake stories */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-lg min-w-30 max-w-30 max-h-40 aspect-[3/4] bg-gray-200"
          ></div>
        ))}
      </div>
    </div>
  );
};

export default SkeletonStoriesBar;
