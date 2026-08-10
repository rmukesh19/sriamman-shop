import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LanguageProvider, useLanguage } from "./contexts/LanguageContext.jsx";
import { LoginScreen } from "./components/LoginScreen.jsx";
import { Dashboard } from "./components/Dashboard.jsx";
import { BillingPOS } from "./components/BillingPOS.jsx";
import { ReceiptPrint } from "./components/ReceiptPrint.jsx";
import { Masters } from "./components/Masters.jsx";
import { AccountsModule } from "./components/AccountsModule.jsx";
import { SettingsPanel } from "./components/SettingsPanel.jsx";
import { PurchaseModule } from "./components/PurchaseModule.jsx";
import { InventoryModule } from "./components/InventoryModule.jsx";
import { ReportsModule } from "./components/ReportsModule.jsx";
import { EmployeeModule } from "./components/EmployeeModule.jsx";
import { transliterateSentence } from "./utils/tamilTransliterator.js";
import { 
  getQueuedMutations 
} from "./utils/offlineDb.js";
import { 
  syncOfflineMutations, 
  testOnlineStatus 
} from "./utils/offlineInterceptor.js";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  FileText,
  Settings,
  LogOut,
  Wifi,
  WifiOff,
  RefreshCw,
  Store,
  ChevronRight,
  ChevronDown,
  Database,
  Truck,
  Layers,
  Coins,
  Landmark,
  FolderTree,
  ClipboardList,
  User,
  Search,
  Menu,
  X,
  Tag,
  Sparkles,
  Percent,
  Sliders,
  ArrowRightLeft,
  UserCheck,
  Calendar,
  CreditCard,
  Award,
  FileDown,
  Image,
  Printer,
  Receipt,
  Globe,
  ShieldCheck,
  Key,
  MessageSquare,
  Smartphone,
  Mail,
  Plus,
  ArrowUpRight,
  PlusCircle
} from "lucide-react";
function MainAppShell() {
  const { t, language, setLanguage } = useLanguage();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({
    masters: false,
    purchase: false,
    inventory: false,
    accounts: false,
    employee: false,
    reports: false
  });
  const [openFolders, setOpenFolders] = useState({
    accounts_ledger: true,
    accounts_voucher: true,
    accounts_accountbook: true
  });
  const [toastMessage, setToastMessage] = useState(null);
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3e3);
  };
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [bills, setBills] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [purchaseReturns, setPurchaseReturns] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [accountsGroups, setAccountsGroups] = useState([]);
  const [accountsLedgers, setAccountsLedgers] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [trialBalance, setTrialBalance] = useState(null);
  const [companySettings, setCompanySettings] = useState({
    companyName: "SRI AMMAN TRADERS",
    gstin: "33AAHFS3829M1Z8",
    address: "105, bypass Road, Erode, Tamil Nadu - 638001",
    phone: "9876543210 / 0424-222333",
    email: "sriammanriceerode@gmail.com",
    thermalPrinterWidth: "80mm",
    invoicePrefix: "SAT-2026-",
    language: "English"
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [syncingNow, setSyncingNow] = useState(false);
  const [holdBills, setHoldBills] = useState([]);
  const [tamilTypingEnabled, setTamilTypingEnabled] = useState(() => {
    const saved = localStorage.getItem("sri_amman_tamil_typing");
    if (saved === null) return true; // Default to true!
    return saved === "true";
  });
  useEffect(() => {
    localStorage.setItem("sri_amman_tamil_typing", String(tamilTypingEnabled));
  }, [tamilTypingEnabled]);
  useEffect(() => {
    if (!tamilTypingEnabled) return;
    
    const isTargetBanned = (target) => {
      if (!target) return true;
      const inputType = (target.type || "").toLowerCase();
      const isTextInput = target.tagName === "TEXTAREA" || ["text", "search", "url", ""].includes(inputType);
      if (!isTextInput) return true;

      const lowerId = (target.id || "").toLowerCase();
      const lowerName = (target.name || "").toLowerCase();
      const lowerPlaceholder = (target.placeholder || "").toLowerCase();
      return (
        lowerId.includes("email") || lowerName.includes("email") ||
        lowerId.includes("mobile") || lowerName.includes("mobile") || lowerId.includes("phone") || lowerName.includes("phone") ||
        lowerId.includes("gst") || lowerName.includes("gst") || lowerPlaceholder.includes("gst") ||
        lowerId.includes("barcode") || lowerName.includes("barcode") || lowerPlaceholder.includes("barcode") ||
        lowerId.includes("hsn") || lowerName.includes("hsn") || lowerPlaceholder.includes("hsn") ||
        lowerId.includes("username") || lowerName.includes("username") ||
        lowerId.includes("password") || lowerName.includes("password") ||
        target.type === "password" || target.type === "email" || target.type === "tel" ||
        target.type === "number" ||
        target.getAttribute("data-no-transliterate") === "true"
      );
    };

    const handleInput = (e) => {
      const target = e.target;
      if (!target || target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") return;
      const inputType = target.type || "";
      const isTextInput = target.tagName === "TEXTAREA" || ["text", "search", "url", ""].includes(inputType.toLowerCase());
      if (!isTextInput) return;
      if (isTargetBanned(target)) return;

      if (target._processingTamil) return;
      const originalVal = target.value;
      if (!originalVal) return;
      
      const translatedVal = transliterateSentence(originalVal);
      if (translatedVal !== originalVal) {
        target._processingTamil = true;
        let cursorStart = 0;
        try {
          cursorStart = target.selectionStart || 0;
        } catch (err) {}
        
        const prototype = target.tagName === "INPUT" ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
        const nativeValueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
        if (nativeValueSetter) {
          nativeValueSetter.call(target, translatedVal);
        } else {
          target.value = translatedVal;
        }
        
        try {
          const diff = translatedVal.length - originalVal.length;
          target.setSelectionRange(cursorStart + diff, cursorStart + diff);
        } catch (err) {}
        
        target.dispatchEvent(new Event("input", { bubbles: true }));
        target._processingTamil = false;
      }
    };

    const handleBlur = (e) => {
      const target = e.target;
      if (!target || (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA")) return;
      if (isTargetBanned(target)) return;

      const originalVal = target.value;
      if (!originalVal) return;

      const newVal = transliterateSentence(originalVal);

      if (newVal !== originalVal) {
        const prototype = target.tagName === "INPUT" ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
        const nativeValueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
        if (nativeValueSetter) {
          nativeValueSetter.call(target, newVal);
        } else {
          target.value = newVal;
        }
        target.dispatchEvent(new Event("input", { bubbles: true }));
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Enter" || e.key === "Tab") {
        handleBlur(e);
      }
    };

    document.addEventListener("input", handleInput, true);
    document.addEventListener("blur", handleBlur, true);
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("input", handleInput, true);
      document.removeEventListener("blur", handleBlur, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [tamilTypingEnabled]);
  const [activePrintBill, setActivePrintBill] = useState(null);
  useEffect(() => {
    const savedUser = localStorage.getItem("sri_amman_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        localStorage.removeItem("sri_amman_user");
      }
    }

    const checkConnection = async () => {
      const online = await testOnlineStatus();
      setIsOnline(online);
    };
    checkConnection();
    const interval = setInterval(checkConnection, 10000); // Check status every 10 seconds

    window.addEventListener("online", checkConnection);
    window.addEventListener("offline", checkConnection);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("online", checkConnection);
      window.removeEventListener("offline", checkConnection);
    };
  }, []);

  useEffect(() => {
    if (user) {
      loadAllData();
      checkOfflineQueue();
    }
  }, [user]);

  useEffect(() => {
    if (isOnline && user) {
      syncData();
    }
  }, [isOnline, user]);

  const checkOfflineQueue = async () => {
    try {
      const queue = await getQueuedMutations();
      setPendingSyncCount(queue.length);
    } catch (err) {
      console.error("Failed to read offline queue from IndexedDB", err);
    }
  };

  const loadAllData = async () => {
    try {
      const [pRes, cRes, sRes, bRes, purRes, prRes, adjRes, lRes, expRes, incRes, statsRes, trialRes, setRes, groupsRes, ledgersRes, vouchersRes] = await Promise.all([
        fetch("/api/products").then((r) => r.json()),
        fetch("/api/customers").then((r) => r.json()),
        fetch("/api/suppliers").then((r) => r.json()),
        fetch("/api/bills").then((r) => r.json()),
        fetch("/api/purchases").then((r) => r.json()),
        fetch("/api/purchase-returns").then((r) => r.json()),
        fetch("/api/inventory/adjustments").then((r) => r.json()),
        fetch("/api/accounts/ledger").then((r) => r.json()),
        fetch("/api/expenses").then((r) => r.json()),
        fetch("/api/incomes").then((r) => r.json()),
        fetch("/api/dashboard/stats").then((r) => r.json()),
        fetch("/api/accounts/trial-balance").then((r) => r.json()),
        fetch("/api/settings").then((r) => r.json()),
        fetch("/api/accounts/groups").then((r) => r.json()),
        fetch("/api/accounts/ledgers").then((r) => r.json()),
        fetch("/api/accounts/vouchers").then((r) => r.json())
      ]);
      setProducts(Array.isArray(pRes) ? pRes : []);
      setCustomers(Array.isArray(cRes) ? cRes : []);
      setSuppliers(Array.isArray(sRes) ? sRes : []);
      setBills(Array.isArray(bRes) ? bRes : []);
      setPurchases(Array.isArray(purRes) ? purRes : []);
      setPurchaseReturns(Array.isArray(prRes) ? prRes : []);
      setAdjustments(Array.isArray(adjRes) ? adjRes : []);
      setLedger(Array.isArray(lRes) ? lRes : []);
      setExpenses(Array.isArray(expRes) ? expRes : []);
      setIncomes(Array.isArray(incRes) ? incRes : []);
      setDashboardStats(statsRes);
      setTrialBalance(trialRes);
      setCompanySettings(setRes || {});
      setAccountsGroups(Array.isArray(groupsRes) ? groupsRes : []);
      setAccountsLedgers(Array.isArray(ledgersRes) ? ledgersRes : []);
      setVouchers(Array.isArray(vouchersRes) ? vouchersRes : []);
    } catch (err) {
      console.error("Error loading all data", err);
    }
  };

  const syncData = async () => {
    if (syncingNow) return;
    setSyncingNow(true);
    try {
      const success = await syncOfflineMutations();
      if (success) {
        await checkOfflineQueue();
        await loadAllData();
      }
    } catch (err) {
      console.error("Data synchronization failed:", err);
    } finally {
      setSyncingNow(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("sri_amman_user");
    localStorage.removeItem("sri_amman_token");
    setUser(null);
  };

  const handleAddProduct = async (product) => {
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product)
      });
      if (res.ok) {
        await loadAllData();
        await checkOfflineQueue();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProduct = async (id, product) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product)
      });
      if (res.ok) {
        await loadAllData();
        await checkOfflineQueue();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        await loadAllData();
        await checkOfflineQueue();
        triggerToast("Product successfully inactivated.");
        return { success: true };
      } else {
        triggerToast(data.message || "Failed to delete product.");
        return { success: false, message: data.message };
      }
    } catch (err) {
      console.error(err);
      triggerToast("Network error when deleting product.");
      return { success: false, message: "Network error when deleting product." };
    }
  };

  const handleAddCustomer = async (cust) => {
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cust)
      });
      if (res.ok) {
        await loadAllData();
        await checkOfflineQueue();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateCustomer = async (id, cust) => {
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cust)
      });
      if (res.ok) {
        await loadAllData();
        await checkOfflineQueue();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCustomer = async (id) => {
    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        await loadAllData();
        await checkOfflineQueue();
        triggerToast("Customer successfully inactivated.");
        return { success: true };
      } else {
        triggerToast(data.message || "Failed to delete customer.");
        return { success: false, message: data.message };
      }
    } catch (err) {
      console.error(err);
      triggerToast("Network error when deleting customer.");
      return { success: false, message: "Network error when deleting customer." };
    }
  };

  const handleAddSupplier = async (supp) => {
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supp)
      });
      if (res.ok) {
        await loadAllData();
        await checkOfflineQueue();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSupplier = async (id, supp) => {
    try {
      const res = await fetch(`/api/suppliers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supp)
      });
      if (res.ok) {
        await loadAllData();
        await checkOfflineQueue();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSupplier = async (id) => {
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        await loadAllData();
        await checkOfflineQueue();
        triggerToast("Supplier successfully inactivated.");
        return { success: true };
      } else {
        triggerToast(data.message || "Failed to delete supplier.");
        return { success: false, message: data.message };
      }
    } catch (err) {
      console.error(err);
      triggerToast("Network error when deleting supplier.");
      return { success: false, message: "Network error when deleting supplier." };
    }
  };

  const handleAddAdjustment = async (adj) => {
    try {
      const res = await fetch("/api/inventory/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adj)
      });
      if (res.ok) {
        await loadAllData();
        await checkOfflineQueue();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveBill = async (bill) => {
    try {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bill)
      });
      if (res.ok) {
        const data = await res.json();
        setActivePrintBill(data.bill);
        await loadAllData();
        await checkOfflineQueue();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleHoldBill = (bill) => {
    setHoldBills([...holdBills, bill]);
  };

  const handleResumeBill = (billId) => {
    setHoldBills(holdBills.filter((b) => b.id !== billId));
  };

  const handleUpdateSettings = async (newSettings) => {
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings)
      });
      if (res.ok) {
        await loadAllData();
        await checkOfflineQueue();
      }
    } catch (err) {
      console.error(err);
    }
  };
  const hasPermission = (perm) => {
    if (!user || !user.permissions || user.permissions.length === 0) return true;
    return user.permissions.includes(perm);
  };
  const sidebarStructure = [
    {
      id: "dashboard",
      label: t("dashboard") || "Dashboard",
      icon: LayoutDashboard,
      permission: "dashboard"
    },
    {
      id: "billing",
      label: t("billing") || "Billing POS",
      icon: ShoppingCart,
      permission: "billing"
    },
    {
      id: "masters",
      label: "Master Directory",
      icon: Database,
      permission: "master",
      subItems: [
        { id: "masters_products", label: "Rice Products", icon: Package },
        { id: "masters_customers", label: "Customers", icon: User },
        { id: "masters_suppliers", label: "Suppliers", icon: Truck },
        { id: "masters_godowns", label: "Godowns / Stock Room", icon: Store }
      ]
    },
    {
      id: "purchase",
      label: "Purchases",
      icon: Truck,
      permission: "purchase",
      subItems: [
        { id: "purchase_entry", label: "Purchase Entry", icon: Plus },
        { id: "purchase_return", label: "Purchase Return", icon: RefreshCw },
        { id: "purchase_payment", label: "Supplier Payment", icon: Coins }
      ]
    },
    {
      id: "inventory",
      label: "Inventory",
      icon: Layers,
      permission: "inventory",
      subItems: [
        { id: "inventory_entry", label: "Stock Entry", icon: Plus },
        { id: "inventory_adjustment", label: "Stock Adjustment", icon: Sliders },
        { id: "inventory_warehouse", label: "Warehouse Stock", icon: Store }
      ]
    },
    {
      id: "accounts",
      label: "Accounts",
      icon: Coins,
      permission: "accounts",
      subItems: [
        { id: "accounts_ledger_master", label: "Ledger Master", icon: FolderTree },
        { id: "accounts_income_entry", label: "Income Entry", icon: TrendingUp },
        { id: "accounts_expense_entry", label: "Expense Entry", icon: FileText },
        { id: "accounts_cashbook", label: "Cash Book", icon: Coins },
        { id: "accounts_bankbook", label: "Bank Book", icon: Landmark },
        { id: "accounts_customer_ledger", label: "Customer Ledger", icon: User },
        { id: "accounts_supplier_ledger", label: "Supplier Ledger", icon: Truck },
        { id: "accounts_outstanding", label: "Outstanding", icon: Layers }
      ]
    },
    {
      id: "employee",
      label: "Employee Hub",
      icon: Users,
      permission: "employee",
      subItems: [
        { id: "employee_dashboard", label: "Employee Dashboard", icon: LayoutDashboard },
        { id: "employee_list", label: "Employee List", icon: Users },
        { id: "employee_attendance", label: "Attendance", icon: UserCheck },
        { id: "employee_payroll", label: "Salary", icon: CreditCard }
      ]
    },
    {
      id: "reports",
      label: "Reports",
      icon: FileText,
      permission: "reports",
      subItems: [
        { id: "reports_sales", label: "Sales Report", icon: FileText },
        { id: "reports_daily", label: "Daily Sales Report", icon: FileText },
        { id: "reports_monthly", label: "Monthly Sales Report", icon: FileText },
        { id: "reports_purchase", label: "Purchase Report", icon: FileText },
        { id: "reports_stock", label: "Stock Valuation", icon: FileText },
        { id: "reports_customer", label: "Customer Report", icon: FileText },
        { id: "reports_supplier", label: "Supplier Report", icon: FileText },
        { id: "reports_outstanding", label: "Outstanding Report", icon: FileText },
        { id: "reports_bank", label: "Bank & Passbook Report", icon: Landmark },
        { id: "reports_profit", label: "Profit & Loss", icon: TrendingUp }
      ]
    },
    {
      id: "settings",
      label: t("settings") || "Settings Panel",
      icon: Settings,
      permission: "settings",
      subItems: [
        { id: "settings_company", label: "Company Profile", icon: Store },
        { id: "settings_printer", label: "Printer Settings", icon: Printer },
        { id: "settings_users", label: "User Management", icon: Users }
      ]
    }
  ];
  useEffect(() => {
    if (activeTab) {
      const parentId = activeTab.split("_")[0];
      if (parentId && parentId !== activeTab) {
        setOpenMenus((prev) => ({ ...prev, [parentId]: true }));
      }
      if (activeTab.startsWith("accounts_ledger_")) {
        setOpenFolders((prev) => ({ ...prev, accounts_ledger: true }));
      } else if (activeTab.startsWith("accounts_voucher_")) {
        setOpenFolders((prev) => ({ ...prev, accounts_voucher: true }));
      } else if (activeTab.startsWith("accounts_cashbook") || activeTab.startsWith("accounts_bankbook") || activeTab.startsWith("accounts_ledgerbook")) {
        setOpenFolders((prev) => ({ ...prev, accounts_accountbook: true }));
      }
    }
  }, [activeTab]);
  const getSidebarLabel = (itemId, defaultLabel) => {
    const getL = (en, ta) => {
      if (language === "Both" || language === "Dual") return `${en} / ${ta}`;
      return language === "Tamil" ? ta : en;
    };

    switch (itemId) {
      case "dashboard":
        return t("dashboard") || getL("Dashboard", "முகப்பு");
      case "billing":
        return t("billing") || getL("Billing POS", "பிஓஎஸ் பில்லிங்");
      case "masters":
        return getL("Master Directory", "முதன்மை கோப்பகம்");
      case "masters_categories":
        return getL("Categories", "பிரிவுகள்");
      case "masters_brands":
        return getL("Brands", "பிராண்டுகள்");
      case "masters_units":
        return getL("Units & Packing", "அலகுகள் மற்றும் பேக்கிங்");
      case "masters_products":
        return t("products") || getL("Product Master", "அரிசி விவரம்");
      case "masters_customers":
        return getL("Customer", "வாடிக்கையாளர்");
      case "masters_suppliers":
        return getL("Supplier", "சப்ளையர்");
      case "masters_godowns":
        return getL("Godowns / Locations", "கிடங்குகள் / இடங்கள்");
      case "masters_gst":
        return getL("GST & HSN Structure", "ஜிஎஸ்டி மற்றும் எச்எஸ்என்");
      case "purchase":
        return t("purchase") || getL("Purchases", "கொள்முதல்");
      case "purchase_entry":
        return t("purchaseEntry") || getL("Purchase Entry", "கொள்முதல் பதிவு");
      case "purchase_return":
        return getL("Purchase Return", "கொள்முதல் திரும்ப பெறல்");
      case "purchase_order":
        return getL("Purchase Order", "கொள்முதல் ஆணை");
      case "purchase_payment":
        return t("supplierPayment") || getL("Supplier Payment", "சப்ளையர் பணம் செலுத்துதல்");
      case "inventory":
        return t("inventory") || getL("Inventory", "இருப்பு");
      case "inventory_opening":
        return getL("Opening Stock", "தொடக்க இருப்பு");
      case "inventory_entry":
        return t("stockEntry") || getL("Stock Entry", "சரக்கு பதிவு");
      case "inventory_adjustment":
        return t("stockAdjustment") || getL("Stock Adjustment", "இருப்பு சரிசெய்தல்");
      case "inventory_transfer":
        return t("stockTransfer") || getL("Stock Transfer", "இருப்பு மாற்றம்");
      case "inventory_warehouse":
        return getL("Warehouse Stock", "கிடங்கு சரக்கு");
      case "inventory_report":
        return getL("Stock Ledger Report", "இருப்புப் பேரேட்டு அறிக்கை");
      case "accounts":
        return t("accounts") || getL("Accounts", "கணக்குகள்");
      case "accounts_dashboard":
        return getL("Dashboard", "கணக்குகள் முகப்புப்பலகை");
      case "accounts_ledger":
        return getL("Ledger", "பேரேடு");
      case "accounts_ledger_groups":
        return getL("Ledger Groups", "பேரேடு குழுக்கள்");
      case "accounts_ledger_master":
        return getL("Ledger Master", "பேரேடு முதன்மை");
      case "accounts_ledger_list":
        return getL("Ledger List", "பேரேடு பட்டியல்");
      case "accounts_voucher":
        return getL("Voucher", "வவுச்சர்");
      case "accounts_voucher_payment":
        return getL("Payment Voucher", "செலுத்துதல் வவுச்சர்");
      case "accounts_voucher_receipt":
        return getL("Receipt Voucher", "பெறுதல் வவுச்சர்");
      case "accounts_voucher_contra":
        return getL("Contra Voucher", "எதிர் வவுச்சர்");
      case "accounts_voucher_journal":
        return getL("Journal Voucher", "குறிப்பேடு வவுச்சர்");
      case "accounts_daybook":
        return getL("Day Book", "நாள் புத்தகம்");
      case "accounts_accountbook":
        return getL("Account Book", "கணக்கு புத்தகம்");
      case "accounts_cashbook":
        return getL("Cash Book", "ரோக்க புத்தகம்");
      case "accounts_bankbook":
        return getL("Bank Book", "வங்கி புத்தகம்");
      case "accounts_ledgerbook":
        return getL("Ledger Book", "பேரேடு புத்தகம்");
      case "accounts_trial_balance":
        return getL("Trial Balance", "இருப்பு நிலை குறிப்பு");
      case "accounts_balance_sheet":
        return getL("Balance Sheet", "இருப்புநிலை குறிப்பு");
      case "accounts_profit_loss":
        return getL("Profit & Loss", "லாப நட்ட கணக்கு");
      case "employee":
        return getL("Employee Hub", "பணியாளர்கள் மையம்");
      case "employee_dashboard":
        return getL("Employee Dashboard", "பணியாளர்கள் முகப்பு பலகை");
      case "employee_list":
        return getL("Employee List", "பணியாளர்கள் பட்டியல்");
      case "employee_add":
        return getL("Add Employee", "பணியாளர் சேர்");
      case "employee_attendance":
        return getL("Attendance", "வருகைப் பதிவு");
      case "employee_leaves":
        return getL("Leave Management", "விடுப்பு மேலாண்மை");
      case "employee_payroll":
        return getL("Salary", "ஊதியம்");
      case "employee_advances":
        return getL("Advance Salary", "முன்பண ஊதியம்");
      case "employee_incentives":
        return getL("Incentives", "ஊக்கத்தொகை");
      case "employee_documents":
        return getL("Documents", "ஆவணங்கள்");
      case "employee_reports":
        return getL("Reports", "அறிக்கைகள்");
      case "reports":
        return t("reports") || getL("Reports", "அறிக்கைகள்");
      case "reports_sales":
        return t("salesReport") || getL("Sales Report", "விற்பனை அறிக்கை");
      case "reports_purchase":
        return t("purchaseReport") || getL("Purchase Report", "கொள்முதல் அறிக்கை");
      case "reports_gst":
        return t("gstReport") || getL("GST Report", "ஜிஎஸ்டி அறிக்கை");
      case "reports_customer":
        return getL("Customer Report", "வாடிக்கையாளர் அறிக்கை");
      case "reports_supplier":
        return getL("Supplier Report", "சப்ளையர் அறிக்கை");
      case "reports_profit":
        return t("profitReport") || getL("Profit Report", "லாப அறிக்கை");
      case "reports_outstanding":
        return t("outstandingReport") || getL("Outstanding Report", "நிலுவை அறிக்கை");
      case "reports_daybook":
        return t("dayBook") || getL("Day Book", "நாள் புத்தகம்");
      case "reports_cashbook":
        return t("cashBook") || getL("Cash Book", "ரோக்க புத்தகம்");
      case "reports_bankbook":
        return t("bankBook") || getL("Bank Book", "வங்கி புத்தகம்");
      case "reports_stock":
        return getL("Stock Report", "சரக்கு அறிக்கை");
      case "reports_tax":
        return getL("Tax Report", "வரி அறிக்கை");
      case "settings":
        return t("settings") || getL("Settings Panel", "அமைப்புகள்");
      case "settings_company":
        return getL("Company Profile", "நிறுவனத்தின் விவரங்கள்");
      case "settings_logo":
        return getL("Company Logo", "நிறுவனத்தின் லோகோ");
      case "settings_printer":
        return getL("Printer Settings", "பிரிண்டர் அமைப்புகள்");
      case "settings_invoice":
        return t("invoiceDesign") || getL("Invoice Design", "இன்வாய்ஸ் வடிவமைப்பு");
      case "settings_receipt":
        return getL("Receipt Design", "ரசீது வடிவமைப்பு");
      case "settings_theme":
        return getL("Theme", "தீம்");
      case "settings_language":
        return getL("Language", "மொழி");
      case "settings_users":
        return t("userManagement") || getL("User Management", "பயனர் மேலாண்மை");
      case "settings_roles":
        return t("roles") || getL("Roles", "பொறுப்புகள்");
      case "settings_permissions":
        return t("permissions") || getL("Permissions", "அனுமதிகள்");
      case "settings_backup":
        return t("backupRestore") || getL("Database Backup", "தரவுத்தள காப்புப்பிரதி");
      case "settings_restore":
        return getL("Restore", "மீட்டெடுப்பு");
      case "settings_whatsapp":
        return getL("WhatsApp API", "வாட்ஸ்அப் ஏபிஐ");
      case "settings_sms":
        return t("smsConfig") || getL("SMS Settings", "எஸ்எம்எஸ் அமைப்புகள்");
      case "settings_email":
        return getL("Email Settings", "மின்னஞ்சல் அமைப்புகள்");
      default:
        return defaultLabel;
    }
  };
  if (!user) {
    return <LoginScreen onLoginSuccess={setUser} />;
  }
  const isMenuExpanded = (itemId, subItems) => {
    if (sidebarSearchQuery && subItems) {
      const q = sidebarSearchQuery.toLowerCase();
      return subItems.some((sub) => {
        const subLabel = getSidebarLabel(sub.id, sub.label).toLowerCase();
        if (sub.isFolder && sub.children) {
          return subLabel.includes(q) || sub.children.some(c => getSidebarLabel(c.id, c.label).toLowerCase().includes(q));
        }
        return subLabel.includes(q);
      });
    }
    return !!openMenus[itemId];
  };
  const filteredSidebar = sidebarStructure.filter((item) => {
    if (!hasPermission(item.permission)) return false;
    if (!sidebarSearchQuery) return true;
    const q = sidebarSearchQuery.toLowerCase();
    const itemTranslatedLabel = getSidebarLabel(item.id, item.label);
    const mainMatches = itemTranslatedLabel.toLowerCase().includes(q);
    if (item.subItems) {
      const subMatches = item.subItems.some((sub) => {
        const subLabel = getSidebarLabel(sub.id, sub.label).toLowerCase();
        if (sub.isFolder && sub.children) {
          return subLabel.includes(q) || sub.children.some(c => getSidebarLabel(c.id, c.label).toLowerCase().includes(q));
        }
        return subLabel.includes(q);
      });
      return mainMatches || subMatches;
    }
    return mainMatches;
  });
  const renderSidebar = (isMobile = false) => {
    return <div className="flex flex-col h-full justify-between">
        <div className="space-y-6 flex flex-col flex-1 overflow-y-auto pr-1 scrollbar-none">
          {
      /* Brand header */
    }
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider">{t("title")}</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Erode Branch</p>
              </div>
            </div>
            {isMobile && <button
      onClick={() => setIsSidebarOpen(false)}
      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer"
      id="sidebar-close"
    >
                <X className="w-5 h-5" />
              </button>}
          </div>

          {
      /* User profile / Role chip */
    }
          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800/60 shrink-0">
            <p className="text-xs font-bold text-white truncate">{user.fullName}</p>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-500/10 text-blue-400 mt-1 border border-blue-500/20 uppercase tracking-widest">
              {user.role}
            </span>
          </div>

          {
      /* Search Menu Input */
    }
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
      type="text"
      placeholder="Search menus (e.g. GST)..."
      value={sidebarSearchQuery}
      onChange={(e) => setSidebarSearchQuery(e.target.value)}
      className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all font-semibold"
    />
          </div>

          {
      /* Menu items */
    }
          <nav className="flex-1 space-y-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
            {filteredSidebar.map((item) => {
      const Icon = item.icon;
      const hasSubs = !!item.subItems;
      const expanded = isMenuExpanded(item.id, item.subItems);
      const isActiveMain = activeTab === item.id || activeTab && activeTab.startsWith(item.id + "_");
      const itemTranslatedLabel = getSidebarLabel(item.id, item.label);
      if (!hasSubs) {
        return <button
          key={item.id}
          onClick={() => {
            setActiveTab(item.id);
            checkOfflineQueue();
            if (isMobile) setIsSidebarOpen(false);
          }}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === item.id ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "hover:bg-slate-800/50 hover:text-slate-200"}`}
        >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-left">{itemTranslatedLabel}</span>
                    {activeTab === item.id && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                  </button>;
      }
      const q = sidebarSearchQuery.toLowerCase();
      const filteredSubs = item.subItems?.filter((sub) => {
        if (!sidebarSearchQuery) return true;
        const subTranslatedLabel = getSidebarLabel(sub.id, sub.label);
        const selfMatch = subTranslatedLabel.toLowerCase().includes(q) || itemTranslatedLabel.toLowerCase().includes(q);
        if (sub.isFolder && sub.children) {
          const childMatch = sub.children.some(c => getSidebarLabel(c.id, c.label).toLowerCase().includes(q));
          return selfMatch || childMatch;
        }
        return selfMatch;
      });
      return <div key={item.id} className="space-y-1 pt-0.5">
                  <button
        onClick={() => {
          setOpenMenus((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
        }}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${isActiveMain ? "bg-blue-600/10 text-blue-400 border border-blue-500/10" : "hover:bg-slate-800/50 hover:text-slate-200"}`}
      >
                    <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                    <span className="flex-1 text-left">{itemTranslatedLabel}</span>
                    <span className="transition-transform duration-200">
                      {expanded ? <ChevronDown className="w-3.5 h-3.5 opacity-60" /> : <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {expanded && <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="overflow-hidden pl-3 border-l border-slate-800 ml-5 space-y-1"
      >
                        {filteredSubs?.map((sub) => {
        if (sub.isFolder && sub.children) {
          const isFolderExpanded = !!openFolders[sub.id];
          const folderActive = activeTab && sub.children.some(c => activeTab === c.id);
          const FolderIcon = sub.icon || FolderTree;
          const filteredChildren = sub.children.filter(c => {
            if (!sidebarSearchQuery) return true;
            return getSidebarLabel(c.id, c.label).toLowerCase().includes(q) || getSidebarLabel(sub.id, sub.label).toLowerCase().includes(q);
          });
          return (
            <div key={sub.id} className="space-y-1 my-0.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenFolders(prev => ({ ...prev, [sub.id]: !prev[sub.id] }));
                }}
                className={`w-full flex items-center justify-between px-2 py-1 transition-all cursor-pointer ${
                  folderActive ? "text-blue-400 font-bold" : "text-slate-455 font-semibold hover:text-slate-200"
                }`}
              >
                <span className="flex items-center gap-2 text-[11px]">
                  <FolderIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>{getSidebarLabel(sub.id, sub.label)}</span>
                </span>
                <span>
                  {isFolderExpanded ? <ChevronDown className="w-3 h-3 opacity-65" /> : <ChevronRight className="w-3 h-3 opacity-65" />}
                </span>
              </button>
              {isFolderExpanded && (
                <div className="pl-3 border-l border-slate-800 ml-3.5 space-y-0.5">
                  {filteredChildren.map(child => {
                    const childActive = activeTab === child.id;
                    const ChildIcon = child.icon || FileText;
                    return (
                      <button
                        key={child.id}
                        onClick={() => {
                          setActiveTab(child.id);
                          checkOfflineQueue();
                          if (isMobile) setIsSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-2 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                          childActive
                            ? "bg-blue-600 text-white shadow-xs font-bold"
                            : "hover:bg-slate-800/30 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <ChildIcon className={`w-3 h-3 shrink-0 ${childActive ? "text-white animate-pulse" : "text-slate-500"}`} />
                        <span className="truncate text-left">{getSidebarLabel(child.id, child.label)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }
        const active = activeTab === sub.id;
        const SubIcon = sub.icon || null;
        const subTranslatedLabel = getSidebarLabel(sub.id, sub.label);
        return <button
          key={sub.id}
          onClick={() => {
            setActiveTab(sub.id);
            checkOfflineQueue();
            if (isMobile) setIsSidebarOpen(false);
          }}
          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${active ? "bg-blue-600 text-white shadow-xs" : "hover:bg-slate-800/30 text-slate-400 hover:text-slate-200"}`}
        >
                              {SubIcon ? <SubIcon className={`w-3.5 h-3.5 shrink-0 ${active ? "text-white" : "text-slate-500"}`} /> : <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-white" : "bg-slate-600"}`} />}
                              <span className="truncate text-left">{subTranslatedLabel}</span>
                            </button>;
      })}
                      </motion.div>}
                  </AnimatePresence>
                </div>;
    })}
          </nav>
        </div>

        {
      /* Connections and Logout block */
    }
        <div className="space-y-4 shrink-0 pt-4 border-t border-slate-800/40">
          {/* Network indicator */}
          <div className="flex items-center justify-between text-xs font-semibold px-2 py-1.5 bg-slate-900/80 rounded-xl border border-slate-800">
            <span className="flex items-center gap-1.5 text-[11px] text-slate-300 font-extrabold">
              {isOnline ? <Wifi className="w-4 h-4 text-emerald-500" /> : <WifiOff className="w-4 h-4 text-rose-500" />}
              {isOnline ? "Online Mode" : "Internet Required"}
            </span>
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${isOnline ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
              {isOnline ? "Active" : "Offline"}
            </span>
          </div>

          <button
      onClick={handleLogout}
      className="w-full flex items-center gap-3 px-3 py-2 bg-slate-800/20 hover:bg-rose-950/20 hover:text-rose-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
    >
            <LogOut className="w-4 h-4 text-slate-500" />
            <span>{t("logout")}</span>
          </button>
        </div>
      </div>;
  };
  return <div className="h-screen max-h-screen w-screen bg-slate-50 flex font-sans overflow-hidden select-none selection:bg-blue-100/80">
      
      {
    /* MOBILE SIDEBAR DRAWER OVERLAY */
  }
      <AnimatePresence>
        {isSidebarOpen && <div className="fixed inset-0 z-50 flex md:hidden">
            {
    /* Backdrop */
  }
            <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
    onClick={() => setIsSidebarOpen(false)}
  />
            {
    /* Drawer content */
  }
            <motion.aside
    initial={{ x: "-100%" }}
    animate={{ x: 0 }}
    exit={{ x: "-100%" }}
    transition={{ type: "spring", damping: 25, stiffness: 220 }}
    className="relative w-64 bg-slate-900 text-slate-400 p-5 flex flex-col justify-between border-r border-slate-800 h-full shadow-2xl z-50"
  >
              {renderSidebar(true)}
            </motion.aside>
          </div>}
      </AnimatePresence>

      {
    /* 1. DESKTOP SIDEBAR NAVIGATION */
  }
      <aside className="hidden md:flex w-64 bg-slate-900 shrink-0 text-slate-400 p-5 flex-col justify-between border-r border-slate-800 h-full overflow-hidden">
        {renderSidebar(false)}
      </aside>

      {
    /* 2. MAIN WORKSPACE CONTAINER */
  }
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden h-full bg-slate-50">
        
        {
    /* UPPER NAVIGATION BAR */
  }
        <header className="bg-white border-b border-slate-200/80 px-4 md:px-8 py-4 shrink-0 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <button
    onClick={() => setIsSidebarOpen(true)}
    className="md:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
    aria-label="Open sidebar"
    id="mobile-menu-toggle"
  >
              <Menu className="w-5 h-5" />
            </button>
            {companySettings.logoUrl && <img
    src={companySettings.logoUrl}
    alt={`${companySettings.companyName} Logo`}
    className="w-10 h-10 rounded-xl object-contain border border-slate-200 p-0.5 shrink-0"
    referrerPolicy="no-referrer"
  />}
            <div>
              <h1 id="shop-main-title" className="text-lg font-black tracking-tight text-slate-900 uppercase">
                {companySettings.companyName}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {t("subtitle")}
              </p>
            </div>
          </div>

          {
    /* Controls */
  }
          <div className="flex items-center gap-4">
            {
    /* Tamil Typing Toggle */
  }
            <div className="flex items-center gap-2 select-none mr-2">
              <label className="flex items-center gap-1.5 cursor-pointer bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-1.5 transition-all">
                <input
                  type="checkbox"
                  checked={tamilTypingEnabled}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setTamilTypingEnabled(val);
                    localStorage.setItem("sri_amman_tamil_typing", String(val));
                    window.dispatchEvent(new Event("sri_amman_transliteration_toggle"));
                  }}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-[10px] md:text-xs text-slate-700 font-extrabold uppercase tracking-wider flex items-center gap-1">
                  ⌨️ {language === "Tamil" ? "தமிழ் ஒலிபெயர்ப்பு" : language === "Both" || language === "Dual" ? "Tamil Transliteration / தமிழ் ஒலிபெயர்ப்பு" : "Tamil Transliteration"}
                </span>
              </label>
            </div>

            {
    /* Quick bilingual select */
  }
            <div className="bg-slate-100 rounded-xl p-1 flex gap-1">
              <button
                type="button"
                onClick={() => setLanguage("English")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${language === "English" ? "bg-white text-slate-900 shadow-sm font-black" : "text-slate-500 hover:text-slate-800"}`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage("Tamil")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${language === "Tamil" ? "bg-white text-slate-900 shadow-sm font-black" : "text-slate-500 hover:text-slate-800"}`}
              >
                தமிழ்
              </button>
              <button
                type="button"
                onClick={() => setLanguage("Both")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${language === "Both" || language === "Dual" ? "bg-blue-600 text-white shadow-sm font-black" : "text-slate-500 hover:text-slate-800"}`}
              >
                Dual (English + தமிழ்)
              </button>
            </div>
          </div>
        </header>

        {
    /* TAB CONTROLLERS & WORKSPACE */
  }
        <div className="flex-1 p-3 md:p-5 overflow-y-auto scroll-smooth">
          {!isOnline && (
            <div className="mb-4 p-3 bg-rose-600 text-white rounded-xl shadow-md flex items-center justify-between font-black text-xs uppercase tracking-wider animate-pulse">
              <div className="flex items-center gap-2">
                <WifiOff className="w-5 h-5 shrink-0" />
                <span>Internet Connection Required — Sri Amman Traders Billing Software operates strictly in Online Mode.</span>
              </div>
              <span className="bg-white/20 px-2.5 py-1 rounded-lg text-[10px]">Reconnecting...</span>
            </div>
          )}
          {activeTab === "dashboard" && <Dashboard
    stats={dashboardStats}
    onNavigate={setActiveTab}
    isOnline={isOnline}
    syncData={syncData}
    pendingOfflineCount={pendingSyncCount}
    bills={bills}
    purchases={purchases}
    expenses={expenses}
    customers={customers}
    suppliers={suppliers}
    products={products}
    ledger={ledger}
    accountsGroups={accountsGroups}
    accountsLedgers={accountsLedgers}
  />}

          {activeTab === "billing" && <BillingPOS
    products={products}
    customers={customers}
    onAddCustomer={handleAddCustomer}
    onSaveBill={handleSaveBill}
    holdBills={holdBills}
    onHoldBill={handleHoldBill}
    onResumeBill={handleResumeBill}
    nextInvoiceNo={companySettings.invoicePrefix + "NEXT"}
  />}

          {(activeTab === "masters" || activeTab?.startsWith("masters_")) && <Masters
    products={products}
    bills={bills}
    onAddProduct={handleAddProduct}
    onUpdateProduct={handleUpdateProduct}
    onDeleteProduct={handleDeleteProduct}
    customers={customers}
    onAddCustomer={handleAddCustomer}
    onUpdateCustomer={handleUpdateCustomer}
    onDeleteCustomer={handleDeleteCustomer}
    suppliers={suppliers}
    onAddSupplier={handleAddSupplier}
    onUpdateSupplier={handleUpdateSupplier}
    onDeleteSupplier={handleDeleteSupplier}
    activeMasterProp={activeTab?.startsWith("masters_") ? activeTab.replace("masters_", "") : "products"}
    triggerToast={triggerToast}
    loadAllData={loadAllData}
  />}

          {(activeTab === "purchase" || activeTab?.startsWith("purchase_")) && <PurchaseModule
    products={products}
    suppliers={suppliers}
    purchases={purchases}
    purchaseReturns={purchaseReturns}
    expenses={expenses}
    ledger={ledger}
    isOnline={isOnline}
    onAddSupplier={handleAddSupplier}
    onUpdateSupplier={handleUpdateSupplier}
    loadAllData={loadAllData}
    activeSubTabProp={activeTab?.startsWith("purchase_") ? activeTab.replace("purchase_", "") : "history"}
  />}

          {(activeTab === "inventory" || activeTab?.startsWith("inventory_")) && <InventoryModule
    products={products}
    adjustments={adjustments}
    isOnline={isOnline}
    onAddAdjustment={handleAddAdjustment}
    loadAllData={loadAllData}
    activeSubTabProp={activeTab?.startsWith("inventory_") ? activeTab.replace("inventory_", "") : "ledger"}
  />}

          {(activeTab === "accounts" || activeTab?.startsWith("accounts_")) && <AccountsModule
    bills={bills}
    purchases={purchases}
    expenses={expenses}
    incomes={incomes}
    ledger={ledger}
    customers={customers}
    suppliers={suppliers}
    products={products}
    trialBalance={trialBalance}
    activeSubTab={activeTab}
    isOnline={isOnline}
    loadAllData={loadAllData}
    accountsGroups={accountsGroups}
    accountsLedgers={accountsLedgers}
    vouchers={vouchers}
  />}

          {(activeTab === "reports" || activeTab?.startsWith("reports_")) && <ReportsModule
    bills={bills}
    purchases={purchases}
    purchaseReturns={purchaseReturns}
    expenses={expenses}
    incomes={incomes}
    ledger={ledger}
    customers={customers}
    suppliers={suppliers}
    products={products}
    activeSubTab={activeTab === "reports" ? "reports_sales" : activeTab}
    isOnline={isOnline}
  />}

          {(activeTab === "employee" || activeTab?.startsWith("employee_")) && <EmployeeModule
    activeSubTab={activeTab === "employee" ? "employee_dashboard" : activeTab}
    triggerToast={triggerToast}
    loadAllData={loadAllData}
  />}

          {(activeTab === "settings" || activeTab?.startsWith("settings_")) && <SettingsPanel
    settings={companySettings}
    onUpdateSettings={handleUpdateSettings}
    activeSubTabProp={activeTab === "settings" ? "settings_company" : activeTab}
  />}
        </div>

      </main>

      {
    /* 3. PRINT PREVIEW OVERLAY MODAL */
  }
      {activePrintBill && <ReceiptPrint
    bill={activePrintBill}
    onClose={() => {
      setActivePrintBill(null);
      checkOfflineQueue();
    }}
    companySettings={companySettings}
  />}

      {
    /* 4. TOAST NOTIFICATIONS */
  }
      {toastMessage && <div className="fixed bottom-5 right-5 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-slate-800 flex items-center gap-2 animate-bounce z-[999] text-xs font-bold">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          {toastMessage}
        </div>}

    </div>;
}
function App() {
  return <LanguageProvider>
      <MainAppShell />
    </LanguageProvider>;
}
export {
  App as default
};
