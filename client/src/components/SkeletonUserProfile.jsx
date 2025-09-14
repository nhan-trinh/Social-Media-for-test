import React from "react";

const SkeletonUserProfile = () => {
  return (
    <div className="bg-white rounded-2xl shadow overflow-hidden animate-pulse">
      {/* Cover */}
      <div className="h-40 md:h-56 bg-gray-200" />

      {/* Avatar + info */}
      <div className="p-6 flex gap-4">
        <div className="w-24 h-24 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-3">
          <div className="w-40 h-5 bg-gray-200 rounded"></div>
          <div className="w-28 h-4 bg-gray-200 rounded"></div>
          <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonUserProfile;
