import React from "react";
import { menuItemsData } from "../assets/assets";
import { NavLink } from "react-router-dom";
import { useNotification } from "../contexts/NotificationContext";
import { useTranslation } from "react-i18next";

const Menuitems = ({ setSideBarOpen }) => {
  const { t } = useTranslation();
  const { unreadCount } = useNotification();

  return (
    <div className="px-6 text-gray-600 dark:text-slate-200 space-y-1 font-medium">
      {menuItemsData.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          onClick={() => setSideBarOpen(false)}
          className={({ isActive }) =>
            `px-3.5 py-2 flex items-center gap-3 rounded-xl ${
              isActive
                ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400"
                : "hover:bg-gray-50 dark:hover:bg-gray-800"
            }`
          }
        >
          <div className="relative">
            <Icon className="w-5 h-5" />
            {to === "/notifications" && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
          {t(`menu.${label}`)}
        </NavLink>
      ))}
    </div>
  );
};

export default Menuitems;