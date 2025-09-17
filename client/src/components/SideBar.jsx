import React from "react";
import { assets } from "../assets/assets";
import { useNavigate, Link } from "react-router-dom";
import Menuitems from "./Menuitems";
import { CirclePlus, LogOut } from "lucide-react";
import { UserButton, useClerk } from "@clerk/clerk-react";
import { useSelector } from "react-redux";
import "../css/Button.css";
import { useTranslation } from "react-i18next";

const SideBar = ({ sideBarOpen, setSideBarOpen }) => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.value);
  const { signOut } = useClerk();
  const { t } = useTranslation();

  return (
    <div
      className={`w-60 xl:w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col justify-between items-center max-sm:absolute top-0 bottom-0 z-20 ${
        sideBarOpen ? "translate-x-0" : "max-sm:-translate-x-full"
      }  transition-all duration-300 ease-in-out `}
    >
      <div className="w-full ">
        <img
          onClick={() => navigate("/")}
          src={assets.logo}
          alt=""
          className="w-30 h-12 ml-7 cursor-pointer "
        />
        <hr className="border-gray-300 dark:border-gray-700 mb-8" />

        <Menuitems setSideBarOpen={setSideBarOpen} />

        <Link
          to="/create-post"
          className="animated-gradient-create-button mx-6 mt-6"
        >
          <CirclePlus className="w-5 h-5" />
          {t("Create Post")}
        </Link>
      </div>

      <div className="w-full border-t border-gray-200 dark:border-gray-700 p-4 px-7 flex items-center justify-between">
        <div className="flex gap-2 items-center cursor-pointer">
          <UserButton />
          <div>
            <h1 className="text-sm font-medium ">{user.full_name}</h1>
            <p className="text-xs text-gray-500 ">@{user.username}</p>
          </div>
        </div>
        <LogOut
          onClick={signOut}
          className="w-4.5 text-gray-400 hover:text-gray-700 transition cursor-pointer"
        />
      </div>
    </div>
  );
};

export default SideBar;
