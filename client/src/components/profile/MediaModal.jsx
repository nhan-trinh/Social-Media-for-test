import React from "react";

const MediaModal = ({ isOpen, onClose, imageUrl }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[110] min-h-screen bg-black/30 backdrop-blur flex items-center justify-center p-4"
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
          alt="cover_photo"
          className="max-h-[90vh] max-w object-contain rounded-lg shadow-lg"
          onError={(e) => (e.target.src = "/default-media.png")}
        />
      </div>
    </div>
  );
};

export default MediaModal;
