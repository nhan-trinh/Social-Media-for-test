import React from "react";

const CoverPhoto = ({ isOpen, onClose, imageUrl }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
      onClick={onClose}
    >
      {/* Nút đóng */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 text-white text-3xl font-bold hover:text-gray-400"
      >
        ✕
      </button>

      {/* Hình ảnh */}
      <div
        className="max-w-4xl max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt="Cover_photo"
          className="w-full h-full object-contain rounded-lg shadow-lg"
          onError={(e) => (e.target.src = "/default-cover_photo.png")}
        />
      </div>
    </div>
  );
};

export default CoverPhoto;
