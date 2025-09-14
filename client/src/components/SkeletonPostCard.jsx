import React from "react";

const SkeletonPostCard = () => {
  return (
    <div className="bg-white rounded-xl shadow p-4 space-y-4 w-full max-w-2xl animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200"></div>
        <div className="flex-1">
          <div className="w-32 h-3 bg-gray-200 rounded mb-2"></div>
          <div className="w-20 h-3 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <div className="w-full h-3 bg-gray-200 rounded"></div>
        <div className="w-2/3 h-3 bg-gray-200 rounded"></div>
      </div>

      {/* Images */}
      <div className="grid grid-cols-2 gap-2">
        <div className="h-40 bg-gray-200 rounded"></div>
        <div className="h-40 bg-gray-200 rounded"></div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center gap-6 text-sm">
        <div className="w-10 h-3 bg-gray-200 rounded"></div>
        <div className="w-10 h-3 bg-gray-200 rounded"></div>
        <div className="w-10 h-3 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
};

export default SkeletonPostCard;
