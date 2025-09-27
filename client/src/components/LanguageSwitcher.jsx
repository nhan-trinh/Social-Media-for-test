import React, { useRef } from "react";
import { useTranslation } from "react-i18next";

import successSound from "../sounds/success.mp3";

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const successAudio = useRef(new Audio(successSound));

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);

    // Phát âm thanh khi chuyển ngôn ngữ
    successAudio.current.currentTime = 0; // Reset về đầu
    successAudio.current.play().catch(console.error);
  };

  return (
    <div className="flex flex-col items-start gap-4 overflow-hidden rounded-md p-6 shadow-sm shadow-[#00000050]">
      <span className="text-center font-mono text-base font-black uppercase text-neutral-600">
        {t("Please select language")}
      </span>
      <div className="flex items-center gap-4">
        <div className="relative flex h-[50px] w-[50px] items-center justify-center">
          <input
            type="radio"
            id="english"
            name="language"
            value="en"
            checked={i18n.language === "en"}
            onChange={() => changeLanguage("en")}
            className="peer z-10 h-full w-full cursor-pointer opacity-0"
          />
          <div className="absolute h-full w-full rounded-full bg-blue-100 p-4 shadow-sm shadow-[#00000050] ring-blue-400 duration-300 peer-checked:scale-110 peer-checked:ring-2" />
          <div className="absolute -z-10 h-full w-full scale-0 rounded-full bg-blue-200 dark:bg-blue-400 duration-500 peer-checked:scale-[500%]" />
          <span className="absolute text-blue-600 font-bold text-sm">EN</span>
        </div>

        <div className="relative flex h-[50px] w-[50px] items-center justify-center">
          <input
            type="radio"
            id="vietnamese"
            name="language"
            value="vi"
            checked={i18n.language === "vi"}
            onChange={() => changeLanguage("vi")}
            className="peer z-10 h-full w-full cursor-pointer opacity-0"
          />
          <div className="absolute h-full w-full rounded-full bg-red-100 dark:bg-red-600 p-2 shadow-sm shadow-[#00000050] ring-red-400 dark:ring-red-900 duration-300 peer-checked:scale-110 peer-checked:ring-2" />
          <div className="absolute -z-10 h-full w-full scale-0 rounded-full bg-red-200 duration-500 peer-checked:scale-[500%]" />
          <span className="absolute text-red-600 font-bold text-sm">VI</span>
        </div>

        <div className="relative flex h-[50px] w-[50px] items-center justify-center">
          <input
            type="radio"
            id="japanese"
            name="language"
            value="jp"
            checked={i18n.language === "jp"}
            onChange={() => changeLanguage("jp")}
            className="peer z-10 h-full w-full cursor-pointer opacity-0"
          />
          <div className="absolute h-full w-full rounded-full bg-pink-100 dark:bg-pink-400 p-2 shadow-sm shadow-[#00000050] ring-red-400 dark:ring-pink-900 duration-300 peer-checked:scale-110 peer-checked:ring-2" />
          <div className="absolute -z-10 h-full w-full scale-0 rounded-full bg-red-200 duration-500 peer-checked:scale-[500%]" />
          <span className="absolute text-pink-600 font-bold text-sm">JP</span>
        </div>

        <div className="relative flex h-[50px] w-[50px] items-center justify-center">
          <input
            type="radio"
            id="chinese"
            name="language"
            value="cn"
            checked={i18n.language === "cn"}
            onChange={() => changeLanguage("cn")}
            className="peer z-10 h-full w-full cursor-pointer opacity-0"
          />
          <div className="absolute h-full w-full rounded-full bg-pink-100 dark:bg-pink-400 p-2 shadow-sm shadow-[#00000050] ring-red-400 dark:ring-pink-900 duration-300 peer-checked:scale-110 peer-checked:ring-2" />
          <div className="absolute -z-10 h-full w-full scale-0 rounded-full bg-red-200 duration-500 peer-checked:scale-[500%]" />
          <span className="absolute text-pink-600 font-bold text-sm">CN</span>
        </div>
      </div>
    </div>
  );
};

export default LanguageSwitcher;
