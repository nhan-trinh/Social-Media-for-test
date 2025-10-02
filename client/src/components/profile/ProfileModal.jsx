import React from "react";

const ProfileModal = ({ isOpen, onClose, imageUrl, type = "profile" }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[110] min-h-screen bg-black/30 backdrop-blur flex items-center justify-center p-4"
      onClick={onClose} // click ngoài để đóng
    >
      {/* Nút đóng */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 text-white text-3xl font-bold hover:text-gray-400"
      >
        ✕
      </button>

      {/* Container để giới hạn ảnh */}
      <div
        className="max-w-5xl max-h-[90vh] flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()} // tránh click trúng ảnh cũng tắt
      >
        <img
          src={imageUrl}
          alt="Profile"
          className={`max-h-[60vh] max-w-[400px] object-contain shadow-xl
            ${type === "profile" ? "rounded-full ring-4 ring-white" : "rounded-lg"}`}
          onError={(e) => (e.target.src = "/default-avatar.png")}
        />
      </div>
    </div>
  );
};

export default ProfileModal;
