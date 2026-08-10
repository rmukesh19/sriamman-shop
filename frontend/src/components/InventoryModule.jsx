import React, { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import {
  Search,
  Layers,
  AlertTriangle,
  FileSpreadsheet
} from "lucide-react";
const InventoryModule = ({
  products: _products = [],
  adjustments: _adjustments = [],
  isOnline,
  onAddAdjustment,
  loadAllData,
  activeSubTabProp
}) => {
  const products = Array.isArray(_products) ? _products : [];
  const adjustments = Array.isArray(_adjustments) ? _adjustments : [];

  const { t, language } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState("ledger");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [selectedProdId, setSelectedProdId] = useState("");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustType, setAdjustType] = useState("Adjustment");
  const [fromGodown, setFromGodown] = useState("Main Godown Erode");
  const [toGodown, setToGodown] = useState("Branch Godown Gobichettipalayam");
  const [adjustReason, setAdjustReason] = useState("");
  React.useEffect(() => {
    if (activeSubTabProp) {
      if (activeSubTabProp === "opening") {
        setActiveSubTab("adjustment");
        setAdjustType("Opening Stock");
      } else if (activeSubTabProp === "entry") {
        setActiveSubTab("adjustment");
        setAdjustType("Adjustment");
      } else if (activeSubTabProp === "adjustment") {
        setActiveSubTab("adjustment");
        setAdjustType("Damage");
      } else if (activeSubTabProp === "transfer") {
        setActiveSubTab("adjustment");
        setAdjustType("Transfer");
      } else if (activeSubTabProp === "warehouse") {
        setActiveSubTab("godowns");
      } else if (activeSubTabProp === "report") {
        setActiveSubTab("ledger");
      } else {
        setActiveSubTab(activeSubTabProp);
      }
    }
  }, [activeSubTabProp]);
  const [godownList, setGodownList] = useState([]);
  const [batches, setBatches] = useState([]);
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.englishName.toLowerCase().includes(searchQuery.toLowerCase()) || p.productCode.toLowerCase().includes(searchQuery.toLowerCase()) || p.tamilName.toLowerCase().includes(searchQuery.toLowerCase());
    const isLow = p.currentStock <= p.minimumStock;
    return filterLowStock ? matchesSearch && isLow : matchesSearch;
  });
  const totalStockValue = products.reduce((sum, p) => sum + p.currentStock * p.purchaseRate, 0);
  const lowStockCount = products.filter((p) => p.currentStock <= p.minimumStock).length;
  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedProdId || !adjustQty) return;
    const prod = products.find((p) => p.id === selectedProdId);
    if (!prod) return;
    const changeQty = Number(adjustQty);
    const reasonDetail = adjustType === "Transfer" ? `Transfer from ${fromGodown} to ${toGodown}. ${adjustReason}` : adjustReason;
    const adjustmentPayload = {
      productId: selectedProdId,
      productName: prod.englishName,
      qty: changeQty,
      type: adjustType,
      reason: reasonDetail
    };
    if (isOnline) {
      try {
        const response = await fetch("/api/inventory/adjustments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(adjustmentPayload)
        });
        if (response.ok) {
          await loadAllData();
          setSelectedProdId("");
          setAdjustQty("");
          setAdjustReason("");
          setActiveSubTab("ledger");
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      onAddAdjustment(adjustmentPayload);
      setActiveSubTab("ledger");
    }
  };
  const exportStockToCSV = () => {
    let headers = "Product Code,Rice Name,HSN,Stock (Bags),Purchase Value,Minimum Limit\n";
    let rows = products.map(
      (p) => `"${p.productCode}","${p.englishName}","${p.hsn}",${p.currentStock},${p.currentStock * p.purchaseRate},${p.minimumStock}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Sri_Amman_Stock_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return <div className="space-y-6 font-semibold select-none text-slate-700">
      
      {
    /* 1. Statistics Cards summary */
  }
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-400 block uppercase font-bold tracking-wider">Total Warehouse Valuation</span>
          <span className="text-xl font-extrabold text-slate-800 mt-1 block">
            {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(totalStockValue)}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold block mt-1.5">Valued on Purchase Rates</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-400 block uppercase font-bold tracking-wider">Low Stock Warnings</span>
          <span className="text-xl font-extrabold text-rose-600 mt-1 block">
            {lowStockCount} Items
          </span>
          <span className="text-[10px] text-rose-500 font-semibold block mt-1.5">Action required immediately</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block uppercase font-bold tracking-wider">Sourcing Godowns</span>
            <span className="text-xl font-extrabold text-blue-600 mt-1 block">3 Active Locations</span>
          </div>
          <Layers className="w-10 h-10 text-blue-500/15" />
        </div>
      </div>

      {/* Header section with title and search/actions */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
            {activeSubTab === "ledger" && "Current Stock Inventory"}
            {activeSubTab === "adjustment" && `Inventory ${adjustType || "Adjustment"}`}
            {activeSubTab === "godowns" && "Godown Sourcing Locations"}
            {activeSubTab === "batches" && "Batch & Quality Control"}
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Real-time stock tracking and warehouse audit</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={exportStockToCSV}
            className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Stock CSV
          </button>
        </div>
      </div>

      {
    /* ==================== SUBTAB: LIVE STOCK LEDGER ==================== */
  }
      {activeSubTab === "ledger" && <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Warehouse Stock Status</h3>
            
            <div className="flex gap-2 w-full sm:w-auto">
              {
    /* Filter Low Stock Switch */
  }
              <button
    onClick={() => setFilterLowStock(!filterLowStock)}
    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${filterLowStock ? "bg-rose-50 border-rose-300 text-rose-700 font-extrabold" : "bg-slate-50 border-slate-200 text-slate-500"}`}
  >
                <AlertTriangle className="w-4 h-4" />
                Show Low Stock Only ({lowStockCount})
              </button>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
    type="text"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none w-52 font-bold"
    placeholder="Search stock list..."
  />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3 text-center">Code</th>
                  <th className="p-3">Rice Variety Name</th>
                  <th className="p-3">HSN</th>
                  <th className="p-3 text-right">Purchase Rate (₹)</th>
                  <th className="p-3 text-center">Stock Bag Size</th>
                  <th className="p-3 text-center">In-Stock Bags</th>
                  <th className="p-3 text-right">In-Stock Value</th>
                  <th className="p-3 text-center">Min Threshold</th>
                  <th className="p-3 text-center">Reorder Trigger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
    const isLow = p.currentStock <= p.minimumStock;
    return <tr key={p.id} className="hover:bg-slate-50/40">
                      <td className="p-3 text-center font-mono text-blue-600 font-bold">{p.productCode}</td>
                      <td className="p-3">
                        <div>
                          <p className="text-slate-800 font-bold">{p.englishName}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{p.tamilName}</p>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-slate-400">{p.hsn}</td>
                      <td className="p-3 text-right">₹{p.purchaseRate}</td>
                      <td className="p-3 text-center">{p.bagSize || "25kg"}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-sm ${isLow ? "text-rose-600 bg-rose-50" : "text-slate-800"}`}>
                          {p.currentStock} Bags
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-slate-800">
                        ₹{p.currentStock * p.purchaseRate}
                      </td>
                      <td className="p-3 text-center text-slate-400">{p.minimumStock} Bags</td>
                      <td className="p-3 text-center">
                        {isLow ? <span className="inline-flex items-center gap-1 text-[10px] bg-rose-50 text-rose-600 border border-rose-100 font-bold px-2 py-0.5 rounded-full animate-pulse">
                            ⚠️ Reorder Now
                          </span> : <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold px-2 py-0.5 rounded-full">
                            ✓ Healthy
                          </span>}
                      </td>
                    </tr>;
  })}
              </tbody>
            </table>
          </div>
        </div>}

      {
    /* ==================== SUBTAB: STOCK ADJUSTMENTS FORM ==================== */
  }
      {activeSubTab === "adjustment" && <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleSaveAdjustment} className="lg:col-span-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4 h-fit">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Log Manual Entry / Leakage</h3>
            
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Rice Variety</label>
              <select
    required
    value={selectedProdId}
    onChange={(e) => setSelectedProdId(e.target.value)}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
  >
                <option value="">-- Choose Rice --</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.englishName} ({p.currentStock} Bags In Stock)</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Adjustment Type</label>
              <select
    value={adjustType}
    onChange={(e) => setAdjustType(e.target.value)}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
  >
                <option value="Adjustment">Stock Adjustment (General)</option>
                <option value="Damage">Damage / Spillage / Moisture Leakage</option>
                <option value="Transfer">Inter-Godown Transfer</option>
                <option value="Return">Supplier Stock Return</option>
                <option value="Opening Stock">Opening Stock Intake</option>
              </select>
            </div>

            {adjustType === "Transfer" && <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">From Location</label>
                  <select
    value={fromGodown}
    onChange={(e) => setFromGodown(e.target.value)}
    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold"
  >
                    <option value="Main Godown Erode">Main Erode</option>
                    <option value="Branch Gobichettipalayam">Gobichettipalayam</option>
                    <option value="Rice Mill Buffer">Mill Buffer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">To Location</label>
                  <select
    value={toGodown}
    onChange={(e) => setToGodown(e.target.value)}
    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold"
  >
                    <option value="Branch Gobichettipalayam">Gobichettipalayam</option>
                    <option value="Main Godown Erode">Main Erode</option>
                    <option value="Rice Mill Buffer">Mill Buffer</option>
                  </select>
                </div>
              </div>}

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Bags Quantity change (Use - for negative/reduction)</label>
              <input
    type="number"
    required
    value={adjustQty}
    onChange={(e) => setAdjustQty(e.target.value)}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
    placeholder="e.g. -5 or 20"
  />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Reason / Remarks / Incident Log</label>
              <textarea
    required
    value={adjustReason}
    onChange={(e) => setAdjustReason(e.target.value)}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold h-20"
    placeholder="e.g. Damaged due to water leakage / Monthly stock taking discrepancy."
  />
            </div>

            <button
    type="submit"
    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-blue-500/15"
  >
              Log Stock Transaction
            </button>
          </form>

          {
    /* Sourcing logs history list */
  }
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Historical Stock Adjustments Registry</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-3">Rice variety</th>
                    <th className="p-3 text-center">Change Qty</th>
                    <th className="p-3 text-center">Adjustment Type</th>
                    <th className="p-3">Remarks / References</th>
                    <th className="p-3 text-center">Entry Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adjustments.map((a) => <tr key={a.id}>
                      <td className="p-3 font-bold text-slate-800">{a.productName}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold ${a.qty > 0 ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"}`}>
                          {a.qty > 0 ? `+${a.qty}` : a.qty} Bags
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 border rounded bg-slate-50 text-slate-600">
                          {a.type}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 max-w-xs truncate" title={a.reason}>{a.reason}</td>
                      <td className="p-3 text-center text-slate-400">{a.date?.split(" ")[0]}</td>
                    </tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </div>}

      {
    /* ==================== SUBTAB: WAREHOUSE DISTRIBUTION ==================== */
  }
      {activeSubTab === "godowns" && <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {godownList.map((g) => <div key={g.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <span className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </span>
                <span className="px-2 py-0.5 text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-full">
                  {g.status}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800">{g.name}</h4>
                <p className="text-xs text-slate-400 mt-1">Designated capacity: {g.capacity}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>Current Bags Count</span>
                  <span className="text-slate-800 font-extrabold">{g.itemsCount} Bags</span>
                </div>
              </div>
            </div>)}
        </div>}

      {
    /* ==================== SUBTAB: BATCH QUALITY LOGS ==================== */
  }
      {activeSubTab === "batches" && <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Batch Inspection &amp; Packing Quality Register</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3">Rice Variety Name</th>
                  <th className="p-3">Batch Number</th>
                  <th className="p-3 text-center">Packing Date</th>
                  <th className="p-3 text-center">Moisture Content</th>
                  <th className="p-3 text-center">Bag weight unit</th>
                  <th className="p-3 text-center">Rice Grade</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((b) => <tr key={b.id}>
                    <td className="p-3 font-bold text-slate-800">{b.productName}</td>
                    <td className="p-3 font-mono text-blue-600 font-bold">{b.batchNo}</td>
                    <td className="p-3 text-center text-slate-400">{b.packingDate}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-slate-50 text-slate-600 border border-slate-200 font-bold">
                        {b.moisture}
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold">{b.weight}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded border border-blue-100">
                        {b.grade}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold px-2 py-0.5 rounded-full">
                        ✓ Quality OK
                      </span>
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </div>}

    </div>;
};
export {
  InventoryModule
};
