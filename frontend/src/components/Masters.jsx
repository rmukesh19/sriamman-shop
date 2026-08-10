import React, { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Printer,
  Eye,
  Upload,
  Package,
  User,
  Building,
  Home,
  CheckCircle,
  Tag
} from "lucide-react";

const Masters = ({
  products: _products = [],
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  customers: _customers = [],
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  suppliers: _suppliers = [],
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  activeMasterProp,
  triggerToast
}) => {
  const products = Array.isArray(_products) ? _products : [];
  const customers = Array.isArray(_customers) ? _customers : [];
  const suppliers = Array.isArray(_suppliers) ? _suppliers : [];

  const { t, language } = useLanguage();
  const [activeMaster, setActiveMaster] = useState("products");
  const [godowns, setGodowns] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewDetailItem, setViewDetailItem] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmDeleteType, setConfirmDeleteType] = useState(null);

  // Toast feedback
  const [toastMsg, setToastMsg] = useState(null);
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // 1. PRODUCT MASTER STATE FIELDS
  const [pEngName, setPEngName] = useState("");
  const [pTamName, setPTamName] = useState("");
  const [pCode, setPCode] = useState("");
  const [pBarcode, setPBarcode] = useState("");
  const [pHsn, setPHsn] = useState("1006");
  const [pGst, setPGst] = useState(5);
  const [pPurchase, setPPurchase] = useState("");
  const [pSell, setPSell] = useState("");
  const [pOpening, setPOpening] = useState("");
  const [pCurrentStock, setPCurrentStock] = useState("");
  const [pBagSize, setPBagSize] = useState("25kg");
  const [pStatus, setPStatus] = useState("Active");
  const [pImageUrl, setPImageUrl] = useState("");

  // 2. CUSTOMER & SUPPLIER FIELDS
  const [csName, setCsName] = useState("");
  const [csTamilName, setCsTamilName] = useState("");
  const [csPhone, setCsPhone] = useState("");
  const [csAddress, setCsAddress] = useState("");
  const [csGstin, setCsGstin] = useState("");
  const [csOutstanding, setCsOutstanding] = useState("");
  const [csEmail, setCsEmail] = useState("");
  const [csStatus, setCsStatus] = useState("Active");

  // 3. GODOWN FIELDS
  const [gdName, setGdName] = useState("");
  const [gdTamil, setGdTamil] = useState("");
  const [gdAddress, setGdAddress] = useState("");
  const [gdStatus, setGdStatus] = useState("Active");

  const loadGodowns = async () => {
    try {
      const res = await fetch("/api/godowns");
      if (res.ok) {
        const data = await res.json();
        setGodowns(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load godowns", err);
    }
  };

  useEffect(() => {
    loadGodowns();
  }, []);

  useEffect(() => {
    if (activeMasterProp) {
      setActiveMaster(activeMasterProp);
    }
  }, [activeMasterProp]);

  const clearForm = () => {
    setEditingId(null);
    setPEngName("");
    setPTamName("");
    setPCode("");
    setPBarcode("");
    setPHsn("1006");
    setPGst(5);
    setPPurchase("");
    setPSell("");
    setPOpening("");
    setPCurrentStock("");
    setPBagSize("25kg");
    setPStatus("Active");
    setPImageUrl("");

    setCsName("");
    setCsTamilName("");
    setCsPhone("");
    setCsAddress("");
    setCsGstin("");
    setCsOutstanding("");
    setCsEmail("");
    setCsStatus("Active");

    setGdName("");
    setGdTamil("");
    setGdAddress("");
    setGdStatus("Active");
  };

  const generateBarcode = () => {
    setPBarcode(`SAT-${pEngName.substring(0, 3).toUpperCase() || "RICE"}-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  const handleImageUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result;
      setPImageUrl(base64Data);

      try {
        const res = await fetch("/api/products/upload-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageData: base64Data })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && data.imageUrl) {
            setPImageUrl(data.imageUrl);
          }
        }
      } catch (err) {
        console.error("Image upload failed", err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleProductSubmit = (e) => {
    e.preventDefault();
    const productData = {
      englishName: pEngName,
      tamilName: pTamName || pEngName,
      shortName: pEngName,
      productCode: pCode || `PC-${Math.floor(100 + Math.random() * 900)}`,
      barcode: pBarcode || String(Date.now()),
      hsn: pHsn,
      gstPercent: Number(pGst) || 5,
      purchasePrice: Number(pPurchase) || 0,
      purchaseRate: Number(pPurchase) || 0,
      sellingRate: Number(pSell) || 0,
      openingStock: Number(pOpening) || 0,
      currentStock: Number(pCurrentStock || pOpening) || 0,
      bagSize: pBagSize,
      status: pStatus,
      imageUrl: pImageUrl
    };

    if (editingId) {
      onUpdateProduct(editingId, productData);
      showToast(`Product variety "${pEngName}" updated successfully!`);
    } else {
      onAddProduct(productData);
      showToast(`Product variety "${pEngName}" created successfully!`);
    }
    clearForm();
    setShowAddModal(false);
  };

  const handleCustomerSubmit = (e) => {
    e.preventDefault();
    const custData = {
      name: csName,
      tamilName: csTamilName || csName,
      phone: csPhone,
      address: csAddress || "Counter Customer",
      gstin: csGstin,
      outstanding: Number(csOutstanding) || 0,
      email: csEmail,
      status: csStatus
    };

    if (editingId) {
      onUpdateCustomer(editingId, custData);
      showToast(`Customer "${csName}" updated successfully!`);
    } else {
      onAddCustomer(custData);
      showToast(`Customer "${csName}" created successfully!`);
    }
    clearForm();
    setShowAddModal(false);
  };

  const handleSupplierSubmit = (e) => {
    e.preventDefault();
    const suppData = {
      name: csName,
      companyName: csAddress || csName,
      phone: csPhone,
      address: csAddress || "Supplier Address",
      gstin: csGstin,
      outstanding: Number(csOutstanding) || 0,
      status: csStatus
    };

    if (editingId) {
      onUpdateSupplier(editingId, suppData);
      showToast(`Supplier "${csName}" updated successfully!`);
    } else {
      onAddSupplier(suppData);
      showToast(`Supplier "${csName}" created successfully!`);
    }
    clearForm();
    setShowAddModal(false);
  };

  const handleGodownSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: gdName,
      tamilName: gdTamil || gdName,
      address: gdAddress,
      status: gdStatus
    };

    try {
      const url = editingId ? `/api/godowns/${editingId}` : "/api/godowns";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast(editingId ? "Godown storage updated successfully!" : "Godown storage created successfully!");
        loadGodowns();
      }
    } catch (err) {
      console.error(err);
    }
    clearForm();
    setShowAddModal(false);
  };

  const startEditProduct = (p) => {
    setEditingId(p.id);
    setPEngName(p.englishName);
    setPTamName(p.tamilName || "");
    setPCode(p.productCode || "");
    setPBarcode(p.barcode || "");
    setPHsn(p.hsn || "1006");
    setPGst(p.gstPercent || 5);
    setPPurchase(p.purchasePrice || p.purchaseRate || "");
    setPSell(p.sellingRate || "");
    setPOpening(p.openingStock || "");
    setPCurrentStock(p.currentStock || "");
    setPBagSize(p.bagSize || "25kg");
    setPStatus(p.status || "Active");
    setPImageUrl(p.imageUrl || "");
    setShowAddModal(true);
  };

  const startEditCustomer = (c) => {
    setEditingId(c.id);
    setCsName(c.name);
    setCsTamilName(c.tamilName || "");
    setCsPhone(c.phone || "");
    setCsAddress(c.address || "");
    setCsGstin(c.gstin || "");
    setCsOutstanding(c.outstanding || "0");
    setCsEmail(c.email || "");
    setCsStatus(c.status || "Active");
    setShowAddModal(true);
  };

  const startEditSupplier = (s) => {
    setEditingId(s.id);
    setCsName(s.name);
    setCsPhone(s.phone || "");
    setCsAddress(s.address || "");
    setCsGstin(s.gstin || "");
    setCsOutstanding(s.outstanding || "0");
    setCsStatus(s.status || "Active");
    setShowAddModal(true);
  };

  const startEditGodown = (g) => {
    setEditingId(g.id);
    setGdName(g.name);
    setGdTamil(g.tamilName || "");
    setGdAddress(g.address || "");
    setGdStatus(g.status || "Active");
    setShowAddModal(true);
  };

  // Filter lists based on search query
  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    return p.englishName.toLowerCase().includes(q) || (p.tamilName || "").toLowerCase().includes(q) || (p.productCode || "").toLowerCase().includes(q);
  });

  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.phone || "").includes(q);
  });

  const filteredSuppliers = suppliers.filter((s) => {
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || (s.phone || "").includes(q);
  });

  const filteredGodowns = godowns.filter((g) => {
    const q = searchQuery.toLowerCase();
    return g.name.toLowerCase().includes(q);
  });

  return (
    <div id="masters-workspace-root" className="space-y-5 select-none font-semibold text-slate-800">
      
      {/* Header bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap justify-between items-center gap-3">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
          {activeMaster === "products" && "🌾 Rice Products Master"}
          {activeMaster === "customers" && "👥 Shop Customers Master"}
          {activeMaster === "suppliers" && "🏢 Rice Suppliers Master"}
          {activeMaster === "godowns" && "🏪 Godowns / Warehouse Master"}
        </h2>

        <button
          onClick={() => {
            clearForm();
            setShowAddModal(true);
          }}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 uppercase tracking-wider cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Master Record
        </button>
      </div>

      {/* Live Search Input bar */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${activeMaster}...`}
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs font-bold text-slate-800"
        />
      </div>

      {/* 1. PRODUCTS TABLE VIEW */}
      {activeMaster === "products" && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] tracking-wider border-b border-slate-150">
                <tr>
                  <th className="p-3 w-16">Image</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Code / Barcode</th>
                  <th className="p-3">Bag Size</th>
                  <th className="p-3 text-right">Purchase Price per KG (₹)</th>
                  <th className="p-3 text-right">Selling Price per KG (₹)</th>
                  <th className="p-3 text-center">Stock</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="p-6 text-center text-slate-400 uppercase font-black">No products found matching query.</td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.englishName} className="w-10 h-10 object-cover rounded-lg border border-slate-200" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-10 h-10 bg-slate-100 flex items-center justify-center rounded-lg text-[10px] text-slate-500 font-black">N/A</div>
                        )}
                      </td>
                      <td className="p-3">
                        <p className="font-black text-slate-900 text-[11px] uppercase">{p.englishName}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{p.tamilName || "-"}</p>
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-slate-800 text-[11px] font-mono">{p.productCode}</p>
                        <p className="text-[9px] text-slate-400 font-mono">{p.barcode || "-"}</p>
                      </td>
                      <td className="p-3">
                        <span className="bg-slate-50 px-2 py-0.5 border rounded text-[10px] font-black text-slate-600 font-mono">{p.bagSize || "25kg"}</span>
                      </td>
                      <td className="p-3 text-right font-mono text-slate-800">₹{(p.purchasePrice || p.purchaseRate || 0).toFixed(2)}</td>
                      <td className="p-3 text-right font-mono text-blue-600 font-black">₹{(p.sellingRate || 0).toFixed(2)}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black border font-mono ${p.currentStock <= 5 ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-emerald-50 text-emerald-600 border-emerald-150"}`}>
                          {p.currentStock} Bags
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-[5px] text-[8px] font-black uppercase border ${p.status === "Active" ? "bg-emerald-500 text-white border-emerald-500" : "bg-slate-200 text-slate-500 border-slate-300"}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3 text-center flex items-center justify-center gap-1.5 h-16">
                        <button onClick={() => startEditProduct(p)} className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setConfirmDeleteId(p.id); setConfirmDeleteType("product"); }} className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer">
                          <Trash2 className="w-4 h-4" />
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

      {/* 2. CUSTOMERS VIEW */}
      {activeMaster === "customers" && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] tracking-wider border-b border-slate-150">
                <tr>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Address</th>
                  <th className="p-3 text-right">Outstanding (₹)</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-6 text-center text-slate-400 uppercase font-black">No customers found.</td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <p className="font-black text-slate-900 text-[11px] uppercase">{c.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{c.tamilName || "-"}</p>
                      </td>
                      <td className="p-3 font-mono">{c.phone || "N/A"}</td>
                      <td className="p-3 uppercase text-[11px] text-slate-500 max-w-xs truncate">{c.address || "-"}</td>
                      <td className="p-3 text-right font-mono text-rose-600 font-black">₹{(c.outstanding || 0).toLocaleString("en-IN")}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-[5px] text-[8px] font-black uppercase border ${c.status !== "Inactive" ? "bg-emerald-500 text-white border-emerald-500" : "bg-slate-200 text-slate-500 border-slate-300"}`}>
                          {c.status || "Active"}
                        </span>
                      </td>
                      <td className="p-3 text-center flex items-center justify-center gap-1.5 h-14">
                        <button onClick={() => startEditCustomer(c)} className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setConfirmDeleteId(c.id); setConfirmDeleteType("customer"); }} className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer">
                          <Trash2 className="w-4 h-4" />
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

      {/* 3. SUPPLIERS VIEW */}
      {activeMaster === "suppliers" && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] tracking-wider border-b border-slate-150">
                <tr>
                  <th className="p-3">Supplier Name</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Company / Address</th>
                  <th className="p-3 text-right">Outstanding (₹)</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-6 text-center text-slate-400 uppercase font-black">No suppliers found.</td>
                  </tr>
                ) : (
                  filteredSuppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <p className="font-black text-slate-900 text-[11px] uppercase">{s.name}</p>
                      </td>
                      <td className="p-3 font-mono">{s.phone || "N/A"}</td>
                      <td className="p-3 uppercase text-[11px] text-slate-500 max-w-xs truncate">{s.companyName || s.address || "-"}</td>
                      <td className="p-3 text-right font-mono text-rose-600 font-black">₹{(s.outstanding || 0).toLocaleString("en-IN")}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-[5px] text-[8px] font-black uppercase border ${s.status !== "Inactive" ? "bg-emerald-500 text-white border-emerald-500" : "bg-slate-200 text-slate-500 border-slate-300"}`}>
                          {s.status || "Active"}
                        </span>
                      </td>
                      <td className="p-3 text-center flex items-center justify-center gap-1.5 h-14">
                        <button onClick={() => startEditSupplier(s)} className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setConfirmDeleteId(s.id); setConfirmDeleteType("supplier"); }} className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer">
                          <Trash2 className="w-4 h-4" />
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

      {/* 4. GODOWNS VIEW */}
      {activeMaster === "godowns" && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] tracking-wider border-b border-slate-150">
                <tr>
                  <th className="p-3">Godown Name</th>
                  <th className="p-3">பெயர் (தமிழ்)</th>
                  <th className="p-3">Address Location</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredGodowns.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-6 text-center text-slate-400 uppercase font-black">No godown locations found.</td>
                  </tr>
                ) : (
                  filteredGodowns.map((g) => (
                    <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-[11px] font-black uppercase text-slate-900">{g.name}</td>
                      <td className="p-3 text-[11px] text-slate-600">{g.tamilName || "-"}</td>
                      <td className="p-3 text-[11px] text-slate-500 uppercase">{g.address || "-"}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-[5px] text-[8px] font-black uppercase border ${g.status !== "Inactive" ? "bg-emerald-500 text-white border-emerald-500" : "bg-slate-200 text-slate-500 border-slate-300"}`}>
                          {g.status || "Active"}
                        </span>
                      </td>
                      <td className="p-3 text-center flex items-center justify-center gap-1.5 h-14">
                        <button onClick={() => startEditGodown(g)} className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer">
                          <Edit2 className="w-4 h-4" />
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

      {/* --- REUSABLE EDITING / ADDING MASTER MODAL (LIGHTWEIGHT & DYNAMIC) --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl relative border border-slate-100 my-8">
            <button
              onClick={() => {
                setShowAddModal(false);
                clearForm();
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xs font-black text-slate-800 mb-4 uppercase tracking-wider border-b pb-2">
              {editingId ? "Modify Master Record" : "Create Master Record"} • {activeMaster.toUpperCase()}
            </h3>

            {/* A. PRODUCT FORM */}
            {activeMaster === "products" && (
              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">English Name</label>
                    <input type="text" required value={pEngName} onChange={(e) => setPEngName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold uppercase" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">பெயர் (தமிழ்)</label>
                    <input type="text" value={pTamName} onChange={(e) => setPTamName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Product Code</label>
                    <input type="text" value={pCode} onChange={(e) => setPCode(e.target.value)} placeholder="Auto" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold font-mono" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 flex justify-between">
                      <span>Barcode / UPC</span>
                      <button type="button" onClick={generateBarcode} className="text-[9px] text-blue-600 font-black uppercase hover:underline">Generate (F8)</button>
                    </label>
                    <input type="text" value={pBarcode} onChange={(e) => setPBarcode(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold font-mono" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Purchase Price per KG (₹)</label>
                    <input type="number" required value={pPurchase} onChange={(e) => setPPurchase(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold font-mono" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Selling Price per KG (₹)</label>
                    <input type="number" required value={pSell} onChange={(e) => setPSell(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold font-mono" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Opening Stock (Bags)</label>
                    <input type="number" required value={pOpening} onChange={(e) => setPOpening(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold font-mono" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Current Stock (Bags)</label>
                    <input type="number" value={pCurrentStock} onChange={(e) => setPCurrentStock(e.target.value)} placeholder="Same as opening" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold font-mono" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Packing / Bag size</label>
                    <select value={pBagSize} onChange={(e) => setPBagSize(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold cursor-pointer">
                      <option value="25kg">25 Kg Standard Bag</option>
                      <option value="50kg">50 Kg Bulk Bag</option>
                      <option value="10kg">10 Kg Small Bag</option>
                      <option value="5kg">5 Kg Portable Bag</option>
                      <option value="1kg">1 Kg Retail Pack</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Product Status</label>
                  <select value={pStatus} onChange={(e) => setPStatus(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold cursor-pointer">
                    <option value="Active">🟢 Active</option>
                    <option value="Inactive">🔴 Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Product Image Link</label>
                  <input type="text" value={pImageUrl} onChange={(e) => setPImageUrl(e.target.value)} placeholder="Paste URL or upload below" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold truncate" />
                </div>

                {/* File Upload drag and drop */}
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50/50 transition-colors relative cursor-pointer">
                  <input type="file" onChange={(e) => handleImageUpload(e.target.files[0])} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400 block uppercase font-black">Drag rice photo or click to browse</span>
                </div>

                <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs uppercase tracking-widest cursor-pointer">Save Product Details</button>
              </form>
            )}

            {/* B. CUSTOMER FORM */}
            {activeMaster === "customers" && (
              <form onSubmit={handleCustomerSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Customer Name (English)</label>
                    <input type="text" required value={csName} onChange={(e) => setCsName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold uppercase" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">பெயர் (தமிழ்)</label>
                    <input type="text" value={csTamilName} onChange={(e) => setCsTamilName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Mobile Phone</label>
                    <input type="text" maxLength={10} value={csPhone} onChange={(e) => setCsPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Email (Optional)</label>
                    <input type="email" value={csEmail} onChange={(e) => setCsEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold" />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Delivery Address</label>
                  <textarea value={csAddress} onChange={(e) => setCsAddress(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold h-16 uppercase" />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Opening Debt (₹)</label>
                  <input type="number" value={csOutstanding} onChange={(e) => setCsOutstanding(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold font-mono" />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Status</label>
                  <select value={csStatus} onChange={(e) => setCsStatus(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold cursor-pointer">
                    <option value="Active">🟢 Active</option>
                    <option value="Inactive">🔴 Inactive</option>
                  </select>
                </div>

                <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs uppercase tracking-widest cursor-pointer">Save Customer Profile</button>
              </form>
            )}

            {/* C. SUPPLIER FORM */}
            {activeMaster === "suppliers" && (
              <form onSubmit={handleSupplierSubmit} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Supplier Name / Mill Sourcing Agent</label>
                  <input type="text" required value={csName} onChange={(e) => setCsName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold uppercase" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Phone Number</label>
                    <input type="text" maxLength={10} value={csPhone} onChange={(e) => setCsPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Mill / Company Address</label>
                    <input type="text" value={csAddress} onChange={(e) => setCsAddress(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold uppercase" />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Opening Outstanding Payable (₹)</label>
                  <input type="number" value={csOutstanding} onChange={(e) => setCsOutstanding(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold font-mono" />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Supplier Status</label>
                  <select value={csStatus} onChange={(e) => setCsStatus(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold cursor-pointer">
                    <option value="Active">🟢 Active</option>
                    <option value="Inactive">🔴 Inactive</option>
                  </select>
                </div>

                <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs uppercase tracking-widest cursor-pointer">Save Supplier profile</button>
              </form>
            )}

            {/* D. GODOWN FORM */}
            {activeMaster === "godowns" && (
              <form onSubmit={handleGodownSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Godown Storage Name</label>
                    <input type="text" required value={gdName} onChange={(e) => setGdName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold uppercase" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">பெயர் (தமிழ்)</label>
                    <input type="text" value={gdTamil} onChange={(e) => setGdTamil(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold" />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Storage Physical Address</label>
                  <textarea value={gdAddress} onChange={(e) => setGdAddress(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold h-16 uppercase" />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Godown Status</label>
                  <select value={gdStatus} onChange={(e) => setGdStatus(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold cursor-pointer">
                    <option value="Active">🟢 Active Storage</option>
                    <option value="Inactive">🔴 Inactive Storage</option>
                  </select>
                </div>

                <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs uppercase tracking-widest cursor-pointer">Save Godown Details</button>
              </form>
            )}

          </div>
        </div>
      )}

      {/* ==================== UNIFIED CONFIRM DELETE DIALOG ==================== */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 space-y-4 text-center animate-fade-in">
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
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (confirmDeleteType === "product" && onDeleteProduct) {
                    await onDeleteProduct(confirmDeleteId);
                  } else if (confirmDeleteType === "customer" && onDeleteCustomer) {
                    await onDeleteCustomer(confirmDeleteId);
                  } else if (confirmDeleteType === "supplier" && onDeleteSupplier) {
                    await onDeleteSupplier(confirmDeleteId);
                  }
                  setConfirmDeleteId(null);
                  setConfirmDeleteType(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert Feedback */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-slate-800 flex items-center gap-2 z-50 text-xs font-bold animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          {toastMsg}
        </div>
      )}

    </div>
  );
};

export { Masters };
export default Masters;
