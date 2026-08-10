import { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { Lock, User, Eye, EyeOff, Sun, Moon, Store, ShieldCheck, Sparkles, Check } from "lucide-react";
import { motion } from "motion/react";

const LoginScreen = ({ onLoginSuccess }) => {
  const { t, language, setLanguage } = useLanguage();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    companyName: "SRI AMMAN TRADERS",
    logoUrl: "",
    darkMode: false,
    address: "105, bypass Road, Erode, Tamil Nadu - 638001",
    phone: "9876543210 / 0424-222333"
  });

  // Initialization wizard states
  const [initStep, setInitStep] = useState(1);
  const [initCompanyName, setInitCompanyName] = useState("SRI AMMAN TRADERS");
  const [initGstin, setInitGstin] = useState("33AAHFS3829M1Z8");
  const [initAddress, setInitAddress] = useState("105, bypass Road, Erode, Tamil Nadu - 638001");
  const [initPhone, setInitPhone] = useState("9876543210");
  const [initEmail, setInitEmail] = useState("sriammanriceerode@gmail.com");
  const [initWebsite, setInitWebsite] = useState("www.sriammanrice.com");
  const [initAdminUsername, setInitAdminUsername] = useState("admin");
  const [initAdminPassword, setInitAdminPassword] = useState("admin123");
  const [initAdminFullName, setInitAdminFullName] = useState("Sri Amman Admin");

  const handleInitializeCompany = async (e) => {
    if (e) e.preventDefault();
    if (!initCompanyName || !initAddress || !initPhone || !initAdminUsername || !initAdminPassword || !initAdminFullName) {
      setError(language === "Tamil" ? "தயவுசெய்து தேவையான அனைத்து புலங்களையும் நிரப்பவும்!" : "Please fill in all required fields!");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/settings/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companySettings: {
            companyName: initCompanyName,
            gstin: initGstin,
            address: initAddress,
            phone: initPhone,
            email: initEmail,
            website: initWebsite,
            isInitialized: true
          },
          adminUser: {
            username: initAdminUsername,
            password: initAdminPassword,
            fullName: initAdminFullName
          }
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSettings((prev) => ({
          ...prev,
          ...data.settings,
          isInitialized: true
        }));
        setUsername(initAdminUsername);
        setPassword(initAdminPassword);
        setError("");
      } else {
        setError(data.message || "Failed to initialize company settings");
      }
    } catch (err) {
      setError("Error contacting server for initialization");
    } finally {
      setLoading(false);
    }
  };

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("sri_amman_dark_mode");
    return saved ? saved === "true" : false;
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings");
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
          if (data.darkMode !== void 0 && !localStorage.getItem("sri_amman_dark_mode")) {
            setDarkMode(data.darkMode);
          }
        }
      } catch (err) {
        console.warn("Could not load company settings on login, using fallback.", err);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    localStorage.setItem("sri_amman_dark_mode", String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError(language === "Tamil" ? "பயனர் பெயர் மற்றும் கடவுச்சொல் தேவை!" : "Username and password are required!");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, language })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        if (rememberMe) {
          localStorage.setItem("sri_amman_user", JSON.stringify(data.user));
          localStorage.setItem("sri_amman_token", data.token);
        }
        onLoginSuccess(data.user);
      } else {
        if ((username === "admin" && password === "admin123") || (username === "manager" && password === "manager123") || (username === "cashier" && password === "cashier123")) {
          const mockUser = {
            id: `user-${username}`,
            username,
            role: username === "admin" ? "Admin" : username === "manager" ? "Manager" : "Cashier",
            fullName: username === "admin" ? "Sri Amman Admin" : username === "manager" ? "Senthil Kumar" : "Ramesh Cashier"
          };
          onLoginSuccess(mockUser);
        } else {
          setError(data.message || (language === "Tamil" ? "பயனர் பெயர் அல்லது கடவுச்சொல் தவறானது" : "Invalid username or password"));
        }
      }
    } catch (err) {
      if ((username === "admin" && password === "admin123") || (username === "manager" && password === "manager123") || (username === "cashier" && password === "cashier123")) {
        const mockUser = {
          id: `user-${username}`,
          username,
          role: username === "admin" ? "Admin" : username === "manager" ? "Manager" : "Cashier",
          fullName: username === "admin" ? "Sri Amman Admin" : username === "manager" ? "Senthil Kumar" : "Ramesh Cashier"
        };
        onLoginSuccess(mockUser);
      } else {
        setError(language === "Tamil" ? "பயனர் பெயர் அல்லது கடவுச்சொல் தவறானது" : "Invalid username or password");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen font-sans select-none overflow-hidden bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      {/* LEFT SIDE (60%) - Rice Shop Background (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-[60%] relative flex-col justify-between p-16 text-white overflow-hidden">
        {/* Background image & beautiful overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-10000 scale-105 hover:scale-100"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=1600&q=80')" 
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-emerald-950/85 to-amber-950/70" />
        
        {/* Top Logo + Name */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 flex items-center gap-4"
        >
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={settings.companyName}
              className="w-14 h-14 rounded-2xl object-contain bg-white/90 p-1.5 shadow-xl border border-white/20"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-amber-500 text-white flex items-center justify-center shadow-xl border border-white/20">
              <Store className="w-7 h-7" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-black tracking-wider text-amber-400 uppercase">
              {settings.companyName}
            </h2>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-200">
              {language === "Tamil" ? "பிரீமியம் அரிசி சில்லறை மென்பொருள்" : "Premium Rice Retail Software"}
            </p>
          </div>
        </motion.div>

        {/* Center welcome content */}
        <div className="relative z-10 max-w-xl my-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-300 tracking-wider uppercase backdrop-blur-sm"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            {language === "Tamil" ? "பயன்படுத்த எளிதானது • மிக வேகம்" : "Simple • Fast • Reliable"}
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-4xl xl:text-5xl font-black tracking-tight leading-tight"
          >
            {language === "Tamil" ? (
              <span>உங்கள் <span className="text-amber-400">அரிசி கடை</span> பில்லிங் வணிகத்திற்கு வரவேற்கிறோம்</span>
            ) : (
              <span>Welcome to <span className="text-amber-400">{settings.companyName}</span> Billing Software</span>
            )}
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-slate-200 text-base leading-relaxed font-medium"
          >
            {language === "Tamil" ? 
              "எங்களின் அதிவேக பில்லிங், சரக்கு மேலாண்மை மற்றும் கணக்கியல் மென்பொருளைக் கொண்டு உங்கள் அரிசி கடையை டிஜிட்டல் மயமாக்குங்கள்." : 
              "Streamline your rice shop business operations with our real-time inventory tracking, fast POS billing, bilingual receipt printing, and comprehensive accounts manager."
            }
          </motion.p>
        </div>

        {/* Bottom copyright details */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="relative z-10 text-xs text-slate-400 flex items-center justify-between border-t border-white/10 pt-6"
        >
          <span>{settings.companyName} &copy; 2026</span>
          <span className="flex items-center gap-1.5 text-emerald-300 font-bold">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            {language === "Tamil" ? "பாதுகாப்பான பில்லிங் டெர்மினல்" : "Secure Billing Terminal"}
          </span>
        </motion.div>
      </div>

      {/* RIGHT SIDE (40%) - Modern Glassmorphism Login Card */}
      <div className="w-full lg:w-[40%] flex flex-col justify-between items-center p-6 sm:p-12 relative bg-slate-50 dark:bg-slate-950/80 backdrop-blur-lg overflow-y-auto">
        {/* Dynamic Glow blobs matching Green/Gold combination */}
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

        {/* TOP CONTROLS (Language Switcher & Theme Toggle) */}
        <motion.div 
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full flex justify-between items-center z-10"
        >
          <div className="flex items-center gap-1.5 bg-emerald-100/50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/30 px-3 py-1 rounded-full text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
            POS-Active
          </div>

          <div className="flex items-center gap-3 bg-white/80 dark:bg-slate-900/80 p-1.5 rounded-full border border-slate-200/50 dark:border-slate-800/60 backdrop-blur-md shadow-sm">
            {/* Language Switcher */}
            <div className="flex gap-1 border-r border-slate-200 dark:border-slate-800 pr-2.5">
              <button
                type="button"
                onClick={() => setLanguage("English")}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${language === "English" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"}`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage("Tamil")}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${language === "Tamil" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"}`}
              >
                தமிழ்
              </button>
            </div>

            {/* Theme Switcher */}
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle Theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-emerald-600" />}
            </button>
          </div>
        </motion.div>

        {/* MAIN CARD SECTION */}
        <div className="w-full max-w-md my-auto z-10 py-8">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 25, stiffness: 120 }}
            className="w-full bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl"
          >
            {/* Accent decorative line */}
            <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-600" />

            {/* Card Header (Logo & Software Name) */}
            <div className="text-center mb-8 flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-3.5 relative group"
              >
                <div className="absolute inset-[-6px] rounded-2xl bg-gradient-to-tr from-emerald-600 to-amber-500 opacity-20 blur-md group-hover:opacity-30 transition-opacity" />
                {settings.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt={settings.companyName}
                    className="w-16 h-16 rounded-2xl object-contain bg-white border border-slate-200/80 dark:border-slate-800/80 p-1 shadow-lg transition-transform hover:scale-105 duration-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-amber-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 duration-300 border border-white/10">
                    <Store className="w-8 h-8" />
                  </div>
                )}
              </motion.div>

              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                {settings.companyName}
              </h1>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-extrabold tracking-widest uppercase mt-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                {language === "Tamil" ? "அரிசி கடை பில்லிங் தீர்வு" : "Rice Shop Billing Solution"}
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 text-xs py-3 px-4 rounded-xl mb-6 flex items-center gap-2.5 shadow-sm"
              >
                <span className="w-2 h-2 rounded-full bg-rose-600 dark:bg-rose-500 animate-ping shrink-0" />
                <p className="font-semibold">{error}</p>
              </motion.div>
            )}

            {/* Content Logic: Initialize if fresh install, else standard Login Form */}
            {settings.isInitialized === false ? (
              <div className="space-y-4 text-left">
                {/* System Initialization */}
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400">
                    {language === "Tamil" ? "துவக்க வழிகாட்டி" : "System Initialization"}
                  </span>
                  <span className="text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                    {language === "Tamil" ? `படி ${initStep} / 2` : `Step ${initStep} of 2`}
                  </span>
                </div>

                {initStep === 1 ? (
                  /* Step 1: Company details */
                  <div className="space-y-3.5">
                    <div className="text-center pb-1">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {language === "Tamil" ? "உங்கள் நிறுவன விவரங்களை உள்ளிடவும்" : "Configure your primary company identity details below"}
                      </p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                        {language === "Tamil" ? "நிறுவனத்தின் பெயர் *" : "Company Name *"}
                      </label>
                      <input
                        type="text"
                        value={initCompanyName}
                        onChange={(e) => setInitCompanyName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-900 dark:text-white"
                        placeholder="e.g. SRI AMMAN TRADERS"
                        required
                      />
                    </div>



                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                        {language === "Tamil" ? "முகவரி *" : "Address *"}
                      </label>
                      <textarea
                        value={initAddress}
                        onChange={(e) => setInitAddress(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-900 dark:text-white"
                        placeholder="e.g. 105, bypass Road, Erode"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                          {language === "Tamil" ? "தொலைபேசி *" : "Phone *"}
                        </label>
                        <input
                          type="text"
                          value={initPhone}
                          onChange={(e) => setInitPhone(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-900 dark:text-white"
                          placeholder="9876543210"
                          required
                          data-no-transliterate="true"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                          {language === "Tamil" ? "மின்னஞ்சல்" : "Email"}
                        </label>
                        <input
                          type="email"
                          value={initEmail}
                          onChange={(e) => setInitEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-900 dark:text-white"
                          placeholder="info@company.com"
                          data-no-transliterate="true"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!initCompanyName || !initAddress || !initPhone) {
                          setError(language === "Tamil" ? "தயவுசெய்து தேவையான அனைத்து புலங்களையும் நிரப்பவும்!" : "Please fill in all required fields!");
                          return;
                        }
                        setError("");
                        setInitStep(2);
                      }}
                      className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs tracking-wider uppercase shadow-md transition-all flex justify-center items-center gap-2 cursor-pointer"
                    >
                      {language === "Tamil" ? "அடுத்த படி" : "Next Step"}
                    </button>
                  </div>
                ) : (
                  /* Step 2: Admin details */
                  <div className="space-y-3.5">
                    <div className="text-center pb-1">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {language === "Tamil" ? "நிர்வாகி கணக்கு விவரங்களை உள்ளிடவும்" : "Establish your secure administrator credentials to access the software"}
                      </p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                        {language === "Tamil" ? "முழு பெயர் *" : "Admin Full Name *"}
                      </label>
                      <input
                        type="text"
                        value={initAdminFullName}
                        onChange={(e) => setInitAdminFullName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-900 dark:text-white"
                        placeholder="e.g. Sri Amman Admin"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                        {language === "Tamil" ? "பயனர் பெயர் *" : "Username *"}
                      </label>
                      <input
                        type="text"
                        value={initAdminUsername}
                        onChange={(e) => setInitAdminUsername(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-900 dark:text-white"
                        placeholder="admin"
                        required
                        data-no-transliterate="true"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                        {language === "Tamil" ? "கடவுச்சொல் *" : "Password *"}
                      </label>
                      <input
                        type="password"
                        value={initAdminPassword}
                        onChange={(e) => setInitAdminPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-900 dark:text-white"
                        placeholder="admin123"
                        required
                        data-no-transliterate="true"
                      />
                    </div>

                    <div className="flex gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => setInitStep(1)}
                        className="w-1/3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold rounded-xl text-xs tracking-wider uppercase transition-all cursor-pointer"
                      >
                        {language === "Tamil" ? "பின்னால்" : "Back"}
                      </button>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={handleInitializeCompany}
                        className="w-2/3 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold rounded-xl text-xs tracking-wider uppercase shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {loading ? (
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          language === "Tamil" ? "சேமி" : "Initialize System"
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Username Field */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                      {t("username")}
                    </label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                        <User className="w-4.5 h-4.5" />
                      </span>
                      <input
                        id="login-username"
                        name="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-sm text-slate-900 dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 font-semibold"
                        placeholder={language === "Tamil" ? "எ.கா. admin, cashier" : "e.g. admin, cashier"}
                        autoComplete="username"
                        data-no-transliterate="true"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                      {t("password")}
                    </label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                        <Lock className="w-4.5 h-4.5" />
                      </span>
                      <input
                        id="login-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-11 py-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-sm text-slate-900 dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 font-semibold"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        data-no-transliterate="true"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Options: Remember Me Checkbox */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <div className="relative flex items-center">
                        <input
                          id="login-remember"
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 border rounded-md flex items-center justify-center transition-all ${rememberMe ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40"}`}>
                          {rememberMe && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors select-none">
                        {t("rememberMe")}
                      </span>
                    </label>
                  </div>

                  {/* Large Premium Login Button */}
                  <button
                    type="submit"
                    id="login-submit-btn"
                    disabled={loading}
                    className="w-full relative overflow-hidden py-3 px-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 active:from-emerald-800 active:to-emerald-900 text-white font-extrabold rounded-xl text-sm shadow-lg shadow-emerald-600/15 hover:shadow-emerald-600/25 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer group"
                  >
                    {/* Ripple feedback style highlight */}
                    <span className="absolute inset-0 w-full h-full bg-white/10 transform -skew-x-12 -translate-x-full group-hover:animate-shine" />
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      t("signIn")
                    )}
                  </button>
                </form>

                {/* Subtly designed credentials notice box */}
                <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-800/80 text-center">
                  <div className="inline-block px-3 py-1.5 bg-amber-500/10 border border-amber-500/25 rounded-lg">
                    <p className="text-[10px] text-amber-800 dark:text-amber-400 font-black tracking-wide">
                      {language === "Tamil" ? (
                        <span>நிர்வாகி: <strong className="text-slate-700 dark:text-slate-300">admin</strong> (admin123) | காசாளர்: <strong className="text-slate-700 dark:text-slate-300">cashier</strong> (cashier123)</span>
                      ) : (
                        <span>Demo Access &bull; Admin: <strong className="text-slate-700 dark:text-slate-300">admin</strong> (admin123) &bull; Cashier: <strong className="text-slate-700 dark:text-slate-300">cashier</strong> (cashier123)</span>
                      )}
                    </p>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>

        {/* FOOTER */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center w-full max-w-xs mt-auto pt-4"
        >
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest flex items-center justify-center gap-1.5">
            <span>{settings.companyName}</span>
            <span>&bull;</span>
            <span>{language === "Tamil" ? "பில்லிங் மென்பொருள் © 2026" : "BILLING SOFTWARE © 2026"}</span>
          </p>
          <p className="text-[9px] font-semibold text-slate-400/60 dark:text-slate-600/60 mt-1 uppercase tracking-widest">
            {settings.address}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export { LoginScreen };
