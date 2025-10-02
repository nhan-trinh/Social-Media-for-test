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
          <div className="absolute -z-10 h-full w-full scale-0 rounded-full bg-red-400 duration-500 peer-checked:scale-[500%]" />
          <span className="absolute text-red-600 font-bold text-sm">VI</span>

          {/* Ngôi sao vàng - chỉ hiện khi được chọn */}
          <div className="absolute top-0 right-0 opacity-0 scale-0 transform -translate-y-1/2 translate-x-1/2 peer-checked:opacity-100 peer-checked:scale-100 duration-300">
            <svg
              className="w-4 h-4 text-yellow-500 drop-shadow-lg"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
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
