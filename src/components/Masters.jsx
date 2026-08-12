import React, { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { transliterateEnglishToTamil } from "../utils/transliterate";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Upload,
  CheckCircle,
  AlertCircle,
  Tag,
  Star,
  Package,
  Users,
  Building,
  Home,
  CreditCard,
  FolderTree,
  Eye
} from "lucide-react";

const Masters = ({
  products: _products = [],
  bills: _bills = [],
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
  triggerToast,
  loadAllData
}) => {
  const products = Array.isArray(_products) ? _products : [];
  const bills = Array.isArray(_bills) ? _bills : [];
  const customers = Array.isArray(_customers) ? _customers : [];
  const suppliers = Array.isArray(_suppliers) ? _suppliers : [];

  const getCustomerOutstanding = (cust) => {
    const custBills = bills.filter(
      (b) => (b.customerId === cust.id || (cust.name && b.customerName === cust.name)) && b.status !== "Cancelled"
    );
    const billOutstanding = custBills.reduce((sum, b) => {
      const tot = b.grandTotal !== undefined ? b.grandTotal : b.total || 0;
      const paid = b.paidAmount !== undefined ? b.paidAmount : (b.paymentType === "Credit" ? 0 : tot);
      return sum + Math.max(0, tot - paid);
    }, 0);
    return Math.max(Number(cust.outstanding) || 0, billOutstanding);
  };

  const { t, language } = useLanguage();
  const [activeMaster, setActiveMaster] = useState("products");
  
  // Custom API master states
  const [godowns, setGodowns] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [units, setUnits] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [viewingType, setViewingType] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmDeleteType, setConfirmDeleteType] = useState(null);
  const [confirmDeleteName, setConfirmDeleteName] = useState("");

  // Toast feedback
  const [toastMsg, setToastMsg] = useState(null);
  const [toastType, setToastType] = useState("success");

  const showToast = (msg, type = "success") => {
    setToastMsg(msg);
    setToastType(type);
    if (triggerToast) triggerToast(msg);
    setTimeout(() => setToastMsg(null), 3500);
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

  // 4. GENERIC SIMPLE MASTER FIELDS (Categories, Brands, Units, Payment Types)
  const [mName, setMName] = useState("");
  const [mTamilName, setMTamilName] = useState("");
  const [mCode, setMCode] = useState("");
  const [mStatus, setMStatus] = useState("Active");

  // Load custom masters from backend
  const loadCustomMasters = async () => {
    try {
      const [gRes, cRes, bRes, uRes, pRes] = await Promise.all([
        fetch("/api/godowns"),
        fetch("/api/categories"),
        fetch("/api/brands"),
        fetch("/api/units"),
        fetch("/api/payment-types")
      ]);
      if (gRes.ok) setGodowns(await gRes.json());
      if (cRes.ok) setCategories(await cRes.json());
      if (bRes.ok) setBrands(await bRes.json());
      if (uRes.ok) setUnits(await uRes.json());
      if (pRes.ok) setPaymentTypes(await pRes.json());
    } catch (err) {
      console.error("Failed to load custom master lists", err);
    }
  };

  useEffect(() => {
    loadCustomMasters();
  }, []);

  useEffect(() => {
    if (activeMasterProp) {
      // Map menu tab key to activeMaster
      if (activeMasterProp === "payment" || activeMasterProp === "paymentTypes") {
        setActiveMaster("paymentTypes");
      } else {
        setActiveMaster(activeMasterProp);
      }
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

    setMName("");
    setMTamilName("");
    setMCode("");
    setMStatus("Active");
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

  // Submit Handlers
  const handleProductSubmit = async (e) => {
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
      if (onUpdateProduct) await onUpdateProduct(editingId, productData);
      showToast(`Product variety "${pEngName}" updated successfully!`);
    } else {
      if (onAddProduct) await onAddProduct(productData);
      showToast(`Product variety "${pEngName}" created successfully!`);
    }
    if (loadAllData) await loadAllData();
    clearForm();
    setShowAddModal(false);
  };

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    const cleanPhone = (csPhone || "").replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      showToast("Customer mobile number must be exactly 10 digits!", "error");
      return;
    }
    const custData = {
      name: csName,
      tamilName: csTamilName || csName,
      phone: cleanPhone,
      address: csAddress || "Counter Customer",
      gstin: csGstin,
      outstanding: Number(csOutstanding) || 0,
      email: csEmail,
      status: csStatus
    };

    if (editingId) {
      if (onUpdateCustomer) await onUpdateCustomer(editingId, custData);
      showToast(`Customer "${csName}" updated successfully!`);
    } else {
      if (onAddCustomer) await onAddCustomer(custData);
      showToast(`Customer "${csName}" created successfully!`);
    }
    if (loadAllData) await loadAllData();
    clearForm();
    setShowAddModal(false);
  };

  const handleSupplierSubmit = async (e) => {
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
      if (onUpdateSupplier) await onUpdateSupplier(editingId, suppData);
      showToast(`Supplier "${csName}" updated successfully!`);
    } else {
      if (onAddSupplier) await onAddSupplier(suppData);
      showToast(`Supplier "${csName}" created successfully!`);
    }
    if (loadAllData) await loadAllData();
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
        loadCustomMasters();
        if (loadAllData) await loadAllData();
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to save godown record.", "error");
    }
    clearForm();
    setShowAddModal(false);
  };

  // Generic Submit Handler for Categories, Brands, Units, Payment Types
  const handleGenericMasterSubmit = async (e) => {
    e.preventDefault();
    let endpoint = "";
    if (activeMaster === "categories") endpoint = "/api/categories";
    else if (activeMaster === "brands") endpoint = "/api/brands";
    else if (activeMaster === "units") endpoint = "/api/units";
    else if (activeMaster === "paymentTypes") endpoint = "/api/payment-types";

    const payload = {
      name: mName,
      tamilName: mTamilName || mName,
      code: mCode,
      status: mStatus
    };

    try {
      const url = editingId ? `${endpoint}/${editingId}` : endpoint;
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast(editingId ? "Master entry updated successfully!" : "Master entry created successfully!");
        loadCustomMasters();
        if (loadAllData) await loadAllData();
      } else {
        showToast("Error saving master record.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error saving master record.", "error");
    }
    clearForm();
    setShowAddModal(false);
  };

  // Start Edit functions
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

  const startEditGeneric = (item) => {
    setEditingId(item.id);
    setMName(item.name || "");
    setMTamilName(item.tamilName || "");
    setMCode(item.code || "");
    setMStatus(item.status || "Active");
    setShowAddModal(true);
  };

  // Delete Executor
  const executeDelete = async () => {
    if (!confirmDeleteId || !confirmDeleteType) return;
    const id = confirmDeleteId;
    const type = confirmDeleteType;

    try {
      if (type === "product") {
        if (onDeleteProduct) await onDeleteProduct(id);
        showToast("Product deleted successfully!");
      } else if (type === "customer") {
        if (onDeleteCustomer) await onDeleteCustomer(id);
        showToast("Customer deleted successfully!");
      } else if (type === "supplier") {
        if (onDeleteSupplier) await onDeleteSupplier(id);
        showToast("Supplier deleted successfully!");
      } else {
        let endpoint = `/api/${type}/${id}`;
        if (type === "paymentTypes") endpoint = `/api/payment-types/${id}`;
        const res = await fetch(endpoint, { method: "DELETE" });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast("Master entry deleted successfully!");
          loadCustomMasters();
        } else {
          showToast(data.message || "Cannot delete this record because it is used in transactions.", "error");
        }
      }
      if (loadAllData) await loadAllData();
    } catch (err) {
      console.error("Delete failed", err);
      showToast("Deletion failed or record is referenced in transactions.", "error");
    } finally {
      setConfirmDeleteId(null);
      setConfirmDeleteType(null);
      setConfirmDeleteName("");
    }
  };

  // Filtering lists
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

  const filteredCategories = categories.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (c.name || "").toLowerCase().includes(q) || (c.tamilName || "").toLowerCase().includes(q);
  });

  const filteredBrands = brands.filter((b) => {
    const q = searchQuery.toLowerCase();
    return (b.name || "").toLowerCase().includes(q) || (b.tamilName || "").toLowerCase().includes(q);
  });

  const filteredUnits = units.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (u.name || "").toLowerCase().includes(q) || (u.tamilName || "").toLowerCase().includes(q);
  });

  const filteredPaymentTypes = paymentTypes.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (p.name || "").toLowerCase().includes(q) || (p.tamilName || "").toLowerCase().includes(q);
  });

  const masterTabConfig = [
    { id: "products", label: "Rice Products", labelTamil: "அரிசி பொருட்கள்", icon: Package },
    { id: "categories", label: "Categories", labelTamil: "வகைகள்", icon: FolderTree },
    { id: "brands", label: "Brands", labelTamil: "பிராண்டுகள்", icon: Star },
    { id: "units", label: "Units & Bag Sizes", labelTamil: "அளவு / பைகள்", icon: Tag },
    { id: "customers", label: "Customers", labelTamil: "வாடிக்கையாளர்கள்", icon: Users },
    { id: "suppliers", label: "Suppliers & Mills", labelTamil: "ஆலையாளர்கள்", icon: Building },
    { id: "godowns", label: "Godowns", labelTamil: "கிடங்குகள்", icon: Home },
    { id: "paymentTypes", label: "Payment Types", labelTamil: "பணமுறை", icon: CreditCard }
  ];

  const currentMasterObj = masterTabConfig.find(m => m.id === activeMaster) || masterTabConfig[0];
  const ActiveIcon = currentMasterObj.icon;

  return (
    <div id="masters-workspace-root" className="space-y-5 select-none font-semibold text-slate-800">
      
      {/* Clean Master Title Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <ActiveIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              {language === "Both" || language === "Dual"
                ? `${currentMasterObj.label} (${currentMasterObj.labelTamil})`
                : language === "Tamil"
                ? currentMasterObj.labelTamil
                : currentMasterObj.label}
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              Master Directory • SRI AMMAN TRADERS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search in ${currentMasterObj.label}...`}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs font-bold text-slate-800"
            />
          </div>

          <button
            onClick={() => {
              clearForm();
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 uppercase tracking-wider shrink-0 cursor-pointer shadow-md shadow-emerald-500/10"
          >
            <Plus className="w-4 h-4" /> Add Record
          </button>
        </div>
      </div>

      {/* ==================== 1. PRODUCTS TABLE VIEW ==================== */}
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
                  <th className="p-3 text-right">Purchase Price (₹)</th>
                  <th className="p-3 text-right">Selling Price (₹)</th>
                  <th className="p-3 text-center">Stock</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-6 text-center text-slate-400 uppercase font-black">No products found matching query.</td>
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
                          {p.status || "Active"}
                        </span>
                      </td>
                      <td className="p-3 text-center flex items-center justify-center gap-1.5 h-16">
                        <button onClick={() => { setViewingItem(p); setViewingType("product"); }} className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => startEditProduct(p)} className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setConfirmDeleteId(p.id); setConfirmDeleteType("product"); setConfirmDeleteName(p.englishName); }} className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer" title="Delete">
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

      {/* ==================== 2. CUSTOMERS VIEW ==================== */}
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
                    <td colSpan="6" className="p-6 text-center text-slate-400 uppercase font-black">No customers found.</td>
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
                      <td className="p-3 text-right font-mono text-rose-600 font-black">₹{getCustomerOutstanding(c).toLocaleString("en-IN")}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-[5px] text-[8px] font-black uppercase border ${c.status !== "Inactive" ? "bg-emerald-500 text-white border-emerald-500" : "bg-slate-200 text-slate-500 border-slate-300"}`}>
                          {c.status || "Active"}
                        </span>
                      </td>
                      <td className="p-3 text-center flex items-center justify-center gap-1.5 h-14">
                        <button onClick={() => { setViewingItem(c); setViewingType("customer"); }} className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => startEditCustomer(c)} className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setConfirmDeleteId(c.id); setConfirmDeleteType("customer"); setConfirmDeleteName(c.name); }} className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer" title="Delete">
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

      {/* ==================== 3. SUPPLIERS VIEW ==================== */}
      {activeMaster === "suppliers" && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] tracking-wider border-b border-slate-150">
                <tr>
                  <th className="p-3">Supplier / Mill Agent</th>
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
                    <td colSpan="6" className="p-6 text-center text-slate-400 uppercase font-black">No suppliers found.</td>
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
                        <button onClick={() => { setViewingItem(s); setViewingType("supplier"); }} className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => startEditSupplier(s)} className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setConfirmDeleteId(s.id); setConfirmDeleteType("supplier"); setConfirmDeleteName(s.name); }} className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer" title="Delete">
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

      {/* ==================== 4. GODOWNS VIEW ==================== */}
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
                        <button onClick={() => { setConfirmDeleteId(g.id); setConfirmDeleteType("godowns"); setConfirmDeleteName(g.name); }} className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer">
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

      {/* ==================== 5. CATEGORIES VIEW ==================== */}
      {activeMaster === "categories" && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] tracking-wider border-b border-slate-150">
                <tr>
                  <th className="p-3">Category Name</th>
                  <th className="p-3">பெயர் (தமிழ்)</th>
                  <th className="p-3">Code</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-6 text-center text-slate-400 uppercase font-black">No categories found.</td>
                  </tr>
                ) : (
                  filteredCategories.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-black text-slate-900 uppercase">{item.name}</td>
                      <td className="p-3 text-slate-600">{item.tamilName || "-"}</td>
                      <td className="p-3 font-mono text-slate-500">{item.code || "-"}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-[5px] text-[8px] font-black uppercase border ${item.status !== "Inactive" ? "bg-emerald-500 text-white border-emerald-500" : "bg-slate-200 text-slate-500 border-slate-300"}`}>
                          {item.status || "Active"}
                        </span>
                      </td>
                      <td className="p-3 text-center flex items-center justify-center gap-1.5 h-14">
                        <button onClick={() => startEditGeneric(item)} className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setConfirmDeleteId(item.id); setConfirmDeleteType("categories"); setConfirmDeleteName(item.name); }} className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer">
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

      {/* ==================== 6. BRANDS VIEW ==================== */}
      {activeMaster === "brands" && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] tracking-wider border-b border-slate-150">
                <tr>
                  <th className="p-3">Brand Name</th>
                  <th className="p-3">பெயர் (தமிழ்)</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredBrands.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-6 text-center text-slate-400 uppercase font-black">No brands found.</td>
                  </tr>
                ) : (
                  filteredBrands.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-black text-slate-900 uppercase">{item.name}</td>
                      <td className="p-3 text-slate-600">{item.tamilName || "-"}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-[5px] text-[8px] font-black uppercase border ${item.status !== "Inactive" ? "bg-emerald-500 text-white border-emerald-500" : "bg-slate-200 text-slate-500 border-slate-300"}`}>
                          {item.status || "Active"}
                        </span>
                      </td>
                      <td className="p-3 text-center flex items-center justify-center gap-1.5 h-14">
                        <button onClick={() => startEditGeneric(item)} className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setConfirmDeleteId(item.id); setConfirmDeleteType("brands"); setConfirmDeleteName(item.name); }} className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer">
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

      {/* ==================== 7. UNITS VIEW ==================== */}
      {activeMaster === "units" && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] tracking-wider border-b border-slate-150">
                <tr>
                  <th className="p-3">Unit / Packing Name</th>
                  <th className="p-3">பெயர் (தமிழ்)</th>
                  <th className="p-3">Unit Code</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredUnits.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-6 text-center text-slate-400 uppercase font-black">No units found.</td>
                  </tr>
                ) : (
                  filteredUnits.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-black text-slate-900 uppercase">{item.name}</td>
                      <td className="p-3 text-slate-600">{item.tamilName || "-"}</td>
                      <td className="p-3 font-mono text-slate-500">{item.code || "-"}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-[5px] text-[8px] font-black uppercase border ${item.status !== "Inactive" ? "bg-emerald-500 text-white border-emerald-500" : "bg-slate-200 text-slate-500 border-slate-300"}`}>
                          {item.status || "Active"}
                        </span>
                      </td>
                      <td className="p-3 text-center flex items-center justify-center gap-1.5 h-14">
                        <button onClick={() => startEditGeneric(item)} className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setConfirmDeleteId(item.id); setConfirmDeleteType("units"); setConfirmDeleteName(item.name); }} className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer">
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

      {/* ==================== 8. PAYMENT TYPES VIEW ==================== */}
      {activeMaster === "paymentTypes" && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] tracking-wider border-b border-slate-150">
                <tr>
                  <th className="p-3">Payment Method Name</th>
                  <th className="p-3">பெயர் (தமிழ்)</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredPaymentTypes.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-6 text-center text-slate-400 uppercase font-black">No payment types found.</td>
                  </tr>
                ) : (
                  filteredPaymentTypes.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-black text-slate-900 uppercase">{item.name}</td>
                      <td className="p-3 text-slate-600">{item.tamilName || "-"}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-[5px] text-[8px] font-black uppercase border ${item.status !== "Inactive" ? "bg-emerald-500 text-white border-emerald-500" : "bg-slate-200 text-slate-500 border-slate-300"}`}>
                          {item.status || "Active"}
                        </span>
                      </td>
                      <td className="p-3 text-center flex items-center justify-center gap-1.5 h-14">
                        <button onClick={() => startEditGeneric(item)} className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setConfirmDeleteId(item.id); setConfirmDeleteType("paymentTypes"); setConfirmDeleteName(item.name); }} className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer">
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

      {/* --- CREATE / EDIT MASTER MODAL --- */}
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
                    <input 
                      type="text" 
                      required 
                      value={pEngName} 
                      onChange={(e) => setPEngName(e.target.value)} 
                      placeholder="e.g. PONNI RICE"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold uppercase" 
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 flex items-center justify-between">
                      <span>பெயர் (தமிழ்)</span>
                      {!pTamName && pEngName && (
                        <button 
                          type="button" 
                          onClick={() => setPTamName(transliterateEnglishToTamil(pEngName))}
                          className="text-[8px] text-blue-600 font-bold hover:underline cursor-pointer lowercase"
                        >
                          (auto-fill tamil)
                        </button>
                      )}
                    </label>
                    <input 
                      type="text" 
                      value={pTamName} 
                      onChange={(e) => setPTamName(transliterateEnglishToTamil(e.target.value))} 
                      placeholder="Phonetic (e.g. ponni)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold" 
                    />
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

                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50/50 transition-colors relative cursor-pointer">
                  <input type="file" onChange={(e) => handleImageUpload(e.target.files[0])} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400 block uppercase font-black">Drag rice photo or click to browse</span>
                </div>

                <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs uppercase tracking-widest cursor-pointer shadow-md">Save Product Details</button>
              </form>
            )}

            {/* B. CUSTOMER FORM */}
            {activeMaster === "customers" && (
              <form onSubmit={handleCustomerSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Customer Name (English)</label>
                    <input 
                      type="text" 
                      required 
                      value={csName} 
                      onChange={(e) => setCsName(e.target.value)} 
                      placeholder="e.g. KANNAN"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold uppercase" 
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 flex items-center justify-between">
                      <span>பெயர் (தமிழ்)</span>
                      {!csTamilName && csName && (
                        <button 
                          type="button" 
                          onClick={() => setCsTamilName(transliterateEnglishToTamil(csName))}
                          className="text-[8px] text-blue-600 font-bold hover:underline cursor-pointer lowercase"
                        >
                          (auto-fill tamil)
                        </button>
                      )}
                    </label>
                    <input 
                      type="text" 
                      value={csTamilName} 
                      onChange={(e) => setCsTamilName(transliterateEnglishToTamil(e.target.value))} 
                      placeholder="Phonetic (e.g. kannan)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold" 
                    />
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

                <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs uppercase tracking-widest cursor-pointer shadow-md">Save Customer Profile</button>
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

                <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs uppercase tracking-widest cursor-pointer shadow-md">Save Supplier Profile</button>
              </form>
            )}

            {/* D. GODOWN FORM */}
            {activeMaster === "godowns" && (
              <form onSubmit={handleGodownSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Godown Storage Name</label>
                    <input 
                      type="text" 
                      required 
                      value={gdName} 
                      onChange={(e) => setGdName(e.target.value)} 
                      placeholder="e.g. MAIN GODOWN ERODE"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold uppercase" 
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 flex items-center justify-between">
                      <span>பெயர் (தமிழ்)</span>
                      {!gdTamil && gdName && (
                        <button 
                          type="button" 
                          onClick={() => setGdTamil(transliterateEnglishToTamil(gdName))}
                          className="text-[8px] text-blue-600 font-bold hover:underline cursor-pointer lowercase"
                        >
                          (auto-fill tamil)
                        </button>
                      )}
                    </label>
                    <input 
                      type="text" 
                      value={gdTamil} 
                      onChange={(e) => setGdTamil(transliterateEnglishToTamil(e.target.value))} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold" 
                    />
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

                <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs uppercase tracking-widest cursor-pointer shadow-md">Save Godown Details</button>
              </form>
            )}

            {/* E. GENERIC MASTER FORM (Categories, Brands, Units, Payment Types) */}
            {["categories", "brands", "units", "paymentTypes"].includes(activeMaster) && (
              <form onSubmit={handleGenericMasterSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Entry Name (English)</label>
                    <input 
                      type="text" 
                      required 
                      value={mName} 
                      onChange={(e) => setMName(e.target.value)} 
                      placeholder="e.g. BOILED RICE"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold uppercase" 
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 flex items-center justify-between">
                      <span>பெயர் (தமிழ்)</span>
                      {!mTamilName && mName && (
                        <button 
                          type="button" 
                          onClick={() => setMTamilName(transliterateEnglishToTamil(mName))}
                          className="text-[8px] text-blue-600 font-bold hover:underline cursor-pointer lowercase"
                        >
                          (auto-fill tamil)
                        </button>
                      )}
                    </label>
                    <input 
                      type="text" 
                      value={mTamilName} 
                      onChange={(e) => setMTamilName(transliterateEnglishToTamil(e.target.value))} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold" 
                    />
                  </div>
                </div>

                {["categories", "units"].includes(activeMaster) && (
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Code / Prefix</label>
                    <input type="text" value={mCode} onChange={(e) => setMCode(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold uppercase font-mono" />
                  </div>
                )}

                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Status</label>
                  <select value={mStatus} onChange={(e) => setMStatus(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold cursor-pointer">
                    <option value="Active">🟢 Active</option>
                    <option value="Inactive">🔴 Inactive</option>
                  </select>
                </div>

                <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs uppercase tracking-widest cursor-pointer shadow-md">Save Master Entry</button>
              </form>
            )}

          </div>
        </div>
      )}

      {/* ==================== VIEW DETAIL MODAL ==================== */}
      {viewingItem && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-black uppercase tracking-wider">
                  {viewingType === "product" && "Product Master Details"}
                  {viewingType === "customer" && "Customer Profile Details"}
                  {viewingType === "supplier" && "Supplier / Mill Details"}
                  {!["product", "customer", "supplier"].includes(viewingType) && "Master Record Details"}
                </h3>
              </div>
              <button onClick={() => { setViewingItem(null); setViewingType(null); }} className="p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs font-semibold text-slate-700">
              {viewingType === "product" && (
                <div className="space-y-3">
                  {viewingItem.imageUrl && (
                    <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-50 border border-slate-200">
                      <img src={viewingItem.imageUrl} alt={viewingItem.englishName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Product Name (EN)</span>
                      <span className="font-black text-slate-900 text-sm uppercase">{viewingItem.englishName || viewingItem.name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">பெயர் (தமிழ்)</span>
                      <span className="font-bold text-slate-800">{viewingItem.tamilName || "-"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Product Code</span>
                      <span className="font-mono font-bold text-slate-800">{viewingItem.productCode || "-"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Barcode</span>
                      <span className="font-mono text-slate-800">{viewingItem.barcode || "-"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Packing / Bag Size</span>
                      <span className="font-mono text-slate-800">{viewingItem.bagSize || "25kg"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">HSN Code</span>
                      <span className="font-mono text-slate-800">{viewingItem.hsn || "1006"} ({viewingItem.gstPercent || 5}% GST)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Purchase Rate</span>
                      <span className="font-mono text-slate-800">₹{(viewingItem.purchasePrice || viewingItem.purchaseRate || 0).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Selling Rate</span>
                      <span className="font-mono text-blue-600 font-black">₹{(viewingItem.sellingRate || 0).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Current Stock</span>
                      <span className="font-mono font-bold text-emerald-600">{viewingItem.currentStock || 0} Bags</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Status</span>
                      <span className="font-bold text-slate-800">{viewingItem.status || "Active"}</span>
                    </div>
                  </div>
                </div>
              )}

              {viewingType === "customer" && (
                <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Customer Name</span>
                      <span className="font-black text-slate-900 uppercase text-sm">{viewingItem.name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">பெயர் (தமிழ்)</span>
                      <span className="font-bold text-slate-800">{viewingItem.tamilName || "-"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Mobile Phone</span>
                      <span className="font-mono font-bold text-blue-600">{viewingItem.phone || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Email</span>
                      <span className="font-mono text-slate-700">{viewingItem.email || "N/A"}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Address / Town</span>
                      <span className="text-slate-800 uppercase">{viewingItem.address || "Counter Customer"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">GSTIN Number</span>
                      <span className="font-mono text-slate-800">{viewingItem.gstin || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Credit Balance Due</span>
                      <span className="font-mono font-black text-rose-600 text-sm">₹{(viewingItem.outstanding || 0).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              )}

              {viewingType === "supplier" && (
                <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Supplier / Mill Name</span>
                      <span className="font-black text-slate-900 uppercase text-sm">{viewingItem.name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Company / Mill</span>
                      <span className="font-bold text-slate-800 uppercase">{viewingItem.companyName || viewingItem.name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Mobile Phone</span>
                      <span className="font-mono font-bold text-blue-600">{viewingItem.phone || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">GSTIN Number</span>
                      <span className="font-mono text-slate-800">{viewingItem.gstin || "N/A"}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Address Location</span>
                      <span className="text-slate-800 uppercase">{viewingItem.address || "-"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Outstanding Payable</span>
                      <span className="font-mono font-black text-rose-600 text-sm">₹{(viewingItem.outstanding || 0).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              )}

              {!["product", "customer", "supplier"].includes(viewingType) && (
                <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Name (English)</span>
                      <span className="font-black text-slate-900 uppercase">{viewingItem.name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">பெயர் (தமிழ்)</span>
                      <span className="font-bold text-slate-800">{viewingItem.tamilName || "-"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Code</span>
                      <span className="font-mono text-slate-800">{viewingItem.code || "-"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Status</span>
                      <span className="font-bold text-emerald-600">{viewingItem.status || "Active"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button onClick={() => { setViewingItem(null); setViewingType(null); }} className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CONFIRM DELETE DIALOG ==================== */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex justify-center items-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Confirm Removal</h4>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                Are you sure you want to delete <span className="font-bold text-slate-800">"{confirmDeleteName || "this entry"}"</span>? This operation cannot be undone.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmDeleteId(null);
                  setConfirmDeleteType(null);
                  setConfirmDeleteName("");
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md shadow-rose-500/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert Feedback */}
      {toastMsg && (
        <div className={`fixed bottom-5 right-5 text-white px-4 py-2.5 rounded-xl shadow-2xl border flex items-center gap-2 z-50 text-xs font-bold animate-bounce ${
          toastType === "error" ? "bg-rose-950 border-rose-800 text-rose-200" : "bg-slate-900 border-slate-800"
        }`}>
          {toastType === "error" ? (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          )}
          {toastMsg}
        </div>
      )}

    </div>
  );
};

export { Masters };
export default Masters;
