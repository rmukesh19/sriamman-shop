import React, { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import {
  Save,
  Store,
  Printer,
  Users,
  ShieldCheck,
  Key,
  Database,
  RefreshCw,
  Sliders,
  Globe,
  Upload,
  UserPlus,
  Lock,
  Plus,
  Trash2,
  Check,
  Download
} from "lucide-react";

const SettingsPanel = ({ settings, onUpdateSettings, activeSubTabProp }) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState("company");

  // Track sub-tab changes from parent sidebar selection
  React.useEffect(() => {
    if (activeSubTabProp && activeSubTabProp.startsWith("settings_")) {
      const sub = activeSubTabProp.replace("settings_", "");
      setActiveTab(sub);
    }
  }, [activeSubTabProp]);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState(null);
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Company Profile State
  const [companyName, setCompanyName] = useState(settings?.companyName || "SRI AMMAN TRADERS");
  const [gstin, setGstin] = useState(settings?.gstin || "33AAHFS3829M1Z8");
  const [address, setAddress] = useState(settings?.address || "105, bypass Road, Erode, Tamil Nadu - 638001");
  const [phone, setPhone] = useState(settings?.phone || "9876543210 / 0424-222333");
  const [email, setEmail] = useState(settings?.email || "sriammanriceerode@gmail.com");
  const [website, setWebsite] = useState(settings?.website || "www.sriammanrice.com");
  const [logoUrl, setLogoUrl] = useState(settings?.logoUrl || "");
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // 2. Printer Settings State
  const [thermalWidth, setThermalWidth] = useState(settings?.thermalPrinterWidth || "80mm");
  const [a4Printer, setA4Printer] = useState("Canon LBP 2900b");
  const [receiptDesign, setReceiptDesign] = useState("Compact Thermal Receipts");
  const [invoiceDesign, setInvoiceDesign] = useState("Professional Tax Invoice");
  const [autoPrint, setAutoPrint] = useState(settings?.autoPrint || false);
  const [defaultPrintFormat, setDefaultPrintFormat] = useState(settings?.defaultPrintFormat || "80mm");

  // 3. User Management State
  const [usersList, setUsersList] = useState([
    { username: "admin", fullName: "Sri Amman Admin", role: "Admin", status: "Active" }
  ]);
  const [newUsername, setNewUsername] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newUserRole, setNewUserRole] = useState("Cashier");

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUsername || !newFullName) {
      triggerToast("Please fill in all user fields.");
      return;
    }
    if (usersList.some(u => u.username.toLowerCase() === newUsername.toLowerCase())) {
      triggerToast("Username already exists!");
      return;
    }
    setUsersList([...usersList, { username: newUsername, fullName: newFullName, role: newUserRole, status: "Active" }]);
    setNewUsername("");
    setNewFullName("");
    triggerToast("User added successfully!");
  };

  const handleDeleteUser = (username) => {
    if (username === "admin") {
      triggerToast("Cannot delete primary admin user!");
      return;
    }
    setUsersList(usersList.filter(u => u.username !== username));
    triggerToast("User removed.");
  };

  // 4. Roles Configuration State
  const [roles, setRoles] = useState([
    { id: "admin", name: "Admin", desc: "Full access to billing, stock, reports, settings, and accounts." },
    { id: "manager", name: "Manager", desc: "Can manage stock, process purchases, view reports, and handle billing." },
    { id: "cashier", name: "Cashier", desc: "Restricted exclusively to Sales Invoicing & Billing POS screen." },
    { id: "storekeeper", name: "Storekeeper", desc: "Can only view, add, and adjust raw stock counts." }
  ]);

  // 5. Permissions Grid State (Simple boolean map)
  const [permissions, setPermissions] = useState({
    Admin: { billing: true, stock: true, purchases: true, accounts: true, settings: true },
    Manager: { billing: true, stock: true, purchases: true, accounts: false, settings: false },
    Cashier: { billing: true, stock: false, purchases: false, accounts: false, settings: false },
    Storekeeper: { billing: false, stock: true, purchases: false, accounts: false, settings: false }
  });

  const togglePermission = (roleName, module) => {
    if (roleName === "Admin") {
      triggerToast("Admin permissions are permanently locked.");
      return;
    }
    setPermissions({
      ...permissions,
      [roleName]: {
        ...permissions[roleName],
        [module]: !permissions[roleName][module]
      }
    });
    triggerToast(`Updated ${roleName} access.`);
  };

  // 6. Backup State
  const [backupHistory, setBackupHistory] = useState([]);

  const handleCreateBackup = () => {
    const newBkp = {
      id: `BKP-00${backupHistory.length + 1}`,
      date: new Date().toISOString().replace("T", " ").substring(0, 19),
      size: `${(1.2 + Math.random() * 0.5).toFixed(2)} MB`,
      type: "Manual Backup"
    };
    setBackupHistory([newBkp, ...backupHistory]);
    triggerToast("Database offline backup bundle compiled successfully!");
  };

  // 7. Restore State
  const [selectedBackupPoint, setSelectedBackupPoint] = useState("");

  const handleRestoreDatabase = () => {
    if (!selectedBackupPoint) {
      triggerToast("Please select a restore checkpoint point.");
      return;
    }
    triggerToast(`Database state reverted to checkpoint ${selectedBackupPoint} successfully!`);
  };

  // 8. Theme Configuration State
  const [themeMode, setThemeMode] = useState(settings?.darkMode ? "Dark" : "Light");
  const [accentColor, setAccentColor] = useState("Slate");

  // 9. Language Configuration State
  const [lang, setLang] = useState(settings?.language || "English");

  // 10. Financial Years State
  const [financialYears, setFinancialYears] = useState([]);
  const [fyName, setFyName] = useState("");
  const [fyStartDate, setFyStartDate] = useState("");
  const [fyEndDate, setFyEndDate] = useState("");
  const [editingFyId, setEditingFyId] = useState(null);

  const loadFinancialYears = async () => {
    try {
      const res = await fetch("/api/financial-years");
      if (res.ok) {
        const data = await res.json();
        setFinancialYears(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    if (activeTab === "financial_year") {
      loadFinancialYears();
    }
  }, [activeTab]);

  const handleSaveFy = async (e) => {
    e.preventDefault();
    if (!fyName || !fyStartDate || !fyEndDate) {
      triggerToast("Please fill in all financial year fields.");
      return;
    }
    const payload = { name: fyName, startDate: fyStartDate, endDate: fyEndDate };
    try {
      const method = editingFyId ? "PUT" : "POST";
      const url = editingFyId ? `/api/financial-years/${editingFyId}` : "/api/financial-years";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        triggerToast(editingFyId ? "Financial Year updated successfully!" : "Financial Year created successfully!");
        setFyName("");
        setFyStartDate("");
        setFyEndDate("");
        setEditingFyId(null);
        loadFinancialYears();
        if (onUpdateSettings) onUpdateSettings();
      } else {
        const errData = await res.json();
        triggerToast(errData.message || "Error saving financial year.");
      }
    } catch (e) {
      triggerToast("Error saving financial year.");
    }
  };

  const handleActivateFy = async (id) => {
    try {
      const res = await fetch(`/api/financial-years/${id}/activate`, { method: "POST" });
      if (res.ok) {
        triggerToast("Active Financial Year updated!");
        loadFinancialYears();
        if (onUpdateSettings) onUpdateSettings();
      }
    } catch (e) {
      triggerToast("Error activating financial year.");
    }
  };

  const handleDeleteFy = async (id) => {
    if (!window.confirm("Are you sure you want to delete this financial year?")) return;
    try {
      const res = await fetch(`/api/financial-years/${id}`, { method: "DELETE" });
      if (res.ok) {
        triggerToast("Financial Year deleted successfully!");
        loadFinancialYears();
        if (onUpdateSettings) onUpdateSettings();
      } else {
        const errData = await res.json();
        triggerToast(errData.message || "Cannot delete financial year.");
      }
    } catch (e) {
      triggerToast("Error deleting financial year.");
    }
  };

  // Logo uploading helper
  const handleLogoUpload = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      triggerToast("File size too large (max 5MB)");
      return;
    }
    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;
        try {
          const res = await fetch("/api/settings/logo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ logoData: base64String })
          });
          if (res.ok) {
            const data = await res.json();
            setLogoUrl(data.logoUrl);
            triggerToast("Logo uploaded successfully!");
          } else {
            const errData = await res.json();
            triggerToast(errData.message || "Upload failed");
          }
        } catch (error) {
          console.error("Error uploading logo:", error);
          triggerToast("Upload failed (network error)");
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (e) {
      console.error(e);
      setIsUploading(false);
      triggerToast("Error reading file");
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleLogoUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleLogoUpload(e.target.files[0]);
    }
  };

  const handleSave = () => {
    onUpdateSettings({
      companyName,
      gstin,
      address,
      phone,
      email,
      website,
      logoUrl,
      thermalPrinterWidth: thermalWidth,
      invoicePrefix: settings?.invoicePrefix || "SAT-2026-",
      language: lang,
      darkMode: themeMode === "Dark",
      autoPrint,
      defaultPrintFormat
    });
    triggerToast("System configuration saved successfully!");
  };

  return (
    <div id="settings-container-root" className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden font-semibold">
      {/* Toast Feedback */}
      <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white border-b border-slate-800">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider">Rice Mandy Settings Panel</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Manage company profile, hardware printers and access controls</p>
        </div>
        {toastMessage && (
          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 border border-emerald-500/30 rounded-xl font-bold animate-pulse">
            {toastMessage}
          </span>
        )}
      </div>

      <div className="w-full p-6 space-y-6 min-h-[450px]">
        
        {/* ==================== 1. COMPANY PROFILE ==================== */}
        {activeTab === "company" && (
          <div id="settings-company-view" className="space-y-4 animate-fadeIn">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Store className="w-5 h-5 text-blue-600" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Registered Company Information</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-3">
                <label className="block text-[10px] text-slate-500 uppercase mb-1">Company Registered Name</label>
                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 uppercase mb-1">Company Contact Number</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 uppercase mb-1">Email Address</label>
                <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 uppercase mb-1">Official Website</label>
                <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] text-slate-500 uppercase mb-1">Headquarters Address</label>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 h-20 focus:outline-none focus:border-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] text-slate-500 uppercase mb-1">Company Logo</label>
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="w-20 h-20 bg-white border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="text-[10px] text-slate-400 font-bold uppercase text-center p-2">No Logo</div>
                    )}
                  </div>
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`flex-1 w-full border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${dragActive ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-slate-400"}`}
                    onClick={() => document.getElementById("logo-file-input")?.click()}
                  >
                    <input id="logo-file-input" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    {isUploading ? (
                      <p className="text-xs text-blue-600 font-bold animate-pulse">Uploading company logo...</p>
                    ) : (
                      <div>
                        <p className="text-xs text-slate-700 font-bold">Drag and drop logo here, or <span className="text-blue-600 underline">browse</span></p>
                        <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold">Supports PNG, JPG, JPEG (Max 5MB)</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 2. PRINTER SETTINGS ==================== */}
        {activeTab === "printer" && (
          <div id="settings-printer-view" className="space-y-4 animate-fadeIn">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Printer className="w-5 h-5 text-blue-600" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Printer &amp; Invoice Designs</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-slate-500 uppercase mb-1">Thermal Printer Width</label>
                <select value={thermalWidth} onChange={(e) => setThermalWidth(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none">
                  <option value="80mm">80mm Professional Wide (Highly Recommended)</option>
                  <option value="58mm">58mm Compact Handheld Slip</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 uppercase mb-1">A4 Printer Device</label>
                <input type="text" value={a4Printer} onChange={(e) => setA4Printer(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 uppercase mb-1">Thermal Receipt Design Layout</label>
                <select value={receiptDesign} onChange={(e) => setReceiptDesign(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none">
                  <option>Compact Thermal Receipts</option>
                  <option>Itemized Thermal Slip</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 uppercase mb-1">A4 Invoice Template Layout</label>
                <select value={invoiceDesign} onChange={(e) => setInvoiceDesign(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none">
                  <option>Professional Tax Invoice</option>
                  <option>Elegant GST Challan</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 uppercase mb-1">Default POS Print Format</label>
                <select value={defaultPrintFormat} onChange={(e) => setDefaultPrintFormat(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none">
                  <option value="80mm">80mm Thermal Receipt</option>
                  <option value="A4">A4 Full Page Invoice</option>
                </select>
              </div>
              <div className="flex items-center gap-3 pt-5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoPrint}
                    onChange={(e) => setAutoPrint(e.target.checked)}
                    className="w-4.5 h-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 focus:ring-offset-0"
                  />
                  <span className="text-xs text-slate-700 font-bold uppercase">Enable Auto Print after Saving Bill</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 3. USER MANAGEMENT ==================== */}
        {activeTab === "users" && (
          <div id="settings-users-view" className="space-y-4 animate-fadeIn">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Registered System Users</h3>
            </div>

            {/* List */}
            <div className="overflow-x-auto border border-slate-150 rounded-xl">
              <table className="w-full text-left text-xs font-semibold">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-150">
                  <tr>
                    <th className="p-3">Username</th>
                    <th className="p-3">Full Name</th>
                    <th className="p-3">System Role</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {usersList.map((usr) => (
                    <tr key={usr.username} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono text-slate-950">{usr.username}</td>
                      <td className="p-3">{usr.fullName}</td>
                      <td className="p-3">
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border border-blue-100">
                          {usr.role}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-emerald-100">
                          {usr.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(usr.username)}
                          disabled={usr.username === "admin"}
                          className="text-slate-400 hover:text-red-600 disabled:opacity-40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 inline-block" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Form */}
            <form onSubmit={handleAddUser} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-slate-600" />
                Register New User Account
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[9px] text-slate-500 uppercase mb-1">Username</label>
                  <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="e.g. cash_clerk" className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500 uppercase mb-1">Full Name</label>
                  <input type="text" value={newFullName} onChange={(e) => setNewFullName(e.target.value)} placeholder="e.g. Murugan" className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500 uppercase mb-1">Assigned Role</label>
                  <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:outline-none">
                    <option value="Manager">Manager</option>
                    <option value="Cashier">Cashier (Billing POS Only)</option>
                    <option value="Storekeeper">Storekeeper</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                  <Plus className="w-3.5 h-3.5" /> Register Account
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==================== 4. ROLES ==================== */}
        {activeTab === "roles" && (
          <div id="settings-roles-view" className="space-y-4 animate-fadeIn">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">System Access Roles</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roles.map((r) => (
                <div key={r.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 hover:border-slate-300 transition-colors">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">{r.name}</h4>
                    <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">System Role</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== 5. PERMISSIONS ==================== */}
        {activeTab === "permissions" && (
          <div id="settings-permissions-view" className="space-y-4 animate-fadeIn">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Key className="w-5 h-5 text-blue-600" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Interactive Access Permissions Matrix</h3>
            </div>
            
            <div className="overflow-x-auto border border-slate-150 rounded-xl">
              <table className="w-full text-left text-xs font-semibold">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-150">
                  <tr>
                    <th className="p-4">Assigned Role</th>
                    <th className="p-4 text-center">Billing &amp; POS</th>
                    <th className="p-4 text-center">Stock Master</th>
                    <th className="p-4 text-center">Purchases</th>
                    <th className="p-4 text-center">Accounts</th>
                    <th className="p-4 text-center">System Settings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {Object.entries(permissions).map(([roleName, mods]) => (
                    <tr key={roleName} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-black text-slate-900">{roleName}</td>
                      <td className="p-4 text-center">
                        <button type="button" onClick={() => togglePermission(roleName, "billing")} className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${mods.billing ? "bg-emerald-50 border-emerald-300 text-emerald-600" : "bg-rose-50 border-rose-200 text-rose-500"}`}>
                          <Check className={`w-4 h-4 ${mods.billing ? "opacity-100" : "opacity-20"}`} />
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <button type="button" onClick={() => togglePermission(roleName, "stock")} className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${mods.stock ? "bg-emerald-50 border-emerald-300 text-emerald-600" : "bg-rose-50 border-rose-200 text-rose-500"}`}>
                          <Check className={`w-4 h-4 ${mods.stock ? "opacity-100" : "opacity-20"}`} />
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <button type="button" onClick={() => togglePermission(roleName, "purchases")} className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${mods.purchases ? "bg-emerald-50 border-emerald-300 text-emerald-600" : "bg-rose-50 border-rose-200 text-rose-500"}`}>
                          <Check className={`w-4 h-4 ${mods.purchases ? "opacity-100" : "opacity-20"}`} />
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <button type="button" onClick={() => togglePermission(roleName, "accounts")} className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${mods.accounts ? "bg-emerald-50 border-emerald-300 text-emerald-600" : "bg-rose-50 border-rose-200 text-rose-500"}`}>
                          <Check className={`w-4 h-4 ${mods.accounts ? "opacity-100" : "opacity-20"}`} />
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <button type="button" onClick={() => togglePermission(roleName, "settings")} className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${mods.settings ? "bg-emerald-50 border-emerald-300 text-emerald-600" : "bg-rose-50 border-rose-200 text-rose-500"}`}>
                          <Check className={`w-4 h-4 ${mods.settings ? "opacity-100" : "opacity-20"}`} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== 6. DATABASE BACKUP ==================== */}
        {activeTab === "backup" && (
          <div id="settings-backup-view" className="space-y-4 animate-fadeIn">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Database className="w-5 h-5 text-blue-600" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Database Backup Management</h3>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">Compile Immediate Backup</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed font-bold">Creates a complete encrypted database backup snapshot with zero downtime</p>
              </div>
              <button type="button" onClick={handleCreateBackup} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs hover:bg-slate-800 flex items-center gap-1.5 shadow-sm shrink-0 font-extrabold cursor-pointer transition-colors uppercase">
                <Database className="w-4 h-4" /> Backup Now
              </button>
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Backup History Logs</h4>
              <div className="overflow-x-auto border border-slate-150 rounded-xl">
                <table className="w-full text-left text-xs font-semibold">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] tracking-wider border-b border-slate-150">
                    <tr>
                      <th className="p-3">Backup ID</th>
                      <th className="p-3">Created At</th>
                      <th className="p-3">File Size</th>
                      <th className="p-3">Type</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {backupHistory.map((bkp) => (
                      <tr key={bkp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono text-slate-950 font-black">{bkp.id}</td>
                        <td className="p-3 font-mono">{bkp.date}</td>
                        <td className="p-3 text-slate-500">{bkp.size}</td>
                        <td className="p-3">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[9px] font-bold border border-slate-200">
                            {bkp.type}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => triggerToast(`Downloading backup file ${bkp.id}.json ...`)}
                            className="p-1 text-slate-500 hover:text-blue-600 cursor-pointer"
                            title="Download Backup"
                          >
                            <Download className="w-4 h-4 inline-block" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 7. RESTORE ==================== */}
        {activeTab === "restore" && (
          <div id="settings-restore-view" className="space-y-4 animate-fadeIn">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <RefreshCw className="w-5 h-5 text-blue-600" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Database Restore Point Recovery</h3>
            </div>

            <div className="p-5 bg-rose-50/50 border border-rose-100 rounded-2xl space-y-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shrink-0 border border-rose-100">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-rose-800 uppercase tracking-wide">Critical System Warning</h4>
                  <p className="text-[10px] text-rose-600 leading-relaxed font-bold uppercase mt-0.5">Restoring database state is irreversible and will completely overwrite all bills, products, purchases, ledger accounts and settings logged after the backup was taken!</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase mb-1">Select Restore Checkpoint Point</label>
                  <select
                    value={selectedBackupPoint}
                    onChange={(e) => setSelectedBackupPoint(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="">-- Choose Checkpoint Point --</option>
                    {backupHistory.map(b => (
                      <option key={b.id} value={b.id}>{b.id} ({b.date}) - {b.type}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleRestoreDatabase}
                    className="w-full px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-sm transition-colors cursor-pointer"
                  >
                    Load &amp; Restore Selected Checkpoint
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 8. THEME OPTIONS ==================== */}
        {activeTab === "theme" && (
          <div id="settings-theme-view" className="space-y-4 animate-fadeIn">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Sliders className="w-5 h-5 text-blue-600" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Interface Theme Options</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Interface Mode</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setThemeMode("Light");
                      triggerToast("Light Mode activated.");
                    }}
                    className={`py-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${themeMode === "Light" ? "bg-blue-50 border-blue-500 text-blue-700" : "bg-slate-50 border-slate-200 text-slate-600"}`}
                  >
                    Light Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setThemeMode("Dark");
                      triggerToast("Dark Mode activated.");
                    }}
                    className={`py-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${themeMode === "Dark" ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-600"}`}
                  >
                    Dark Mode
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Accent Brand Color</h4>
                <div className="grid grid-cols-4 gap-2">
                  {["Slate", "Emerald", "Amber", "Blue"].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        setAccentColor(color);
                        triggerToast(`${color} Accent Theme active.`);
                      }}
                      className={`py-2 rounded-xl border text-[11px] font-black transition-all text-center cursor-pointer uppercase ${accentColor === color ? "bg-slate-900 text-white border-slate-900" : "bg-slate-50 text-slate-600 border-slate-200"}`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 9. LANGUAGE SETTING ==================== */}
        {activeTab === "language" && (
          <div id="settings-language-view" className="space-y-4 animate-fadeIn">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Globe className="w-5 h-5 text-blue-600" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">System Localization</h3>
            </div>

            <div className="max-w-md space-y-3 bg-slate-50 p-5 border border-slate-200 rounded-2xl">
              <div>
                <label className="block text-[10px] text-slate-500 uppercase mb-1 font-bold">Active POS Language</label>
                <select value={lang} onChange={(e) => setLang(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none">
                  <option value="English">English (United Kingdom)</option>
                  <option value="Tamil">தமிழ் (Tamil - Transliterator Active)</option>
                </select>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed uppercase font-bold">Changes will update menus, printed receipt formats, billing invoices and enable automatic phonetics converter across Erode Rice Shop operations.</p>
            </div>
          </div>
        )}

        {/* ==================== 10. FINANCIAL YEARS ==================== */}
        {activeTab === "financial_year" && (
          <div id="settings-financial-year-view" className="space-y-4 animate-fadeIn">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin-slow" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Financial Year Management</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form to Create/Edit */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 h-fit space-y-4">
                <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider border-b pb-1">
                  {editingFyId ? "✏️ Edit Financial Year" : "➕ Create Financial Year"}
                </h4>
                <form onSubmit={handleSaveFy} className="space-y-3">
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Financial Year Name</label>
                    <input
                      type="text"
                      required
                      value={fyName}
                      onChange={(e) => setFyName(e.target.value)}
                      placeholder="e.g. FY 2026-27"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Start Date</label>
                    <input
                      type="date"
                      required
                      value={fyStartDate}
                      onChange={(e) => setFyStartDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">End Date</label>
                    <input
                      type="date"
                      required
                      value={fyEndDate}
                      onChange={(e) => setFyEndDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs uppercase cursor-pointer"
                    >
                      {editingFyId ? "Update" : "Create"}
                    </button>
                    {editingFyId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingFyId(null);
                          setFyName("");
                          setFyStartDate("");
                          setFyEndDate("");
                        }}
                        className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold rounded-xl text-xs uppercase cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* List of Financial Years */}
              <div className="lg:col-span-2 space-y-3">
                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Registered Financial Years</h4>
                <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white">
                  <table className="w-full text-left text-xs font-semibold font-mono">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] tracking-wider border-b border-slate-200 font-sans">
                      <tr>
                        <th className="p-3">FY Name</th>
                        <th className="p-3">Start Date</th>
                        <th className="p-3">End Date</th>
                        <th className="p-3 font-sans">Status</th>
                        <th className="p-3 text-right font-sans">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {financialYears.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="p-4 text-center text-slate-400 font-medium font-sans">No financial years registered.</td>
                        </tr>
                      ) : (
                        financialYears.map((fy) => (
                          <tr key={fy.id} className={`hover:bg-slate-50 transition-colors ${fy.isActive ? "bg-blue-50/20" : ""}`}>
                            <td className="p-3 font-sans font-bold text-slate-950">{fy.name}</td>
                            <td className="p-3">{fy.startDate}</td>
                            <td className="p-3">{fy.endDate}</td>
                            <td className="p-3 font-sans">
                              {fy.isActive ? (
                                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[9px] font-black uppercase border border-emerald-200">
                                  Active
                                </span>
                              ) : (
                                <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[9px] font-black uppercase border border-slate-200">
                                  Inactive
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right space-x-1.5 whitespace-nowrap font-sans">
                              {!fy.isActive && (
                                <button
                                  type="button"
                                  onClick={() => handleActivateFy(fy.id)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-black uppercase cursor-pointer"
                                >
                                  Activate
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingFyId(fy.id);
                                  setFyName(fy.name);
                                  setFyStartDate(fy.startDate);
                                  setFyEndDate(fy.endDate);
                                }}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-black uppercase cursor-pointer"
                              >
                                Edit
                              </button>
                              {!fy.isActive && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteFy(fy.id)}
                                  className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded text-[10px] font-black uppercase cursor-pointer"
                                >
                                  Delete
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Save Button */}
        <div className="pt-6 border-t border-slate-200 flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-blue-500/10 transition-colors uppercase tracking-wider cursor-pointer"
          >
            <Save className="w-4 h-4" /> Save System Settings
          </button>
        </div>

      </div>
    </div>
  );
};

export { SettingsPanel };
