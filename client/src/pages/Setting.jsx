import React from "react";
import { motion } from "framer-motion";
import { Wrench } from "lucide-react";

import { Link } from "react-router-dom";

const Setting = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-900 rounded-xl shadow p-1 max-w-md mx-auto">
      {/* Icon xoay */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
        className="mb-6"
      >
        <Wrench size={64} className="text-blue-600" />
      </motion.div>

      {/* Tiêu đề */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="text-3xl font-bold text-gray-800 dark:text-white mb-2"
      >
        Settings đang phát triển
      </motion.h1>

      {/* Phần mô tả nhấp nháy */}
      <motion.p
        animate={{ opacity: [1, 0.4, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="text-gray-600 text-lg"
      >
        Chúng tôi đang xây dựng thêm tính năng mới 🚧
      </motion.p>

      {/* Nút quay lại */}
      <Link
        to="/"
        className="inline-block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow hover:bg-indigo-700 transition"
      >
        Go to Feed
      </Link>
    </div>
  );
};

export default Setting;
