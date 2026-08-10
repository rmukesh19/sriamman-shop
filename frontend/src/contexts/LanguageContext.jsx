import { createContext, useContext, useState, useEffect } from "react";
import { translations } from "../i18n.js";
const LanguageContext = createContext(void 0);
const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState("English");
  useEffect(() => {
    const savedLanguage = localStorage.getItem("sri_amman_lang");
    if (savedLanguage === "English" || savedLanguage === "Tamil") {
      setLanguageState(savedLanguage);
    }
  }, []);
  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem("sri_amman_lang", lang);
  };
  const t = (key) => {
    const translationSet = translations[language] || translations["English"];
    return translationSet[key] || translations["English"][key] || String(key);
  };
  return <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>;
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
