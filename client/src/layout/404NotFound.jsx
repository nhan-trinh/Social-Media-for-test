import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-purple-100 to-pink-100 px-4">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <AlertCircle size={64} className="text-red-500 animate-bounce" />
        </div>
        <h1 className="text-6xl font-bold text-gray-800 mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Opps! Your page doesn't exist at all
        </h2>
        <p className="text-gray-600 mb-6">
          You may have entered the wrong address or the page has been deleted.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow hover:bg-indigo-700 transition"
        >
          Go to Feed
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
