import { createContext, useContext, useState, useEffect } from "react";
import { translations } from "../i18n.js";

const LanguageContext = createContext(void 0);

const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState("English");

  useEffect(() => {
    const savedLanguage = localStorage.getItem("sri_amman_lang");
    if (savedLanguage === "English" || savedLanguage === "Tamil" || savedLanguage === "Both" || savedLanguage === "Dual") {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem("sri_amman_lang", lang);
  };

  const t = (key) => {
    const en = translations["English"]?.[key];
    const ta = translations["Tamil"]?.[key];

    if (language === "Both" || language === "Dual") {
      if (en && ta && en !== ta) {
        return `${en} / ${ta}`;
      }
      return en || ta || String(key);
    }

    const translationSet = translations[language] || translations["English"];
    return translationSet[key] || en || String(key);
  };

  const formatText = (enVal, taVal) => {
    if (!enVal && !taVal) return "";
    if (language === "Both" || language === "Dual") {
      if (enVal && taVal && enVal !== taVal) {
        return `${enVal} (${taVal})`;
      }
      return enVal || taVal || "";
    }
    if (language === "Tamil") {
      return taVal || enVal || "";
    }
    return enVal || taVal || "";
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, formatText }}>
      {children}
    </LanguageContext.Provider>
  );
};

const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export {
  LanguageProvider,
  useLanguage
};
