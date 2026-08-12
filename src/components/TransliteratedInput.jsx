import React, { useState, useEffect } from "react";
import { transliterateEnglishToTamil } from "../utils/transliterate";

export const TransliteratedInput = ({ value = "", onChange, ...props }) => {
  const [active, setActive] = useState(() => {
    const saved = localStorage.getItem("sri_amman_tamil_typing");
    return saved === "true";
  });

  useEffect(() => {
    const handleToggle = () => {
      const saved = localStorage.getItem("sri_amman_tamil_typing");
      setActive(saved === null ? true : saved === "true");
    };
    window.addEventListener("sri_amman_transliteration_toggle", handleToggle);
    window.addEventListener("storage", handleToggle);
    return () => {
      window.removeEventListener("sri_amman_transliteration_toggle", handleToggle);
      window.removeEventListener("storage", handleToggle);
    };
  }, []);

  const toggleActive = () => {
    const nextState = !active;
    setActive(nextState);
    localStorage.setItem("sri_amman_tamil_typing", String(nextState));
    window.dispatchEvent(new Event("sri_amman_transliteration_toggle"));
  };

  const handleChange = (e) => {
    const rawVal = e.target.value;
    const finalVal = active ? transliterateEnglishToTamil(rawVal) : rawVal;
    if (onChange) {
      onChange({
        ...e,
        target: {
          ...e.target,
          name: props.name,
          value: finalVal
        }
      });
    }
  };

  return (
    <div className="relative w-full">
      <input
        {...props}
        value={value}
        onChange={handleChange}
        className={`${props.className || ""} pr-14`}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={toggleActive}
        title={active ? "Tamil Transliteration Active" : "English Only"}
        className={`absolute right-1.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[9px] font-black rounded select-none border transition-colors cursor-pointer ${
          active
            ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
            : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
        }`}
      >
        {active ? "தமிழ்" : "ENG"}
      </button>
    </div>
  );
};

export const TransliteratedTextArea = ({ value = "", onChange, ...props }) => {
  const [active, setActive] = useState(() => {
    const saved = localStorage.getItem("sri_amman_tamil_typing");
    return saved === null ? true : saved === "true";
  });

  useEffect(() => {
    const handleToggle = () => {
      const saved = localStorage.getItem("sri_amman_tamil_typing");
      setActive(saved === null ? true : saved === "true");
    };
    window.addEventListener("sri_amman_transliteration_toggle", handleToggle);
    window.addEventListener("storage", handleToggle);
    return () => {
      window.removeEventListener("sri_amman_transliteration_toggle", handleToggle);
      window.removeEventListener("storage", handleToggle);
    };
  }, []);

  const toggleActive = () => {
    const nextState = !active;
    setActive(nextState);
    localStorage.setItem("sri_amman_tamil_typing", String(nextState));
    window.dispatchEvent(new Event("sri_amman_transliteration_toggle"));
  };

  const handleChange = (e) => {
    const rawVal = e.target.value;
    const finalVal = active ? transliterateEnglishToTamil(rawVal) : rawVal;
    if (onChange) {
      onChange({
        ...e,
        target: {
          ...e.target,
          name: props.name,
          value: finalVal
        }
      });
    }
  };

  return (
    <div className="relative w-full">
      <textarea
        {...props}
        value={value}
        onChange={handleChange}
        className={`${props.className || ""} pr-14`}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={toggleActive}
        title={active ? "Tamil Transliteration Active" : "English Only"}
        className={`absolute right-1.5 top-2 px-1.5 py-0.5 text-[9px] font-black rounded select-none border transition-colors cursor-pointer ${
          active
            ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
            : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
        }`}
      >
        {active ? "தமிழ்" : "ENG"}
      </button>
    </div>
  );
};
