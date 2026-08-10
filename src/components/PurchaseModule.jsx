import { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import {
  Plus,
  Search,
  Save,
  X,
  Printer,
  ArrowDownLeft,
  Trash2,
  Edit2,
  Eye,
  RefreshCw,
  TrendingDown
} from "lucide-react";
const PurchaseModule = ({
  products: _products = [],
  suppliers: _suppliers = [],
  purchases: _purchases = [],
  purchaseReturns: _purchaseReturns = [],
  expenses: _expenses = [],
  ledger: _ledger = [],
  isOnline,
  onAddSupplier,
  onUpdateSupplier,
  loadAllData,
  activeSubTabProp
}) => {
  const products = Array.isArray(_products) ? _products : [];
  const suppliers = Array.isArray(_suppliers) ? _suppliers : [];
  const purchases = Array.isArray(_purchases) ? _purchases : [];
  const purchaseReturns = Array.isArray(_purchaseReturns) ? _purchaseReturns : [];
  const expenses = Array.isArray(_expenses) ? _expenses : [];
  const ledger = Array.isArray(_ledger) ? _ledger : [];

  const { t, language } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState("history");
  const [showAddReturnModal, setShowAddReturnModal] = useState(false);
  const [retSupplierId, setRetSupplierId] = useState("");
  const [retAmount, setRetAmount] = useState("");
  const [retReason, setRetReason] = useState("");
  useEffect(() => {
    if (activeSubTabProp) {
      if (activeSubTabProp === "payment") {
        setActiveSubTab("suppliers");
      } else if (activeSubTabProp === "return") {
        setActiveSubTab("return");
      } else if (activeSubTabProp === "order") {
        setActiveSubTab("order");
      } else {
        setActiveSubTab(activeSubTabProp);
      }
    }
  }, [activeSubTabProp]);
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("2026-07-01");
  const [toDate, setToDate] = useState("2026-07-31");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [purchaseItems, setPurchaseItems] = useState([]);
  const [currentItemId, setCurrentItemId] = useState("");
  const [currentQty, setCurrentQty] = useState("");
  const [currentRate, setCurrentRate] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [purchaseStatus, setPurchaseStatus] = useState("Received");
  const [purchasePaymentType, setPurchasePaymentType] = useState("Bank");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paySupplierId, setPaySupplierId] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");
  const [payMethod, setPayMethod] = useState("Bank");
  const [printingPurchase, setPrintingPurchase] = useState(null);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [viewingPurchase, setViewingPurchase] = useState(null);
  const [editingReturn, setEditingReturn] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmDeleteType, setConfirmDeleteType] = useState(null);
  const [confirmDeleteOnYes, setConfirmDeleteOnYes] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const addAuditLog = (action) => {
    const newLog = {
      id: `audit-${Date.now()}`,
      user: "Admin",
      action,
      date: (/* @__PURE__ */ new Date()).toLocaleString()
    };
    setAuditLogs([newLog, ...auditLogs]);
  };
  useEffect(() => {
    if (suppliers.length > 0 && !selectedSupplierId) {
      setSelectedSupplierId(suppliers[0].id);
    }
  }, [suppliers]);
  const calculateSubtotal = () => {
    return purchaseItems.reduce((sum, item) => sum + item.qty * item.rate, 0);
  };
  const calculateTotal = () => {
    const sub = calculateSubtotal();
    return Math.round(sub);
  };
  const handleAddItem = () => {
    if (!currentItemId || !currentQty || !currentRate) return;
    const prod = products.find((p) => p.id === currentItemId);
    if (!prod) return;
    const existingIndex = purchaseItems.findIndex((i) => i.productId === currentItemId);
    if (existingIndex !== -1) {
      const updated = [...purchaseItems];
      updated[existingIndex].qty += Number(currentQty);
      updated[existingIndex].total = updated[existingIndex].qty * updated[existingIndex].rate;
      setPurchaseItems(updated);
    } else {
      setPurchaseItems([...purchaseItems, {
        productId: prod.id,
        englishName: prod.englishName,
        qty: Number(currentQty),
        rate: Number(currentRate),
        total: Number(currentQty) * Number(currentRate)
      }]);
    }
    setCurrentQty("");
    setCurrentRate("");
  };
  const handleRemoveItem = (idx) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== idx));
  };
  const handleSavePurchase = async (e) => {
    e.preventDefault();
    if (purchaseItems.length === 0 || !selectedSupplierId) return;
    const supplierObj = suppliers.find((s) => s.id === selectedSupplierId);
    if (!supplierObj) return;
    const total = calculateTotal();
    const paid = Number(paidAmount) || 0;
    const balance = Math.max(total - paid, 0);
    const purchasePayload = {
      supplierId: selectedSupplierId,
      supplierName: supplierObj.name,
      total,
      paidAmount: paid,
      balance,
      items: purchaseItems,
      status: purchaseStatus,
      paymentType: purchasePaymentType
    };
    if (isOnline) {
      try {
        const url = editingPurchase ? `/api/purchases/${editingPurchase.id}` : "/api/purchases";
        const method = editingPurchase ? "PUT" : "POST";
        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(purchasePayload)
        });
        if (response.ok) {
          if (editingPurchase) {
            addAuditLog(`Updated Purchase Entry ${editingPurchase.purchaseNo} for ₹${total}`);
          } else {
            addAuditLog(`Created Purchase Entry from ${supplierObj.name} for ₹${total}`);
          }
          await loadAllData();
          setPurchaseItems([]);
          setPaidAmount("");
          setPurchasePaymentType("Bank");
          setEditingPurchase(null);
          setActiveSubTab("history");
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      alert("Operating offline. Purchases are synced when online.");
    }
  };
  const startEditPurchase = (p) => {
    setEditingPurchase(p);
    setSelectedSupplierId(p.supplierId);
    setPurchaseItems(p.items || []);
    setPaidAmount(String(p.paidAmount || ""));
    setPurchaseStatus(p.status || "Received");
    setPurchasePaymentType(p.paymentType || "Bank");
    setActiveSubTab("entry");
  };
  const cancelEditPurchase = () => {
    setEditingPurchase(null);
    setSelectedSupplierId(suppliers[0]?.id || "");
    setPurchaseItems([]);
    setPaidAmount("");
    setPurchaseStatus("Received");
    setPurchasePaymentType("Bank");
    setActiveSubTab("history");
  };
  const handleDeletePurchase = (id) => {
    setConfirmDeleteId(id);
    setConfirmDeleteType("purchase");
    setConfirmDeleteOnYes(() => async () => {
      try {
        const response = await fetch(`/api/purchases/${id}`, { method: "DELETE" });
        if (response.ok) {
          addAuditLog("Deleted Sourcing Purchase Entry");
          await loadAllData();
        }
      } catch (err) {
        console.error(err);
      }
    });
  };
  const handleSupplierPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paySupplierId || !payAmount) return;
    const supplierObj = suppliers.find((s) => s.id === paySupplierId);
    if (!supplierObj) return;
    const amountNum = Number(payAmount);
    if (isOnline) {
      try {
        if (editingPayment) {
          // Edit existing payment
          const oldAmount = editingPayment.amount;
          const netChange = oldAmount - amountNum;
          const updatedSupplier = {
            ...supplierObj,
            outstanding: Math.max(0, supplierObj.outstanding + netChange)
          };
          const resSupp = await fetch(`/api/suppliers/${paySupplierId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedSupplier)
          });
          if (resSupp.ok) {
            await fetch(`/api/expenses/${editingPayment.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...editingPayment,
                amount: amountNum,
                note: `Paid ${supplierObj.name} via ${payMethod}. Ref: ${payNote || "N/A"}`,
                paymentType: payMethod
              })
            });
            addAuditLog(`Updated Sourcing Payment to ${supplierObj.name} from ₹${oldAmount} to ₹${amountNum}`);
            await loadAllData();
            setShowPaymentModal(false);
            setEditingPayment(null);
            setPayAmount("");
            setPayNote("");
          }
        } else {
          // Create new payment
          const updatedSupplier = {
            ...supplierObj,
            outstanding: Math.max(supplierObj.outstanding - amountNum, 0)
          };
          const response = await fetch(`/api/suppliers/${paySupplierId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedSupplier)
          });
          if (response.ok) {
            await fetch("/api/expenses", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                category: "Supplier Settlement",
                amount: amountNum,
                note: `Paid ${supplierObj.name} via ${payMethod}. Ref: ${payNote || "N/A"}`,
                paymentType: payMethod
              })
            });
            addAuditLog(`Settled ₹${amountNum} to Supplier: ${supplierObj.name}`);
            await loadAllData();
            setShowPaymentModal(false);
            setPayAmount("");
            setPayNote("");
          }
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      alert("Offline Mode: Settlement cannot be processed.");
    }
  };
  const startEditPayment = (exp) => {
    setEditingPayment(exp);
    const supp = suppliers.find(s => exp.note.includes(s.name));
    if (supp) {
      setPaySupplierId(supp.id);
    }
    setPayAmount(String(exp.amount));
    setPayMethod(exp.paymentType || "Bank");
    const refMatch = exp.note.match(/Ref: (.*)$/);
    setPayNote(refMatch ? refMatch[1] : "");
    setShowPaymentModal(true);
  };
  const handleDeletePayment = (expense) => {
    setConfirmDeleteId(expense.id);
    setConfirmDeleteType("payment");
    setConfirmDeleteOnYes(() => async () => {
      try {
        const response = await fetch(`/api/expenses/${expense.id}`, { method: "DELETE" });
        if (response.ok) {
          const supplierObj = suppliers.find(s => expense.note.includes(s.name));
          if (supplierObj) {
            const updatedSupplier = {
              ...supplierObj,
              outstanding: supplierObj.outstanding + expense.amount
            };
            await fetch(`/api/suppliers/${supplierObj.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updatedSupplier)
            });
          }
          addAuditLog("Deleted Sourcing Payment");
          await loadAllData();
        }
      } catch (err) {
        console.error(err);
      }
    });
  };
  const handleSaveReturnSubmit = async (e) => {
    e.preventDefault();
    if (!retSupplierId || !retAmount) return;
    const supp = suppliers.find((s) => s.id === retSupplierId);
    if (!supp) return;
    const returnPayload = {
      supplierId: retSupplierId,
      supplierName: supp.name,
      total: Number(retAmount) || 0,
      itemsCount: 5,
      reason: retReason,
      status: "Processed"
    };
    if (isOnline) {
      try {
        const url = editingReturn ? `/api/purchase-returns/${editingReturn.id}` : "/api/purchase-returns";
        const method = editingReturn ? "PUT" : "POST";
        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(returnPayload)
        });
        if (response.ok) {
          if (editingReturn) {
            addAuditLog(`Updated Purchase Return for ${supp.name}`);
          } else {
            addAuditLog(`Recorded Purchase Return to ${supp.name}`);
          }
          await loadAllData();
          setShowAddReturnModal(false);
          setEditingReturn(null);
          setRetAmount("");
          setRetReason("");
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      alert("Operating offline. Cannot sync return.");
    }
  };
  const startEditReturn = (ret) => {
    setEditingReturn(ret);
    setRetSupplierId(ret.supplierId);
    setRetAmount(String(ret.total));
    setRetReason(ret.reason);
    setShowAddReturnModal(true);
  };
  const handleDeleteReturn = (id) => {
    setConfirmDeleteId(id);
    setConfirmDeleteType("return");
    setConfirmDeleteOnYes(() => async () => {
      try {
        const response = await fetch(`/api/purchase-returns/${id}`, { method: "DELETE" });
        if (response.ok) {
          addAuditLog("Deleted Sourcing Return Entry");
          await loadAllData();
        }
      } catch (err) {
        console.error(err);
      }
    });
  };
  const exportToCSV = () => {
    let headers = "Purchase No,Supplier,Date,Total Amount,Paid Amount,Balance,Status\n";
    let rows = purchases.map(
      (p) => `"${p.purchaseNo}","${p.supplierName}","${p.date}",${p.total},${p.paidAmount},${p.balance},"${p.status}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Sri_Amman_Purchases_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addAuditLog("Exported Purchase History to Excel CSV");
  };
  const filteredPurchases = purchases.filter((p) => {
    const matchesSearch = p.purchaseNo.toLowerCase().includes(searchQuery.toLowerCase()) || p.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = p.date >= fromDate && p.date <= toDate;
    return matchesSearch && matchesDate;
  });
  return <div className="space-y-6 select-none font-semibold text-slate-700">
      
      {
    /* 1. Header controls (no internal tab buttons) */
  }
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
          {activeSubTab === "history" && "Purchase Sourcing Logs"}
          {activeSubTab === "order" && "Purchase Orders"}
          {activeSubTab === "entry" && "New Purchase Entry"}
          {activeSubTab === "suppliers" && "Supplier Payables"}
          {activeSubTab === "return" && "Purchase Returns"}
        </h2>

        {["history", "order", "return"].includes(activeSubTab) && <div className="flex items-center gap-2">
            <input
    type="date"
    value={fromDate}
    onChange={(e) => setFromDate(e.target.value)}
    className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-none"
  />
            <span className="text-xs text-slate-400">to</span>
            <input
    type="date"
    value={toDate}
    onChange={(e) => setToDate(e.target.value)}
    className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-none"
  />
            <button
    onClick={exportToCSV}
    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
  >
              Excel Export
            </button>
          </div>}
      </div>

      {
    /* ==================== SUBTAB: HISTORY / ORDER ==================== */
  }
      {(activeSubTab === "history" || activeSubTab === "order") && <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Sourcing Logs</h3>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
    type="text"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none w-60"
    placeholder="Search purchase no, supplier..."
  />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3 text-center">Purchase No</th>
                  <th className="p-3">Supplier Name</th>
                  <th className="p-3 text-center">Date</th>
                  <th className="p-3 text-right">Purchase Total (₹)</th>
                  <th className="p-3 text-right">Paid Amount (₹)</th>
                  <th className="p-3 text-right">Balance Due (₹)</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Print</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPurchases.map((p) => {
                  const tot = p.grandTotal !== undefined ? p.grandTotal : p.total || 0;
                  const paid = p.paidAmount || 0;
                  const bal = p.balance !== undefined ? p.balance : Math.max(0, tot - paid);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/40">
                      <td className="p-3 text-center font-mono text-blue-600 font-bold">{p.purchaseNo}</td>
                      <td className="p-3 font-bold text-slate-800">{p.supplierName}</td>
                      <td className="p-3 text-center text-slate-500 font-mono">{p.date}</td>
                      <td className="p-3 text-right font-black text-slate-900">₹{tot.toLocaleString("en-IN")}</td>
                      <td className="p-3 text-right text-emerald-600 font-bold">₹{paid.toLocaleString("en-IN")}</td>
                      <td className="p-3 text-right text-rose-600 font-bold">₹{bal.toLocaleString("en-IN")}</td>
                      <td className="p-3 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setPrintingPurchase(p)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 cursor-pointer"
                          title="Print Purchase Order Receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </td>
                      <td className="p-3 text-center">
                      <div className="flex justify-center items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingPurchase(p)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded border border-slate-200"
                          title="View Sourcing Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditPurchase(p)}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded border border-blue-200"
                          title="Edit Sourcing Entry"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePurchase(p.id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded border border-rose-200"
                          title="Delete Sourcing Entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        </div>}

      {
    /* ==================== SUBTAB: ENTRY FORM ==================== */
  }
      {activeSubTab === "entry" && <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {
    /* Sourcing Item entry panel */
  }
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Add Sourced Rice Bags</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Rice Type</label>
                  <select
    value={currentItemId}
    onChange={(e) => {
      setCurrentItemId(e.target.value);
      const selected = products.find((p) => p.id === e.target.value);
      if (selected) setCurrentRate(String(selected.purchaseRate));
    }}
    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold"
  >
                    <option value="">-- Choose Rice --</option>
                    {products.filter((p) => p.status !== "Inactive").map((p) => <option key={p.id} value={p.id}>{p.englishName} ({p.bagSize})</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Quantity (Bags)</label>
                  <input
    type="number"
    value={currentQty}
    onChange={(e) => setCurrentQty(e.target.value)}
    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold"
    placeholder="10"
  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Purchase Rate (₹)</label>
                  <input
    type="number"
    value={currentRate}
    onChange={(e) => setCurrentRate(e.target.value)}
    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold"
    placeholder="1200"
  />
                </div>

                <div className="sm:col-span-4 flex justify-end">
                  <button
    type="button"
    onClick={handleAddItem}
    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
  >
                    <Plus className="w-4 h-4" /> Add to List
                  </button>
                </div>
              </div>

              {
    /* Items Table */
  }
              <div className="border border-slate-100 rounded-xl overflow-hidden mt-4">
                <table className="w-full text-left text-xs font-semibold">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="p-3">Sourced Rice</th>
                      <th className="p-3 text-center">Bags Sourced</th>
                      <th className="p-3 text-right">Bag Rate (₹)</th>
                      <th className="p-3 text-right">Subtotal</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {purchaseItems.map((item, idx) => <tr key={idx}>
                        <td className="p-3 text-slate-800 font-bold">{item.englishName}</td>
                        <td className="p-3 text-center font-bold">{item.qty} Bags</td>
                        <td className="p-3 text-right">₹{item.rate}</td>
                        <td className="p-3 text-right font-bold">₹{item.total}</td>
                        <td className="p-3 text-center">
                          <button
    type="button"
    onClick={() => handleRemoveItem(idx)}
    className="p-1 text-slate-400 hover:text-rose-600 rounded"
  >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>)}
                    {purchaseItems.length === 0 && <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">
                          Sourced items list is empty. Add rice bags above.
                        </td>
                      </tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {
    /* Sourcing Summary Sidebar */
  }
          <form onSubmit={handleSavePurchase} className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            {editingPurchase && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-xs font-bold flex justify-between items-center mb-1">
                <span>Editing {editingPurchase.purchaseNo}</span>
                <button
                  type="button"
                  onClick={cancelEditPurchase}
                  className="px-2 py-1 bg-amber-200 hover:bg-amber-300 rounded text-[10px] text-amber-900 font-extrabold"
                >
                  Cancel Edit
                </button>
              </div>
            )}
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Sourcing Invoice Details</h3>
            
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Sourcing Supplier Mill</label>
              <select
    required
    value={selectedSupplierId}
    onChange={(e) => setSelectedSupplierId(e.target.value)}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
  >
                <option value="">-- Choose Supplier Mill --</option>
                {suppliers.filter((s) => s.status !== "Inactive" || s.id === selectedSupplierId).map((s) => <option key={s.id} value={s.id}>{s.name} ({s.companyName})</option>)}
              </select>
            </div>

            <hr className="border-slate-100" />

            <div className="bg-slate-50 p-4 rounded-xl space-y-2.5 border border-slate-100">
              <div className="flex justify-between text-base font-black text-slate-800">
                <span>Grand Total</span>
                <span className="text-blue-600">₹{calculateTotal()}</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Amount Paid (₹)</label>
              <input
    type="number"
    value={paidAmount}
    onChange={(e) => setPaidAmount(e.target.value)}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
    placeholder={String(calculateTotal())}
  />
            </div>

            {Number(paidAmount) > 0 && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Payment Mode</label>
                <select
                  value={purchasePaymentType}
                  onChange={(e) => setPurchasePaymentType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                >
                  <option value="Bank">Bank / UPI</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sourcing Status</label>
              <select
    value={purchaseStatus}
    onChange={(e) => setPurchaseStatus(e.target.value)}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
  >
                <option value="Received">Received &amp; Stock In</option>
                <option value="Pending">Pending Delivery</option>
              </select>
            </div>

            <button
    type="submit"
    disabled={purchaseItems.length === 0}
    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-blue-500/15 flex justify-center items-center gap-1.5 uppercase tracking-wide"
  >
              <Save className="w-4 h-4" /> {editingPurchase ? "Update Purchase Sourcing Order" : "Save Purchase Sourcing Order"}
            </button>
          </form>
        </div>}

      {
    /* ==================== SUBTAB: SUPPLIERS PAYABLES ==================== */
  }
      {activeSubTab === "suppliers" && <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Mill Debts Summary</h3>
            <button
    onClick={() => {
      if (suppliers.length > 0) {
        setPaySupplierId(suppliers[0].id);
        setShowPaymentModal(true);
      }
    }}
    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
  >
              <ArrowDownLeft className="w-4 h-4" /> Record Sourcing Payment
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3">Supplier Name</th>
                  <th className="p-3">Company Name / Mill Location</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3 text-right">Outstanding Debt (₹)</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliers.filter((s) => s.status !== "Inactive").map((s) => <tr key={s.id}>
                    <td className="p-3 font-bold text-slate-800">{s.name}</td>
                    <td className="p-3 text-slate-500">{s.companyName}</td>
                    <td className="p-3 font-mono">{s.phone}</td>
                    <td className="p-3 text-right text-rose-600 font-extrabold">₹{s.outstanding}</td>
                    <td className="p-3 text-center">
                      <button
    onClick={() => {
      setPaySupplierId(s.id);
      setShowPaymentModal(true);
    }}
    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[11px] font-bold border border-blue-200"
  >
                        Settle Debt
                      </button>
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>

          <hr className="border-slate-100 my-6" />

          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Recorded Supplier Settlements (Payments)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-3">Reference / Note</th>
                    <th className="p-3">Payment Type</th>
                    <th className="p-3 text-right">Amount Settled (₹)</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {expenses.filter(e => e.category === "Supplier Settlement").map((exp) => (
                    <tr key={exp.id}>
                      <td className="p-3 font-bold text-slate-800">{exp.note}</td>
                      <td className="p-3 text-slate-500 font-bold">{exp.paymentType || "Bank"}</td>
                      <td className="p-3 text-right text-emerald-600 font-extrabold">₹{exp.amount}</td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => startEditPayment(exp)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded border border-blue-200"
                            title="Edit Payment"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePayment(exp)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded border border-rose-200"
                            title="Delete Payment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {expenses.filter(e => e.category === "Supplier Settlement").length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-400 font-semibold">
                        No settlements recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>}

      {
    /* ==================== SUBTAB: PURCHASE RETURNS ==================== */
  }
      {activeSubTab === "return" && <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Supplier Returns Registry</h3>
            <button
    onClick={() => {
      if (suppliers.length > 0) {
        setRetSupplierId(suppliers[0].id);
        setRetAmount("");
        setRetReason("");
        setShowAddReturnModal(true);
      }
    }}
    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/10 active:scale-95 transition-all"
  >
              <Plus className="w-4 h-4" /> Record Purchase Return
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3">Return No</th>
                  <th className="p-3">Supplier Name</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Returned Bags</th>
                  <th className="p-3">Reason for Return</th>
                  <th className="p-3 text-right">Refund / Credit (₹)</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchaseReturns.map((ret) => <tr key={ret.id}>
                    <td className="p-3 font-mono text-blue-600 font-bold">{ret.returnNo}</td>
                    <td className="p-3 font-bold text-slate-800">{ret.supplierName}</td>
                    <td className="p-3 text-slate-400 font-mono">{ret.date}</td>
                    <td className="p-3 text-right font-bold">{ret.itemsCount} Bags</td>
                    <td className="p-3 text-slate-500 font-medium">{ret.reason}</td>
                    <td className="p-3 text-right text-emerald-600 font-extrabold">₹{ret.total}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-bold border border-emerald-100">
                        {ret.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => startEditReturn(ret)}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded border border-blue-200"
                          title="Edit Return"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReturn(ret.id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded border border-rose-200"
                          title="Delete Return"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>)}
                {purchaseReturns.length === 0 && <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No purchase returns recorded in this period.
                    </td>
                  </tr>}
              </tbody>
            </table>
          </div>

          {
    /* ADD RETURN MODAL */
  }
          {showAddReturnModal && <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center p-4 animate-fade-in">
              <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative border border-slate-100 space-y-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddReturnModal(false);
                    setEditingReturn(null);
                    setRetAmount("");
                    setRetReason("");
                  }}
                  className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  {editingReturn ? "Edit Supplier Return" : "Record Supplier Return"}
                </h3>

                <form onSubmit={handleSaveReturnSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Sourcing Supplier</label>
                    <select
                      required
                      value={retSupplierId}
                      onChange={(e) => setRetSupplierId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                    >
                      {suppliers.filter((s) => s.status !== "Inactive" || s.id === retSupplierId).map((s) => <option key={s.id} value={s.id}>{s.name} ({s.companyName})</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Returned Bags</label>
                      <input
                        type="number"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                        placeholder="5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Estimated Credit (₹)</label>
                      <input
                        type="number"
                        required
                        value={retAmount}
                        onChange={(e) => setRetAmount(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                        placeholder="6000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Reason for Return</label>
                    <input
                      type="text"
                      required
                      value={retReason}
                      onChange={(e) => setRetReason(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                      placeholder="E.g., high moisture, torn packaging"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-lg active:scale-95 transition-all"
                  >
                    {editingReturn ? "Update Return Outflow" : "Confirm Return Outflow"}
                  </button>
                </form>
              </div>
            </div>}
        </div>}

      {
    /* ==================== AUDIT LOGS DISPLAY ==================== */
  }
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 mb-3">Audit Logs &amp; Activity</h3>
        <div className="divide-y divide-slate-50 max-h-32 overflow-y-auto text-xs font-bold text-slate-500 space-y-1.5">
          {auditLogs.map((log) => <div key={log.id} className="flex justify-between items-center py-1.5">
              <span className="text-slate-800">{log.action}</span>
              <span className="text-[10px] text-slate-400 font-mono font-bold">{log.date} by {log.user}</span>
            </div>)}
        </div>
      </div>

      {
    /* ==================== RECORD PAYMENT MODAL ==================== */
  }
      {showPaymentModal && <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center p-4">
          <form onSubmit={handleSupplierPaymentSubmit} className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative border border-slate-100 space-y-4">
            <button
    type="button"
    onClick={() => setShowPaymentModal(false)}
    className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
  >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Record Sourcing Settlement</h3>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Sourcing Supplier</label>
              <select
    required
    value={paySupplierId}
    onChange={(e) => setPaySupplierId(e.target.value)}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
  >
                {suppliers.filter((s) => s.status !== "Inactive" || s.id === paySupplierId).map((s) => <option key={s.id} value={s.id}>{s.name} (O/S Due: ₹{s.outstanding})</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Payment Amount (₹)</label>
              <input
    type="number"
    required
    value={payAmount}
    onChange={(e) => setPayAmount(e.target.value)}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
    placeholder="20000"
  />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Transaction Method</label>
              <select
    value={payMethod}
    onChange={(e) => setPayMethod(e.target.value)}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
  >
                <option value="Bank">Bank Transfer / IMPS / NEFT</option>
                <option value="UPI">UPI / Business GPay</option>
                <option value="Cash">Cash Drawer Outflow</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Reference Note (Cheque/Tx ID)</label>
              <input
    type="text"
    value={payNote}
    onChange={(e) => setPayNote(e.target.value)}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
    placeholder="TXN19382029302"
  />
            </div>

            <button
    type="submit"
    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-blue-500/15"
  >
              Record Payment Outflow
            </button>
          </form>
        </div>}

      {
    /* ==================== PRINT SOURCING PREVIEW OVERLAY ==================== */
  }
      {printingPurchase && <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-100 relative">
            <button
    onClick={() => setPrintingPurchase(null)}
    className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
  >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pb-4 border-b border-dashed border-slate-200">
              <h2 className="text-base font-black text-slate-800">SRI AMMAN TRADERS</h2>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">Sourcing Purchase Receipt</p>
            </div>

            <div className="py-4 text-xs font-semibold space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Purchase No:</span>
                <span className="font-mono font-bold text-slate-800">{printingPurchase.purchaseNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Supplier Mill:</span>
                <span className="text-slate-800">{printingPurchase.supplierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Receipt Date:</span>
                <span className="text-slate-800">{printingPurchase.date}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-200 py-3 space-y-2">
              <div className="flex justify-between text-[11px] font-bold text-slate-400">
                <span>Rice Sourced</span>
                <span>Qty x Rate</span>
                <span className="text-right">Total</span>
              </div>
              {printingPurchase.items?.map((item, idx) => <div key={idx} className="flex justify-between text-xs font-bold text-slate-700">
                  <span>{item.englishName}</span>
                  <span>{item.qty} Bags x ₹{item.rate}</span>
                  <span className="text-right">₹{item.total}</span>
                </div>)}
            </div>

            <div className="border-t border-dashed border-slate-200 pt-3 space-y-1.5 text-xs font-bold">
              <div className="flex justify-between text-slate-900 text-sm font-black">
                <span>Grand Total Amount</span>
                <span>₹{printingPurchase.total}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Paid Outflow</span>
                <span>₹{printingPurchase.paidAmount}</span>
              </div>
              {printingPurchase.balance > 0 && <div className="flex justify-between text-rose-600">
                  <span>Payable Debt Balance</span>
                  <span>₹{printingPurchase.balance}</span>
                </div>}
            </div>

            <div className="mt-6 flex gap-2">
              <button
    onClick={() => window.print()}
    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex justify-center items-center gap-1.5 shadow-md shadow-blue-500/10"
  >
                <Printer className="w-4 h-4" /> Print PDF / Receipt
              </button>
            </div>
          </div>
        </div>}

      {/* ==================== VIEW DETAILS MODAL ==================== */}
      {viewingPurchase && <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative border border-slate-100 space-y-4">
            <button
              onClick={() => setViewingPurchase(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Purchase Sourcing Order Details</h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Purchase No</span>
                <span className="font-mono font-bold text-blue-600">{viewingPurchase.purchaseNo}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Supplier Mill</span>
                <span className="font-bold text-slate-800">{viewingPurchase.supplierName}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Date Sourced</span>
                <span className="text-slate-600 font-mono">{viewingPurchase.date}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Payment Mode</span>
                <span className="font-bold text-slate-700">{viewingPurchase.paymentType || "Bank"}</span>
              </div>
            </div>

            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold">
                  <tr>
                    <th className="p-3">Sourced Rice</th>
                    <th className="p-3 text-center">Bags Sourced</th>
                    <th className="p-3 text-right">Bag Rate (₹)</th>
                    <th className="p-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {viewingPurchase.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-bold text-slate-800">{item.englishName}</td>
                      <td className="p-3 text-center font-mono">{item.qty} Bags</td>
                      <td className="p-3 text-right font-mono">₹{item.rate}</td>
                      <td className="p-3 text-right font-mono font-bold">₹{item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <div className="w-full sm:w-64 space-y-1.5 text-xs font-bold bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between text-slate-800 text-sm font-black">
                  <span>Grand Total</span>
                  <span className="text-blue-600">₹{viewingPurchase.total}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>Amount Paid</span>
                  <span>₹{viewingPurchase.paidAmount}</span>
                </div>
                {viewingPurchase.balance > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Balance Due</span>
                    <span>₹{viewingPurchase.balance}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setViewingPurchase(null);
                  setPrintingPurchase(viewingPurchase);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
              <button
                onClick={() => setViewingPurchase(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>}

      {/* ==================== UNIFIED CONFIRM DELETE DIALOG ==================== */}
      {confirmDeleteId && <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex justify-center items-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Confirm Removal</h4>
              <p className="text-xs font-semibold text-slate-500 mt-1">Are you sure you want to delete this record?</p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmDeleteId(null);
                  setConfirmDeleteType(null);
                  setConfirmDeleteOnYes(null);
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (confirmDeleteOnYes) {
                    await confirmDeleteOnYes();
                  }
                  setConfirmDeleteId(null);
                  setConfirmDeleteType(null);
                  setConfirmDeleteOnYes(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
              >
                Yes
              </button>
            </div>
          </div>
        </div>}

    </div>;
};
export {
  PurchaseModule
};
