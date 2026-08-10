import React, { useState, useMemo, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import {
  Coins,
  Landmark,
  User,
  Truck,
  TrendingUp,
  FileText,
  Layers,
  Calendar,
  Plus,
  Search,
  Printer,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  CheckCircle,
  Wallet,
  Edit2,
  Trash2,
  AlertTriangle,
  Filter,
  ArrowDownCircle,
  ArrowUpCircle
} from "lucide-react";

const AccountsModule = ({
  bills = [],
  purchases = [],
  expenses = [],
  incomes = [],
  ledger = [],
  customers = [],
  suppliers = [],
  accountsGroups = [],
  accountsLedgers = [],
  activeSubTab,
  isOnline,
  loadAllData
}) => {
  const { t, language } = useLanguage();

  // Selected Tab State: ledger_master, income_entry, expense_entry, cashbook, bankbook, customer_ledger, supplier_ledger, outstanding, daybook
  const [innerTab, setInnerTab] = useState("ledger_master");

  useEffect(() => {
    if (activeSubTab) {
      const cleanSub = activeSubTab.replace("accounts_", "");
      if (cleanSub === "income") setInnerTab("income_entry");
      else if (cleanSub === "expense") setInnerTab("expense_entry");
      else setInnerTab(cleanSub);
    }
  }, [activeSubTab]);

  // Date filters
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedDay, setSelectedDay] = useState(() => new Date().toISOString().split("T")[0]);
  const [searchQuery, setSearchQuery] = useState("");

  // Customer & Supplier selections for statement views
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");

  useEffect(() => {
    if (customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [customers]);

  useEffect(() => {
    if (suppliers.length > 0 && !selectedSupplierId) {
      setSelectedSupplierId(suppliers[0].id);
    }
  }, [suppliers]);

  // Toast State
  const [toastMsg, setToastMsg] = useState(null);
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fmt = (num) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  // ================= 1. LEDGER MASTER STATE =================
  const [ledgerFilterType, setLedgerFilterType] = useState("All");
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [editingLedger, setEditingLedger] = useState(null);
  const [deletingLedger, setDeletingLedger] = useState(null);
  const [ledgerForm, setLedgerForm] = useState({
    name: "",
    tamilName: "",
    type: "Expense",
    openingBalance: 0,
    status: "Active"
  });

  const handleOpenCreateLedger = () => {
    setEditingLedger(null);
    setLedgerForm({
      name: "",
      tamilName: "",
      type: "Expense",
      openingBalance: 0,
      status: "Active"
    });
    setShowLedgerModal(true);
  };

  const handleOpenEditLedger = (l) => {
    setEditingLedger(l);
    setLedgerForm({
      name: l.name || "",
      tamilName: l.tamilName || "",
      type: l.type || l.groupType || "Expense",
      openingBalance: l.openingBalance || 0,
      status: l.status || "Active"
    });
    setShowLedgerModal(true);
  };

  const handleSaveLedger = async (e) => {
    e.preventDefault();
    if (!ledgerForm.name.trim()) return showToast("Ledger name is required");

    try {
      const url = editingLedger
        ? `/api/accounts/ledgers/${editingLedger.id}`
        : "/api/accounts/ledgers";
      const method = editingLedger ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ledgerForm)
      });

      if (res.ok) {
        showToast(editingLedger ? "Ledger updated successfully!" : "Ledger created successfully!");
        setShowLedgerModal(false);
        if (loadAllData) await loadAllData();
      } else {
        const err = await res.json();
        showToast(err.message || "Failed to save ledger");
      }
    } catch (err) {
      console.error(err);
      showToast("Error saving ledger");
    }
  };

  const handleDeleteLedgerConfirm = async () => {
    if (!deletingLedger) return;
    try {
      const res = await fetch(`/api/accounts/ledgers/${deletingLedger.id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        showToast("Ledger deleted successfully!");
        setDeletingLedger(null);
        if (loadAllData) await loadAllData();
      } else {
        const err = await res.json();
        showToast(err.message || "Failed to delete ledger");
      }
    } catch (err) {
      console.error(err);
      showToast("Error deleting ledger");
    }
  };

  const filteredLedgers = useMemo(() => {
    return accountsLedgers.filter((l) => {
      const lType = l.type || l.groupType || "General";
      const matchType = ledgerFilterType === "All" || lType.toLowerCase().includes(ledgerFilterType.toLowerCase());
      const matchSearch =
        (l.name || "").toLowerCase().includes(ledgerSearch.toLowerCase()) ||
        (l.tamilName || "").toLowerCase().includes(ledgerSearch.toLowerCase()) ||
        (l.id || "").toLowerCase().includes(ledgerSearch.toLowerCase());
      return matchType && matchSearch;
    });
  }, [accountsLedgers, ledgerFilterType, ledgerSearch]);

  // ================= 2. INCOME ENTRY STATE =================
  const [incomeSearch, setIncomeSearch] = useState("");
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [deletingIncome, setDeletingIncome] = useState(null);
  const [incomeForm, setIncomeForm] = useState({
    date: new Date().toISOString().split("T")[0],
    category: "General Income",
    ledgerId: "",
    paymentType: "Cash",
    amount: "",
    remarks: ""
  });

  const handleOpenCreateIncome = () => {
    setEditingIncome(null);
    setIncomeForm({
      date: new Date().toISOString().split("T")[0],
      category: "General Income",
      ledgerId: "",
      paymentType: "Cash",
      amount: "",
      remarks: ""
    });
    setShowIncomeModal(true);
  };

  const handleOpenEditIncome = (inc) => {
    setEditingIncome(inc);
    setIncomeForm({
      date: inc.date || new Date().toISOString().split("T")[0],
      category: inc.category || inc.ledgerName || "General Income",
      ledgerId: inc.ledgerId || "",
      paymentType: inc.paymentType || "Cash",
      amount: inc.amount || "",
      remarks: inc.remarks || inc.note || ""
    });
    setShowIncomeModal(true);
  };

  const handleSaveIncome = async (e) => {
    e.preventDefault();
    if (!incomeForm.amount || Number(incomeForm.amount) <= 0) {
      return showToast("Please enter a valid amount");
    }

    try {
      const url = editingIncome ? `/api/incomes/${editingIncome.id}` : "/api/incomes";
      const method = editingIncome ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...incomeForm,
          amount: Number(incomeForm.amount)
        })
      });

      if (res.ok) {
        showToast(editingIncome ? "Income updated successfully!" : "Income recorded successfully!");
        setShowIncomeModal(false);
        if (loadAllData) await loadAllData();
      } else {
        showToast("Error saving income entry");
      }
    } catch (err) {
      console.error(err);
      showToast("Error saving income entry");
    }
  };

  const handleDeleteIncomeConfirm = async () => {
    if (!deletingIncome) return;
    try {
      const res = await fetch(`/api/incomes/${deletingIncome.id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Income entry deleted successfully!");
        setDeletingIncome(null);
        if (loadAllData) await loadAllData();
      } else {
        showToast("Failed to delete income entry");
      }
    } catch (err) {
      console.error(err);
      showToast("Error deleting income entry");
    }
  };

  const filteredIncomes = useMemo(() => {
    return incomes.filter((inc) => {
      const incDate = inc.date || "";
      const matchSearch =
        (inc.category || inc.ledgerName || "").toLowerCase().includes(incomeSearch.toLowerCase()) ||
        (inc.remarks || inc.note || "").toLowerCase().includes(incomeSearch.toLowerCase()) ||
        (inc.paymentType || "").toLowerCase().includes(incomeSearch.toLowerCase());
      return matchSearch;
    });
  }, [incomes, incomeSearch]);

  // ================= 3. EXPENSE ENTRY STATE =================
  const [expenseSearch, setExpenseSearch] = useState("");
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deletingExpense, setDeletingExpense] = useState(null);
  const [expForm, setExpForm] = useState({
    date: new Date().toISOString().split("T")[0],
    category: "Shop Rent",
    paymentType: "Cash",
    amount: "",
    note: ""
  });

  const handleOpenCreateExpense = () => {
    setEditingExpense(null);
    setExpForm({
      date: new Date().toISOString().split("T")[0],
      category: "Shop Rent",
      paymentType: "Cash",
      amount: "",
      note: ""
    });
    setShowExpenseModal(true);
  };

  const handleOpenEditExpense = (exp) => {
    setEditingExpense(exp);
    setExpForm({
      date: exp.date || new Date().toISOString().split("T")[0],
      category: exp.category || "General Expenses",
      paymentType: exp.paymentType || "Cash",
      amount: exp.amount || "",
      note: exp.note || exp.remarks || ""
    });
    setShowExpenseModal(true);
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!expForm.amount || Number(expForm.amount) <= 0) {
      return showToast("Please enter a valid expense amount");
    }

    try {
      const url = editingExpense ? `/api/expenses/${editingExpense.id}` : "/api/expenses";
      const method = editingExpense ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...expForm,
          amount: Number(expForm.amount)
        })
      });

      if (res.ok) {
        showToast(editingExpense ? "Expense updated successfully!" : "Expense added successfully!");
        setShowExpenseModal(false);
        if (loadAllData) await loadAllData();
      } else {
        showToast("Error saving expense");
      }
    } catch (err) {
      console.error(err);
      showToast("Error saving expense");
    }
  };

  const handleDeleteExpenseConfirm = async () => {
    if (!deletingExpense) return;
    try {
      const res = await fetch(`/api/expenses/${deletingExpense.id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Expense entry deleted successfully!");
        setDeletingExpense(null);
        if (loadAllData) await loadAllData();
      } else {
        showToast("Failed to delete expense");
      }
    } catch (err) {
      console.error(err);
      showToast("Error deleting expense");
    }
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchSearch =
        (e.category || "").toLowerCase().includes(expenseSearch.toLowerCase()) ||
        (e.note || e.remarks || "").toLowerCase().includes(expenseSearch.toLowerCase()) ||
        (e.paymentType || "").toLowerCase().includes(expenseSearch.toLowerCase());
      return matchSearch;
    });
  }, [expenses, expenseSearch]);

  // ================= 4. CUSTOMER & SUPPLIER PAYMENT MODALS =================
  const [showCustPayModal, setShowCustPayModal] = useState(false);
  const [custPayId, setCustPayId] = useState("");
  const [custPayAmount, setCustPayAmount] = useState("");
  const [custPayMode, setCustPayMode] = useState("Cash");
  const [custPayNarration, setCustPayNarration] = useState("");

  const [showSuppPayModal, setShowSuppPayModal] = useState(false);
  const [suppPayId, setSuppPayId] = useState("");
  const [suppPayAmount, setSuppPayAmount] = useState("");
  const [suppPayMode, setSuppPayMode] = useState("Bank");
  const [suppPayNarration, setSuppPayNarration] = useState("");

  const handleRecordCustomerPayment = async (e) => {
    e.preventDefault();
    if (!custPayId || !custPayAmount || Number(custPayAmount) <= 0) {
      return showToast("Please enter a valid customer and amount.");
    }
    try {
      const res = await fetch(`/api/customers/${custPayId}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(custPayAmount),
          paymentMode: custPayMode,
          date: new Date().toISOString().split("T")[0],
          narration: custPayNarration
        })
      });
      if (res.ok) {
        showToast("Customer payment collected successfully!");
        setShowCustPayModal(false);
        setCustPayAmount("");
        setCustPayNarration("");
        if (loadAllData) await loadAllData();
      } else {
        const data = await res.json();
        showToast(data.message || "Failed to record payment");
      }
    } catch (err) {
      console.error(err);
      showToast("Error processing payment.");
    }
  };

  const handleRecordSupplierPayment = async (e) => {
    e.preventDefault();
    if (!suppPayId || !suppPayAmount || Number(suppPayAmount) <= 0) {
      return showToast("Please enter a valid supplier and amount.");
    }
    try {
      const res = await fetch(`/api/suppliers/${suppPayId}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(suppPayAmount),
          paymentMode: suppPayMode,
          date: new Date().toISOString().split("T")[0],
          narration: suppPayNarration
        })
      });
      if (res.ok) {
        showToast("Supplier payment recorded successfully!");
        setShowSuppPayModal(false);
        setSuppPayAmount("");
        setSuppPayNarration("");
        if (loadAllData) await loadAllData();
      } else {
        const data = await res.json();
        showToast(data.message || "Failed to record payment");
      }
    } catch (err) {
      console.error(err);
      showToast("Error processing payment.");
    }
  };

  // Calculated Datasets
  const selectedCustomer = useMemo(() => customers.find((c) => c.id === selectedCustomerId), [customers, selectedCustomerId]);
  const customerBills = useMemo(() => {
    if (!selectedCustomerId) return [];
    return bills.filter((b) => b.customerId === selectedCustomerId && b.status !== "Cancelled");
  }, [bills, selectedCustomerId]);

  const selectedSupplier = useMemo(() => suppliers.find((s) => s.id === selectedSupplierId), [suppliers, selectedSupplierId]);
  const supplierPurchases = useMemo(() => {
    if (!selectedSupplierId) return [];
    return purchases.filter((p) => p.supplierId === selectedSupplierId);
  }, [purchases, selectedSupplierId]);

  const cashEntries = useMemo(() => {
    return ledger.filter((l) => l.accountGroup === "Cash" || l.particulars?.toLowerCase().includes("cash"));
  }, [ledger]);
  const cashInTotal = useMemo(() => cashEntries.filter((e) => e.type === "Debit").reduce((s, e) => s + e.amount, 0), [cashEntries]);
  const cashOutTotal = useMemo(() => cashEntries.filter((e) => e.type === "Credit").reduce((s, e) => s + e.amount, 0), [cashEntries]);
  const cashNetBalance = cashInTotal - cashOutTotal;

  const bankEntries = useMemo(() => {
    return ledger.filter((l) => l.accountGroup === "Bank" || l.particulars?.toLowerCase().includes("bank") || l.particulars?.toLowerCase().includes("upi") || l.particulars?.toLowerCase().includes("card"));
  }, [ledger]);
  const bankInTotal = useMemo(() => bankEntries.filter((e) => e.type === "Debit").reduce((s, e) => s + e.amount, 0), [bankEntries]);
  const bankOutTotal = useMemo(() => bankEntries.filter((e) => e.type === "Credit").reduce((s, e) => s + e.amount, 0), [bankEntries]);
  const bankNetBalance = bankInTotal - bankOutTotal;

  const totalSalesIncome = useMemo(() => bills.filter((b) => b.status !== "Cancelled").reduce((s, b) => s + (b.total || 0), 0), [bills]);
  const totalCustomerOutstanding = useMemo(() => customers.reduce((s, c) => s + (c.outstanding || 0), 0), [customers]);
  const totalSupplierOutstanding = useMemo(() => suppliers.reduce((s, sObj) => s + (sObj.outstanding || 0), 0), [suppliers]);

  const dayTransactions = useMemo(() => {
    return ledger.filter((l) => l.date === selectedDay);
  }, [ledger, selectedDay]);

  const handleExportCSV = (title, rows) => {
    if (rows.length === 0) return showToast("No data to export");
    let csvContent = "data:text/csv;charset=utf-8,";
    const headers = Object.keys(rows[0]);
    csvContent += headers.join(",") + "\n";
    rows.forEach((r) => {
      csvContent += headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",") + "\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 select-none pb-10">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          {toastMsg}
        </div>
      )}

      {/* Module Title Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Coins className="w-6 h-6 text-blue-600" />
            <h1 className="text-lg font-black text-slate-900 uppercase tracking-wider">
              {t("accounts") || "Rice Shop Accounts & Financial Master"}
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Complete Ledger Master, Income & Expense Management, Day Book & Statements • Sri Amman Traders
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenCreateIncome}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Income
          </button>
          <button
            onClick={handleOpenCreateExpense}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
          <button
            onClick={handleOpenCreateLedger}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Ledger
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 text-xs font-bold">
        {[
          { id: "ledger_master", label: "Ledger Master", icon: Layers },
          { id: "income_entry", label: "Income Entry", icon: ArrowDownCircle },
          { id: "expense_entry", label: "Expense Entry", icon: ArrowUpCircle },
          { id: "customer_ledger", label: "Customer Ledger", icon: User },
          { id: "supplier_ledger", label: "Supplier Ledger", icon: Truck },
          { id: "cashbook", label: "Cash Book", icon: Wallet },
          { id: "bankbook", label: "Bank Book", icon: Landmark },
          { id: "outstanding", label: "Outstanding", icon: TrendingUp },
          { id: "daybook", label: "Day Book", icon: Calendar }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = innerTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setInnerTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ================= 1. LEDGER MASTER TAB ================= */}
      {innerTab === "ledger_master" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-black text-slate-800 uppercase">📚 Ledger Master Accounts</h2>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">Manage Income, Expense, Bank, Cash, Customer & Supplier Accounts</p>
            </div>
            <button
              onClick={handleOpenCreateLedger}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create New Ledger
            </button>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Type:
              </span>
              {["All", "Income", "Expense", "Bank", "Cash", "Customer", "Supplier"].map((type) => (
                <button
                  key={type}
                  onClick={() => setLedgerFilterType(type)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    ledgerFilterType === type
                      ? "bg-blue-600 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search ledgers..."
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Ledger Master Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Ledger Code</th>
                  <th className="p-3">Ledger Name</th>
                  <th className="p-3">Tamil Name</th>
                  <th className="p-3">Type / Group</th>
                  <th className="p-3 text-right">Opening Bal (₹)</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLedgers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400 italic">No ledgers found matching criteria</td>
                  </tr>
                ) : (
                  filteredLedgers.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono text-slate-400 text-[10px]">{l.id}</td>
                      <td className="p-3 font-bold text-slate-800">{l.name}</td>
                      <td className="p-3 text-slate-500 font-medium">{l.tamilName || "-"}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-blue-50 text-blue-700 border-blue-100">
                          {l.type || l.groupType || "General"}
                        </span>
                      </td>
                      <td className="p-3 text-right font-black text-slate-800">{fmt(l.openingBalance || 0)}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${l.status === "Inactive" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
                          {l.status || "Active"}
                        </span>
                      </td>
                      <td className="p-3 text-center flex justify-center items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditLedger(l)}
                          className="p-1.5 hover:bg-slate-100 text-blue-600 rounded-lg transition-colors cursor-pointer"
                          title="Edit Ledger"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingLedger(l)}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Delete Ledger"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= 2. INCOME ENTRY TAB ================= */}
      {innerTab === "income_entry" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-black text-slate-800 uppercase">📈 Income & Miscellaneous Receipts</h2>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">Record non-bill income, commission, rent received & other receipts</p>
            </div>
            <button
              onClick={handleOpenCreateIncome}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Record New Income
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search income category or remarks..."
                value={incomeSearch}
                onChange={(e) => setIncomeSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              Total Recorded Income: {fmt(incomes.reduce((sum, i) => sum + (i.amount || 0), 0))}
            </div>
          </div>

          {/* Income Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Category / Ledger</th>
                  <th className="p-3">Payment Mode</th>
                  <th className="p-3">Remarks / Description</th>
                  <th className="p-3 text-right">Amount (₹)</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIncomes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400 italic">No income entries recorded yet</td>
                  </tr>
                ) : (
                  filteredIncomes.map((inc) => (
                    <tr key={inc.id} className="hover:bg-slate-50/50">
                      <td className="p-3 text-slate-500 font-mono">{inc.date}</td>
                      <td className="p-3 font-bold text-slate-800">{inc.category || inc.ledgerName || "General Income"}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-emerald-50 text-emerald-700 border-emerald-100">
                          {inc.paymentType || "Cash"}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 font-normal">{inc.remarks || inc.note || "-"}</td>
                      <td className="p-3 text-right font-black text-emerald-600">{fmt(inc.amount)}</td>
                      <td className="p-3 text-center flex justify-center items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditIncome(inc)}
                          className="p-1.5 hover:bg-slate-100 text-blue-600 rounded-lg transition-colors cursor-pointer"
                          title="Edit Entry"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingIncome(inc)}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Delete Entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= 3. EXPENSE ENTRY TAB ================= */}
      {innerTab === "expense_entry" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-black text-slate-800 uppercase">📋 Shop Operating Expenses</h2>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">Rent, electricity, labor wages, transport, maintenance & operational costs</p>
            </div>
            <button
              onClick={handleOpenCreateExpense}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add New Expense
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search expense category or notes..."
                value={expenseSearch}
                onChange={(e) => setExpenseSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
              Total Expenses: {fmt(expenses.reduce((sum, e) => sum + (e.amount || 0), 0))}
            </div>
          </div>

          {/* Expense Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Expense Category</th>
                  <th className="p-3">Payment Mode</th>
                  <th className="p-3">Remarks / Description</th>
                  <th className="p-3 text-right">Amount (₹)</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400 italic">No expenses entered yet</td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/50">
                      <td className="p-3 text-slate-500 font-mono">{exp.date}</td>
                      <td className="p-3 font-bold text-slate-800">{exp.category}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-slate-100 text-slate-700 border-slate-200">
                          {exp.paymentType || "Cash"}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 font-normal">{exp.note || exp.remarks || "-"}</td>
                      <td className="p-3 text-right font-black text-rose-600">{fmt(exp.amount)}</td>
                      <td className="p-3 text-center flex justify-center items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditExpense(exp)}
                          className="p-1.5 hover:bg-slate-100 text-blue-600 rounded-lg transition-colors cursor-pointer"
                          title="Edit Expense"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingExpense(exp)}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= 4. CUSTOMER LEDGER TAB ================= */}
      {innerTab === "customer_ledger" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase">Customer Statement & Account Ledger</h2>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Select a customer to view sales invoices and collections</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <label className="text-xs font-bold text-slate-500 uppercase">Customer:</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.outstanding > 0 ? `(O/S: ₹${c.outstanding})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedCustomer ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Total Sales Invoices</span>
                    <span className="text-lg font-black text-slate-800 block mt-1">{fmt(customerBills.reduce((s, b) => s + b.total, 0))}</span>
                  </div>
                  <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Total Payments Received</span>
                    <span className="text-lg font-black text-emerald-700 block mt-1">{fmt(customerBills.reduce((s, b) => s + (b.paidAmount || 0), 0))}</span>
                  </div>
                  <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-rose-600 uppercase">Current Outstanding Balance</span>
                      <span className="text-xl font-black text-rose-700 block mt-1">{fmt(selectedCustomer.outstanding || 0)}</span>
                    </div>
                    {selectedCustomer.outstanding > 0 && (
                      <button
                        onClick={() => {
                          setCustPayId(selectedCustomer.id);
                          setShowCustPayModal(true);
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
                      >
                        Collect Now
                      </button>
                    )}
                  </div>
                </div>

                {/* Sales Bills for Customer */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs font-semibold">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                      <tr>
                        <th className="p-3">Date</th>
                        <th className="p-3">Invoice No</th>
                        <th className="p-3">Payment Mode</th>
                        <th className="p-3 text-right">Bill Total</th>
                        <th className="p-3 text-right">Paid Amount</th>
                        <th className="p-3 text-right">Balance Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customerBills.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-400 italic">No transactions found for this customer</td>
                        </tr>
                      ) : (
                        customerBills.map((b, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-3">{b.date?.substring(0, 10)}</td>
                            <td className="p-3 font-bold text-blue-600">{b.invoiceNo}</td>
                            <td className="p-3">{b.paymentType}</td>
                            <td className="p-3 text-right font-black text-slate-800">{fmt(b.total)}</td>
                            <td className="p-3 text-right text-emerald-600 font-bold">{fmt(b.paidAmount)}</td>
                            <td className="p-3 text-right text-rose-600 font-black">{fmt(b.balance)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="text-slate-400 italic text-center py-6">Please select or add a customer to view ledger</p>
            )}
          </div>
        </div>
      )}

      {/* ================= 5. SUPPLIER LEDGER TAB ================= */}
      {innerTab === "supplier_ledger" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase">Supplier Statement & Account Ledger</h2>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Select a rice mill supplier to view purchases and settlements</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <label className="text-xs font-bold text-slate-500 uppercase">Supplier:</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.outstanding > 0 ? `(Payable: ₹${s.outstanding})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedSupplier ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Total Procurements</span>
                    <span className="text-lg font-black text-slate-800 block mt-1">{fmt(supplierPurchases.reduce((s, p) => s + p.total, 0))}</span>
                  </div>
                  <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Total Payments Made</span>
                    <span className="text-lg font-black text-emerald-700 block mt-1">{fmt(supplierPurchases.reduce((s, p) => s + (p.paidAmount || 0), 0))}</span>
                  </div>
                  <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-amber-600 uppercase">Current Supplier Payable</span>
                      <span className="text-xl font-black text-amber-700 block mt-1">{fmt(selectedSupplier.outstanding || 0)}</span>
                    </div>
                    {selectedSupplier.outstanding > 0 && (
                      <button
                        onClick={() => {
                          setSuppPayId(selectedSupplier.id);
                          setShowSuppPayModal(true);
                        }}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
                      >
                        Pay Supplier
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs font-semibold">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                      <tr>
                        <th className="p-3">Date</th>
                        <th className="p-3">Purchase No</th>
                        <th className="p-3">Payment Mode</th>
                        <th className="p-3 text-right">Purchase Total</th>
                        <th className="p-3 text-right">Paid Amount</th>
                        <th className="p-3 text-right">Balance Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {supplierPurchases.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-400 italic">No purchase entries found for this supplier</td>
                        </tr>
                      ) : (
                        supplierPurchases.map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-3">{p.date}</td>
                            <td className="p-3 font-bold text-blue-600">{p.purchaseNo}</td>
                            <td className="p-3">{p.paymentType}</td>
                            <td className="p-3 text-right font-black text-slate-800">{fmt(p.total)}</td>
                            <td className="p-3 text-right text-emerald-600 font-bold">{fmt(p.paidAmount)}</td>
                            <td className="p-3 text-right text-rose-600 font-black">{fmt(p.balance)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="text-slate-400 italic text-center py-6">Please select a supplier to view ledger</p>
            )}
          </div>
        </div>
      )}

      {/* ================= 6. CASH BOOK TAB ================= */}
      {innerTab === "cashbook" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-black text-slate-800 uppercase">💵 Cash Book Register</h2>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">All physical cash receipts and cash disbursements</p>
            </div>
            <button
              onClick={() => handleExportCSV("Cash_Book", cashEntries.map((e) => ({ Date: e.date, Particulars: e.particulars, Type: e.type, Amount: e.amount })))}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Export CSV
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Total Cash Receipts (In)</span>
              <span className="text-xl font-black text-emerald-700 block mt-1">{fmt(cashInTotal)}</span>
            </div>
            <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200">
              <span className="text-[10px] font-bold text-rose-600 uppercase">Total Cash Expenses (Out)</span>
              <span className="text-xl font-black text-rose-700 block mt-1">{fmt(cashOutTotal)}</span>
            </div>
            <div className="bg-blue-600 text-white p-4 rounded-xl shadow-xs">
              <span className="text-[10px] font-bold text-blue-200 uppercase">Current Net Cash Balance</span>
              <span className="text-2xl font-black text-white block mt-1">{fmt(cashNetBalance)}</span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Particulars / Transaction</th>
                  <th className="p-3 text-right">Cash In (Debit)</th>
                  <th className="p-3 text-right">Cash Out (Credit)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cashEntries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400 italic">No cash transactions logged yet</td>
                  </tr>
                ) : (
                  cashEntries.map((e, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3">{e.date}</td>
                      <td className="p-3 font-bold text-slate-800">{e.particulars}</td>
                      <td className="p-3 text-right font-bold text-emerald-600">{e.type === "Debit" ? fmt(e.amount) : "-"}</td>
                      <td className="p-3 text-right font-bold text-rose-600">{e.type === "Credit" ? fmt(e.amount) : "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= 7. BANK BOOK TAB ================= */}
      {innerTab === "bankbook" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-black text-slate-800 uppercase">🏦 Bank / UPI Book Register</h2>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">Online settlements, UPI collections, and bank transfers</p>
            </div>
            <button
              onClick={() => handleExportCSV("Bank_Book", bankEntries.map((e) => ({ Date: e.date, Particulars: e.particulars, Type: e.type, Amount: e.amount })))}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Export CSV
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Total Bank/UPI In</span>
              <span className="text-xl font-black text-emerald-700 block mt-1">{fmt(bankInTotal)}</span>
            </div>
            <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200">
              <span className="text-[10px] font-bold text-rose-600 uppercase">Total Bank Payments Out</span>
              <span className="text-xl font-black text-rose-700 block mt-1">{fmt(bankOutTotal)}</span>
            </div>
            <div className="bg-indigo-600 text-white p-4 rounded-xl shadow-xs">
              <span className="text-[10px] font-bold text-indigo-200 uppercase">Current Net Bank Balance</span>
              <span className="text-2xl font-black text-white block mt-1">{fmt(bankNetBalance)}</span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Particulars / Details</th>
                  <th className="p-3 text-right">Bank In (Debit)</th>
                  <th className="p-3 text-right">Bank Out (Credit)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bankEntries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400 italic">No bank/UPI transactions logged yet</td>
                  </tr>
                ) : (
                  bankEntries.map((e, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3">{e.date}</td>
                      <td className="p-3 font-bold text-slate-800">{e.particulars}</td>
                      <td className="p-3 text-right font-bold text-emerald-600">{e.type === "Debit" ? fmt(e.amount) : "-"}</td>
                      <td className="p-3 text-right font-bold text-rose-600">{e.type === "Credit" ? fmt(e.amount) : "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= 8. OUTSTANDING TAB ================= */}
      {innerTab === "outstanding" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Receivables */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-xs font-black text-rose-600 uppercase tracking-wider">Customer Receivables (Outstanding)</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Money to be collected from customers</p>
              </div>
              <span className="text-sm font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-lg border border-rose-200">
                {fmt(totalCustomerOutstanding)}
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs font-semibold">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Customer</th>
                    <th className="p-2.5">Phone</th>
                    <th className="p-2.5 text-right">Due Amount</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.filter((c) => (c.outstanding || 0) > 0).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-400 italic">No customer outstanding balance! 🎉</td>
                    </tr>
                  ) : (
                    customers
                      .filter((c) => (c.outstanding || 0) > 0)
                      .map((c, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-bold text-slate-800">{c.name}</td>
                          <td className="p-2.5 text-slate-500">{c.phone}</td>
                          <td className="p-2.5 text-right font-black text-rose-600">{fmt(c.outstanding)}</td>
                          <td className="p-2.5 text-center">
                            <button
                              onClick={() => {
                                setCustPayId(c.id);
                                setShowCustPayModal(true);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              Collect
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Supplier Payables */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-xs font-black text-amber-600 uppercase tracking-wider">Supplier Payables (Outstanding)</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Money owed to rice mill suppliers</p>
              </div>
              <span className="text-sm font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
                {fmt(totalSupplierOutstanding)}
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs font-semibold">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Supplier Mill</th>
                    <th className="p-2.5">Phone</th>
                    <th className="p-2.5 text-right">Payable Amount</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {suppliers.filter((s) => (s.outstanding || 0) > 0).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-400 italic">No supplier payable balance! 🎉</td>
                    </tr>
                  ) : (
                    suppliers
                      .filter((s) => (s.outstanding || 0) > 0)
                      .map((s, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-bold text-slate-800">{s.name}</td>
                          <td className="p-2.5 text-slate-500">{s.phone}</td>
                          <td className="p-2.5 text-right font-black text-amber-600">{fmt(s.outstanding)}</td>
                          <td className="p-2.5 text-center">
                            <button
                              onClick={() => {
                                setSuppPayId(s.id);
                                setShowSuppPayModal(true);
                              }}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              Pay
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= 9. DAY BOOK TAB ================= */}
      {innerTab === "daybook" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-black text-slate-800 uppercase">📅 Day Book Daily Audit Journal</h2>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">Chronological record of all transactions on the selected date</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Select Date:</label>
              <input
                type="date"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Ref ID</th>
                  <th className="p-3">Particulars</th>
                  <th className="p-3">Account Group</th>
                  <th className="p-3 text-right">Debit (In)</th>
                  <th className="p-3 text-right">Credit (Out)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dayTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400 italic">No transactions recorded on {selectedDay}</td>
                  </tr>
                ) : (
                  dayTransactions.map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono text-slate-400 text-[10px]">{t.referenceId || t.id}</td>
                      <td className="p-3 font-bold text-slate-800">{t.particulars}</td>
                      <td className="p-3 text-slate-500">{t.accountGroup}</td>
                      <td className="p-3 text-right font-bold text-emerald-600">{t.type === "Debit" ? fmt(t.amount) : "-"}</td>
                      <td className="p-3 text-right font-bold text-rose-600">{t.type === "Credit" ? fmt(t.amount) : "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE / EDIT LEDGER ================= */}
      {showLedgerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 uppercase">
                {editingLedger ? "✏️ Edit Ledger Account" : "📚 Create New Ledger Account"}
              </h3>
              <button onClick={() => setShowLedgerModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveLedger} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Ledger Name *</label>
                <input
                  type="text"
                  value={ledgerForm.name}
                  onChange={(e) => setLedgerForm({ ...ledgerForm, name: e.target.value })}
                  placeholder="e.g. Rice Transport Charges"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Tamil Name (Optional)</label>
                <input
                  type="text"
                  value={ledgerForm.tamilName}
                  onChange={(e) => setLedgerForm({ ...ledgerForm, tamilName: e.target.value })}
                  placeholder="e.g. வாடகை செலவு"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Ledger Type / Group</label>
                <select
                  value={ledgerForm.type}
                  onChange={(e) => setLedgerForm({ ...ledgerForm, type: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                >
                  <option value="Expense">Expense</option>
                  <option value="Income">Income</option>
                  <option value="Bank">Bank Account</option>
                  <option value="Cash">Cash in Hand</option>
                  <option value="Customer">Customer Account</option>
                  <option value="Supplier">Supplier Account</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Opening Balance (₹)</label>
                <input
                  type="number"
                  value={ledgerForm.openingBalance}
                  onChange={(e) => setLedgerForm({ ...ledgerForm, openingBalance: Number(e.target.value) })}
                  placeholder="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Status</label>
                <select
                  value={ledgerForm.status}
                  onChange={(e) => setLedgerForm({ ...ledgerForm, status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLedgerModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer shadow-sm"
                >
                  Save Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE / EDIT INCOME ================= */}
      {showIncomeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 uppercase">
                {editingIncome ? "✏️ Edit Income Entry" : "📈 Record New Income"}
              </h3>
              <button onClick={() => setShowIncomeModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveIncome} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Date</label>
                <input
                  type="date"
                  value={incomeForm.date}
                  onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Income Ledger / Category</label>
                <input
                  type="text"
                  value={incomeForm.category}
                  onChange={(e) => setIncomeForm({ ...incomeForm, category: e.target.value })}
                  placeholder="e.g. Commission, Interest, Scrap Sale"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Payment Mode</label>
                <select
                  value={incomeForm.paymentType}
                  onChange={(e) => setIncomeForm({ ...incomeForm, paymentType: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank / Transfer</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={incomeForm.amount}
                  onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                  placeholder="Enter income amount"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Remarks / Description</label>
                <input
                  type="text"
                  value={incomeForm.remarks}
                  onChange={(e) => setIncomeForm({ ...incomeForm, remarks: e.target.value })}
                  placeholder="Optional details"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIncomeModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-sm"
                >
                  Save Income
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE / EDIT EXPENSE ================= */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 uppercase">
                {editingExpense ? "✏️ Edit Expense Entry" : "📋 Record Shop Expense"}
              </h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveExpense} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Date</label>
                <input
                  type="date"
                  value={expForm.date}
                  onChange={(e) => setExpForm({ ...expForm, date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Expense Category / Ledger</label>
                <select
                  value={expForm.category}
                  onChange={(e) => setExpForm({ ...expForm, category: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                >
                  <option value="Shop Rent">Shop Rent</option>
                  <option value="Electricity Bill">Electricity Bill</option>
                  <option value="Labor & Loading Charges">Labor & Loading Charges</option>
                  <option value="Vehicle Transport">Vehicle Transport</option>
                  <option value="Tea & Refreshments">Tea & Refreshments</option>
                  <option value="Maintenance & Repair">Maintenance & Repair</option>
                  <option value="General Expenses">General Expenses</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Expense Amount (₹)</label>
                <input
                  type="number"
                  value={expForm.amount}
                  onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })}
                  placeholder="Enter amount"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Payment Mode</label>
                <select
                  value={expForm.paymentType}
                  onChange={(e) => setExpForm({ ...expForm, paymentType: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank / Transfer</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Remarks / Description</label>
                <input
                  type="text"
                  value={expForm.note}
                  onChange={(e) => setExpForm({ ...expForm, note: e.target.value })}
                  placeholder="Optional description"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl cursor-pointer shadow-sm"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= CONFIRMATION MODAL: DELETE LEDGER ================= */}
      {deletingLedger && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase">Confirm Delete Ledger</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Are you sure you want to delete ledger <strong className="text-slate-800">"{deletingLedger.name}"</strong>?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeletingLedger(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLedgerConfirm}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CONFIRMATION MODAL: DELETE INCOME ================= */}
      {deletingIncome && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase">Confirm Delete Income Entry</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Are you sure you want to delete this income entry of <strong className="text-emerald-600">{fmt(deletingIncome.amount)}</strong>?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeletingIncome(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteIncomeConfirm}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CONFIRMATION MODAL: DELETE EXPENSE ================= */}
      {deletingExpense && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase">Confirm Delete Expense Entry</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Are you sure you want to delete this expense entry of <strong className="text-rose-600">{fmt(deletingExpense.amount)}</strong>?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeletingExpense(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteExpenseConfirm}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CUSTOMER COLLECTION ================= */}
      {showCustPayModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 uppercase">💵 Collect Customer Payment</h3>
              <button onClick={() => setShowCustPayModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRecordCustomerPayment} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Select Customer</label>
                <select
                  value={custPayId}
                  onChange={(e) => setCustPayId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Due: ₹{c.outstanding || 0})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Collection Amount (₹)</label>
                <input
                  type="number"
                  value={custPayAmount}
                  onChange={(e) => setCustPayAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Payment Mode</label>
                <select
                  value={custPayMode}
                  onChange={(e) => setCustPayMode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank / UPI</option>
                  <option value="Card">Card</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Remarks / Reference</label>
                <input
                  type="text"
                  value={custPayNarration}
                  onChange={(e) => setCustPayNarration(e.target.value)}
                  placeholder="Optional receipt note"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustPayModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-sm"
                >
                  Save Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: SUPPLIER PAYMENT ================= */}
      {showSuppPayModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 uppercase">🏦 Record Supplier Payment</h3>
              <button onClick={() => setShowSuppPayModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRecordSupplierPayment} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Select Supplier</label>
                <select
                  value={suppPayId}
                  onChange={(e) => setSuppPayId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Payable: ₹{s.outstanding || 0})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Payment Amount (₹)</label>
                <input
                  type="number"
                  value={suppPayAmount}
                  onChange={(e) => setSuppPayAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Payment Mode</label>
                <select
                  value={suppPayMode}
                  onChange={(e) => setSuppPayMode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                >
                  <option value="Bank">Bank / UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Note / Reference</label>
                <input
                  type="text"
                  value={suppPayNarration}
                  onChange={(e) => setSuppPayNarration(e.target.value)}
                  placeholder="Optional payment note"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSuppPayModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer shadow-sm"
                >
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export { AccountsModule };
export default AccountsModule;
