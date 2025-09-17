import React from "react";
import { assets } from "../assets/assets";
import { Star } from "lucide-react";
import { SignIn } from "@clerk/clerk-react";
import { motion } from "framer-motion";

const Login = () => {
  return (
    <div className="relative min-h-screen flex flex-col md:flex-row overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-white">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
            animation: "gridMove 20s linear infinite",
          }}
        />
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full blur-sm opacity-60"
        />
        <motion.div
          animate={{ y: [0, 15, 0], rotate: [0, -8, 0], scale: [1, 0.9, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur-sm opacity-50"
        />
        <motion.div
          animate={{ y: [0, -10, 0], x: [0, 10, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-32 left-1/4 w-12 h-12 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full blur-sm opacity-40"
        />
      </div>

      {/* Left Section */}
      <motion.div
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="flex-1 flex flex-col items-start justify-between p-8 md:p-12 lg:pl-32 relative z-10"
      >
        {/* Logo */}
        <motion.img
          src={assets.logo}
          alt="logo"
          className="h-12 object-contain drop-shadow-lg"
          loading="eager"
          decoding="async"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        />

        {/* Intro */}
        <div className="space-y-6">
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <img
              src={assets.group_users}
              alt=""
              className="h-8 md:h-10"
              loading="lazy"
              decoding="async"
              width={40}
              height={40}
            />
            <div>
              <div className="flex">
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <Star
                      key={i}
                      className="size-5 text-transparent fill-amber-400 drop-shadow-md animate-bounce"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
              </div>
              <p className="text-sm md:text-base text-gray-200">
                Trusted by <span className="font-semibold">0</span> developers
              </p>
            </div>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-6xl font-extrabold leading-tight bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent drop-shadow-lg"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.9 }}
          >
            More than just friends, <br /> truly connect
          </motion.h1>

          <motion.p
            className="text-lg md:text-2xl text-gray-200 max-w-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
          >
            Connect with people across the globe on{" "}
            <span className="font-semibold text-indigo-200">ButtBook</span>.
          </motion.p>
        </div>

        <span className="md:h-10"></span>
      </motion.div>

      {/* Right Section */}
      <motion.div
        initial={{ x: 80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 1 }}
        className="flex-1 flex items-center justify-center p-6 sm:p-10 relative z-10"
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="backdrop-blur-xl bg-white/10 p-8 rounded-2xl shadow-2xl border border-white/20"
        >
          <SignIn />
        </motion.div>
      </motion.div>

      {/* Animated CSS */}
      <style jsx="true">{`
        @keyframes gridMove {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(50px, 50px);
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
