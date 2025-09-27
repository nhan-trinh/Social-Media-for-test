import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "../locales/en.json";
import vi from "../locales/vi.json";
import jp from "../locales/jp.json"
import cn from "../locales/cn.json"

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      vi: { translation: vi },
      jp: { translation: jp },
      cn: { translation: cn },
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],

      caches: ["localStorage"],
    },
  });

export default i18n;
