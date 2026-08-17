import React, { useState, useRef, useEffect, useMemo } from "react";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Save,
  Pause,
  Play,
  RotateCcw,
  UserPlus,
  CheckCircle,
  X,
  Keyboard,
  Printer,
  ChevronDown,
  DollarSign,
  Package,
  Layers,
  Sparkles,
  CreditCard,
  Building,
  Wallet,
  ArrowRight,
  Calculator,
  Grid
} from "lucide-react";

export const BillingPOS = ({
  products: _products = [],
  customers: _customers = [],
  bills: _bills = [],
  holdBills: _holdBills = [],
  onSaveBill,
  onHoldBill,
  onResumeBill,
  onAddCustomer,
  companySettings,
  loadAllData
}) => {
  const products = Array.isArray(_products) ? _products : [];
  const customers = Array.isArray(_customers) ? _customers : [];
  const holdBills = Array.isArray(_holdBills) ? _holdBills : [];

  const { t, language } = useLanguage();
  const searchInputRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedCustomerId, setSelectedCustomerId] = useState("cust-walkin");
  const [billType, setBillType] = useState("Retail");
  const [paymentType, setPaymentType] = useState("Cash");

  const [cart, setCart] = useState([]);
  const [paidAmount, setPaidAmount] = useState("");
  const [globalDiscount, setGlobalDiscount] = useState("0");
  const [paymentSplit, setPaymentSplit] = useState({ cash: 0, upi: 0, card: 0, credit: 0 });

  const [showQuickCustomerModal, setShowQuickCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustTamil, setNewCustTamil] = useState("");
  const [newCustAddress, setNewCustAddress] = useState("");

  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Filter Categories list
  const categoriesList = useMemo(() => {
    const setCats = new Set(["All"]);
    products.forEach((p) => {
      if (p.category) setCats.add(p.category);
    });
    return Array.from(setCats);
  }, [products]);

  // Filter Products for Grid Selection
  const filteredGridProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === "All" || p.category === selectedCategory;
      const matchSearch =
        p.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.tamilName && p.tamilName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.productCode && p.productCode.toLowerCase().includes(searchQuery.toLowerCase()));
      const isActive = p.status !== "Inactive";
      return matchCat && matchSearch && isActive;
    });
  }, [products, selectedCategory, searchQuery]);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") {
        if (e.key === "F5") {
          e.preventDefault();
          submitBill();
        }
        return;
      }

      if (e.key === "F2") {
        e.preventDefault();
        clearPOS();
      } else if (e.key === "F5") {
        e.preventDefault();
        submitBill();
      } else if (e.key === "F7") {
        e.preventDefault();
        triggerHold();
      } else if (e.key === "F9") {
        e.preventDefault();
        if (searchInputRef.current) searchInputRef.current.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, selectedCustomerId, billType, paymentType, paidAmount, globalDiscount, paymentSplit]);

  const parseBagSizeKg = (method) => {
    if (method === "75kg") return 75;
    if (method === "70kg") return 70;
    if (method === "50kg") return 50;
    if (method === "26kg") return 26;
    if (method === "25kg") return 25;
    if (method === "10kg") return 10;
    if (method === "5kg") return 5;
    if (method === "2kg") return 2;
    if (method === "1kg") return 1;
    return 1;
  };

  const calculateCartItemTotal = (item) => {
    const qty = Math.max(Number(item.qty) || 0, 0);
    const rate = Math.max(Number(item.rate) || 0, 0);
    const discount = Math.max(Number(item.discount) || 0, 0);
    const method = item.sellingMethod || "25kg";
    const bagKg = parseBagSizeKg(method);

    if (method === "custom" || method === "1kg") {
      const totalWeightKg = qty;
      const total = Math.max(0, Math.round(qty * rate - discount));
      return { totalWeightKg, total };
    } else {
      const totalWeightKg = qty * bagKg;
      const lineTotal = rate > 200 ? qty * rate : totalWeightKg * rate;
      const total = Math.max(0, Math.round(lineTotal - discount));
      return { totalWeightKg, total };
    }
  };

  const addToCart = (product) => {
    const existingIndex = cart.findIndex((item) => item.productId === product.id);
    const rawRate = billType === "Wholesale" ? (product.wholesaleRate || product.sellingRate) : product.sellingRate;
    const rate = Number(rawRate) || 0;
    const initialMethod = (product.bagSize || "25kg").toLowerCase();
    const bagKg = parseBagSizeKg(initialMethod);

    if (existingIndex !== -1) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].qty += 1;
      const calc = calculateCartItemTotal(updatedCart[existingIndex]);
      updatedCart[existingIndex].totalWeightKg = calc.totalWeightKg;
      updatedCart[existingIndex].total = calc.total;
      setCart(updatedCart);
    } else {
      const newItem = {
        productId: product.id,
        englishName: product.englishName,
        tamilName: product.tamilName,
        productCode: product.productCode,
        sellingMethod: initialMethod,
        bagSizeKg: bagKg,
        qty: 1,
        totalWeightKg: bagKg,
        rate,
        discount: 0,
        total: 0,
        imageUrl: product.imageUrl
      };
      const calc = calculateCartItemTotal(newItem);
      newItem.totalWeightKg = calc.totalWeightKg;
      newItem.total = calc.total;
      setCart([...cart, newItem]);
    }
    setSearchQuery("");
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 50);
  };

  const updateCartMethod = (idx, newMethod) => {
    const updated = [...cart];
    const oldMethod = updated[idx].sellingMethod;
    const oldBagKg = parseBagSizeKg(oldMethod);
    const newBagKg = parseBagSizeKg(newMethod);
    
    if ((newMethod === "custom" || newMethod === "1kg") && updated[idx].rate > 200 && oldBagKg > 1) {
      updated[idx].rate = Math.round(updated[idx].rate / oldBagKg);
    }
    
    updated[idx].sellingMethod = newMethod;
    updated[idx].bagSizeKg = newBagKg;

    const calc = calculateCartItemTotal(updated[idx]);
    updated[idx].totalWeightKg = calc.totalWeightKg;
    updated[idx].total = calc.total;
    setCart(updated);
  };

  const updateCartQty = (idx, val) => {
    const updated = [...cart];
    updated[idx].qty = Math.max(val, 0.1);
    const calc = calculateCartItemTotal(updated[idx]);
    updated[idx].totalWeightKg = calc.totalWeightKg;
    updated[idx].total = calc.total;
    setCart(updated);
  };

  const updateCartDiscount = (idx, val) => {
    const updated = [...cart];
    updated[idx].discount = Math.max(val, 0);
    const calc = calculateCartItemTotal(updated[idx]);
    updated[idx].totalWeightKg = calc.totalWeightKg;
    updated[idx].total = calc.total;
    setCart(updated);
  };

  const updateCartRate = (idx, val) => {
    const updated = [...cart];
    updated[idx].rate = Math.max(val, 0);
    const calc = calculateCartItemTotal(updated[idx]);
    updated[idx].totalWeightKg = calc.totalWeightKg;
    updated[idx].total = calc.total;
    setCart(updated);
  };

  const removeFromCart = (idx) => {
    setCart(cart.filter((_, i) => i !== idx));
  };

  const clearPOS = () => {
    setCart([]);
    setSelectedCustomerId("cust-walkin");
    setPaymentType("Cash");
    setPaidAmount("");
    setGlobalDiscount("0");
    setSearchQuery("");
    setPaymentSplit({ cash: 0, upi: 0, card: 0, credit: 0 });
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.total || item.qty * item.rate), 0);
  const itemDiscounts = cart.reduce((sum, item) => sum + (item.discount || 0), 0);
  const additionalDiscount = Number(globalDiscount) || 0;
  const totalDiscount = itemDiscounts + additionalDiscount;
  const grandTotal = Math.max(Math.round(subtotal - totalDiscount), 0);
  const gstAmount = 0;

  const parsedPaid = Number(paidAmount) || 0;
  let splitCash = Number(paymentSplit?.cash) || 0;
  let splitUpi = Number(paymentSplit?.upi) || 0;
  let splitCard = Number(paymentSplit?.card) || 0;
  let splitCredit = Number(paymentSplit?.credit) || 0;
  let splitTotalPaid = splitCash + splitUpi + splitCard;

  let actualPaid = 0;
  let balance = 0;

  if (paymentType === "Split") {
    actualPaid = splitTotalPaid;
    balance = Math.max(0, grandTotal - actualPaid);
  } else if (paymentType === "Credit") {
    actualPaid = parsedPaid;
    balance = Math.max(0, grandTotal - actualPaid);
  } else {
    actualPaid = paidAmount !== "" ? parsedPaid : grandTotal;
    balance = Math.max(0, grandTotal - actualPaid);
  }

  const handleQuickCustomerSubmit = (e) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;
    const cleanPhone = newCustPhone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      alert("Customer mobile number must be exactly 10 digits!");
      return;
    }
    const newCust = {
      id: `cust-${Date.now()}`,
      name: newCustName,
      tamilName: newCustTamil || newCustName,
      phone: cleanPhone,
      address: newCustAddress || "Counter Customer",
      outstanding: 0
    };
    onAddCustomer(newCust);
    setSelectedCustomerId(newCust.id);
    setShowQuickCustomerModal(false);
    setNewCustName("");
    setNewCustPhone("");
    setNewCustTamil("");
    setNewCustAddress("");
  };

  const submitBill = () => {
    if (cart.length === 0) return;
    const activeCust = customers.find((c) => c.id === selectedCustomerId) || customers[0] || { name: "Walk-in Customer", tamilName: "" };
    const finalBill = {
      customerId: selectedCustomerId,
      customerName: activeCust.name || "Walk-in Customer",
      customerTamilName: activeCust.tamilName || "",
      billType,
      paymentType,
      paymentSplit: paymentType === "Split" ? paymentSplit : { cash: paymentType === "Cash" ? actualPaid : 0, upi: (paymentType === "Bank" || paymentType === "UPI") ? actualPaid : 0, card: paymentType === "Card" ? actualPaid : 0, credit: balance },
      subtotal,
      discount: totalDiscount,
      gstAmount: 0,
      total: grandTotal,
      paidAmount: actualPaid,
      balance,
      items: cart,
      date: new Date().toISOString().replace("T", " ").substring(0, 19)
    };
    onSaveBill(finalBill);
    clearPOS();
  };

  const triggerHold = () => {
    if (cart.length === 0) return;
    const activeCust = customers.find((c) => c.id === selectedCustomerId) || customers[0] || { name: "Walk-in Customer", tamilName: "" };
    const heldBill = {
      id: `hold-${Date.now()}`,
      customerId: selectedCustomerId,
      customerName: activeCust.name || "Walk-in Customer",
      billType,
      subtotal,
      total: grandTotal,
      items: cart,
      date: new Date().toLocaleTimeString()
    };
    onHoldBill(heldBill);
    clearPOS();
  };

  const resumeHold = (b) => {
    setCart(b.items);
    setSelectedCustomerId(b.customerId);
    setBillType(b.billType);
    onResumeBill(b.id);
  };

  return (
    <div id="billing-pos-root" className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:h-[calc(100vh-140px)] h-auto select-none">
      
      {/* LEFT SIDE: POS Cart and Checkout Controls (5 Columns) */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col lg:h-full h-[550px] overflow-hidden">
        
        {/* Customer select and Quick add */}
        <div className="space-y-3 shrink-0">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">{t("customer") || "CUSTOMER"}</span>
            <button
              type="button"
              id="pos-quick-customer-btn"
              onClick={() => setShowQuickCustomerModal(true)}
              className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 uppercase"
            >
              <UserPlus className="w-3.5 h-3.5" />
              {t("quickCustomer") || "New Customer"}
            </button>
          </div>

          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 cursor-pointer"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {language === "Both" || language === "Dual"
                  ? `${c.name} (${c.tamilName || c.name}) - ${c.phone || "No Phone"}`
                  : language === "Tamil"
                  ? `${c.tamilName || c.name} - ${c.phone || "No Phone"}`
                  : `${c.name} - ${c.phone || "No Phone"}`}
              </option>
            ))}
          </select>

          {/* Payment Type Selection Buttons */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">PAYMENT MODE</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { type: "Cash", icon: Wallet, label: "Cash" },
                { type: "Bank", icon: Building, label: "Bank / UPI" },
                { type: "Split", icon: Layers, label: "Split Payment" },
                { type: "Credit", icon: CreditCard, label: "Credit" }
              ].map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPaymentType(type)}
                  className={`py-2 px-1 rounded-xl text-[10px] font-extrabold border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    paymentType === type
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CART ITEMS TABLE */}
        <div className="flex-1 overflow-y-auto my-3 border border-slate-100 rounded-xl">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-slate-400 py-8">
              <ShoppingCart className="w-12 h-12 text-slate-200 mb-2 animate-bounce" />
              <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Cart is Empty</p>
              <p className="text-[10px] text-slate-400 uppercase mt-0.5 font-bold">Select products from the grid</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider sticky top-0 border-b border-slate-100 z-10">
                <tr>
                  <th className="p-2">{language === "Both" || language === "Dual" ? "Item / பொருள்" : language === "Tamil" ? "பொருள்" : "Item Details"}</th>
                  <th className="p-2 text-center w-24">{language === "Both" || language === "Dual" ? "Pack / முறை" : language === "Tamil" ? "முறை" : "Pack / Method"}</th>
                  <th className="p-2 text-center w-16">{language === "Both" || language === "Dual" ? "Rate / விலை" : language === "Tamil" ? "விலை" : "Rate"}</th>
                  <th className="p-2 text-center w-14">{language === "Both" || language === "Dual" ? "Qty / அளவு" : language === "Tamil" ? "அளவு" : "Bags/Qty"}</th>
                  <th className="p-2 text-center w-16">{language === "Both" || language === "Dual" ? "Weight / எடை" : language === "Tamil" ? "எடை" : "Weight"}</th>
                  <th className="p-2 text-right w-20">{language === "Both" || language === "Dual" ? "Total / மொத்தம்" : language === "Tamil" ? "மொத்தம்" : "Total"}</th>
                  <th className="p-2 text-center w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cart.map((item, idx) => {
                  const masterProd = products.find((p) => p.id === item.productId);
                  const totalProdStock = masterProd ? masterProd.currentStock : 0;
                  const remainStock = Math.max(0, totalProdStock - item.qty);

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2">
                        <p className="font-bold text-slate-800 text-[11px] truncate max-w-[140px]">
                          {language === "Both" || language === "Dual"
                            ? `${item.englishName} (${item.tamilName || item.englishName})`
                            : language === "Tamil"
                            ? item.tamilName || item.englishName
                            : item.englishName}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[8px] font-bold text-blue-700 bg-blue-50 px-1 py-0.2 rounded border border-blue-150">
                            Remain: {remainStock} Bags
                          </span>
                        </div>
                      </td>
                      <td className="p-2">
                        <select
                          value={item.sellingMethod || "25kg"}
                          onChange={(e) => updateCartMethod(idx, e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-center rounded py-0.5 font-bold text-slate-700 text-[10px] focus:outline-none focus:bg-white cursor-pointer"
                        >
                          <option value="75kg">75 Kg Bag</option>
                          <option value="70kg">70 Kg Bag</option>
                          <option value="50kg">50 Kg Bag</option>
                          <option value="26kg">26 Kg Bag</option>
                          <option value="25kg">25 Kg Bag</option>
                          <option value="10kg">10 Kg Bag</option>
                          <option value="5kg">5 Kg Bag</option>
                          <option value="2kg">2 Kg Pack</option>
                          <option value="1kg">1 Kg Pack</option>
                          <option value="custom">Custom Weight</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => updateCartRate(idx, Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 text-center rounded py-0.5 font-bold text-slate-700 text-[11px] focus:outline-none focus:bg-white"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step={item.sellingMethod === "custom" ? "0.1" : "1"}
                          value={item.qty}
                          onChange={(e) => updateCartQty(idx, Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 text-center rounded py-0.5 font-bold text-slate-700 text-[11px] focus:outline-none focus:bg-white"
                        />
                      </td>
                      <td className="p-2 text-center text-[11px] font-bold text-slate-600 font-mono">
                        {item.totalWeightKg || (item.sellingMethod === "custom" ? item.qty : item.qty * (item.bagSizeKg || 1))} Kg
                      </td>
                      <td className="p-2 text-right font-black text-slate-800 text-[11px]">
                        ₹{item.total}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeFromCart(idx)}
                          className="text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* CHECKOUT CALCULATIONS & BUTTONS */}
        <div className="space-y-3 shrink-0 pt-2 border-t border-slate-100">
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Flat Discount (₹)</label>
              <input
                type="number"
                value={globalDiscount}
                onChange={(e) => setGlobalDiscount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold font-mono text-slate-800 mt-1"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">
                {paymentType === "Credit" ? "Advance Received (₹)" : "Amount Paid (₹)"}
              </label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder={`₹${grandTotal}`}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold font-mono text-slate-800 mt-1"
              />
            </div>
          </div>

          {/* Grand Total Summary Box */}
          <div className="bg-slate-900 text-white p-3 rounded-xl space-y-1">
            <div className="flex justify-between items-center text-xs opacity-80">
              <span>SUBTOTAL</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-black tracking-wider pt-1 border-t border-slate-800">
              <span className="text-emerald-400">NET PAYABLE</span>
              <span className="text-emerald-400 text-lg font-mono">₹{grandTotal}</span>
            </div>
            {balance > 0 && (
              <div className="flex justify-between items-center text-xs text-rose-400 font-bold pt-1">
                <span>DUE / OUTSTANDING BALANCE</span>
                <span>₹{balance}</span>
              </div>
            )}
          </div>

          {/* Action Triggers */}
          <div className="space-y-1.5">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={triggerHold}
                className="py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-extrabold rounded-xl text-[11px] flex justify-center items-center gap-1.5 border border-amber-200 transition-colors uppercase tracking-wider cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5" /> Hold Bill (F7)
              </button>
              <button
                type="button"
                onClick={clearPOS}
                className="py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-extrabold rounded-xl text-[11px] flex justify-center items-center gap-1.5 border border-slate-200 transition-colors uppercase tracking-wider cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Clear Bill (F2)
              </button>
            </div>

            <button
              type="button"
              disabled={cart.length === 0}
              onClick={submitBill}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-xl text-xs flex justify-center items-center gap-2 shadow-sm transition-all uppercase tracking-widest cursor-pointer disabled:pointer-events-none"
            >
              <Save className="w-4 h-4" /> Save & Print Bill (F5)
            </button>
          </div>
        </div>

        {/* Held Bills Bar */}
        {holdBills.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
            <span className="text-[9px] font-black text-amber-700 uppercase shrink-0">HELD BILLS ({holdBills.length}):</span>
            {holdBills.map((b) => (
              <button
                key={b.id}
                onClick={() => resumeHold(b)}
                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[9px] font-black border border-amber-200 shrink-0 flex items-center gap-1 cursor-pointer"
              >
                <Play className="w-2.5 h-2.5" /> {b.customerName} (₹{b.total})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT SIDE: Product Selection Grid with Images (7 Columns) */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col lg:h-full h-[650px] overflow-hidden">
        
        {/* Search Bar & Categories Filter */}
        <div className="space-y-3 shrink-0">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                data-no-transliterate="true"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SCAN BARCODE OR SEARCH RICE VARIETIES (PONNI, SAMBA, BASMATI)..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowShortcutsModal(true)}
              className="px-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center gap-1 transition-colors text-xs font-black uppercase cursor-pointer border border-slate-200"
              title="Keyboard Shortcuts"
            >
              <Keyboard className="w-4 h-4" />
              <span className="hidden sm:inline">Shortcuts</span>
            </button>
          </div>

          {/* Dynamic Categories Scrollbar */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200">
            {categoriesList.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg border transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {cat === "All" ? "⭐ All Products" : `🌾 ${cat}`}
              </button>
            ))}
          </div>
        </div>

        {/* Product Card Grid */}
        <div className="flex-1 overflow-y-auto mt-3 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
          {filteredGridProducts.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-slate-400 py-12">
              <Package className="w-16 h-16 text-slate-200 mb-3" />
              <p className="text-xs font-black text-slate-500 uppercase">No active products found</p>
              <p className="text-[10px] text-slate-400 uppercase mt-1">Try another category or change filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredGridProducts.map((p) => {
                const cartItem = cart.find((item) => item.productId === p.id);
                const inCartQty = cartItem ? cartItem.qty : 0;
                const remainStock = Math.max(0, (p.currentStock || 0) - inCartQty);
                const isOutOfStock = (p.currentStock || 0) <= 0;
                const isLowStock = remainStock <= (p.minimumStock || 5);
                const activePrice = billType === "Wholesale" ? (p.wholesaleRate || p.sellingRate) : p.sellingRate;

                const initials = p.englishName.substring(0, 2).toUpperCase();
                const colors = [
                  "bg-emerald-50 text-emerald-700 border-emerald-200",
                  "bg-amber-50 text-amber-700 border-amber-200",
                  "bg-indigo-50 text-indigo-700 border-indigo-200",
                  "bg-rose-50 text-rose-700 border-rose-200",
                  "bg-sky-50 text-sky-700 border-sky-200"
                ];
                const colorClass = colors[p.englishName.charCodeAt(0) % colors.length];

                return (
                  <button
                    key={p.id}
                    onClick={() => !isOutOfStock && addToCart(p)}
                    disabled={isOutOfStock}
                    className={`group relative text-left bg-white border rounded-xl overflow-hidden shadow-xs hover:shadow-md hover:border-blue-500 transition-all cursor-pointer flex flex-col h-44 border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                      isOutOfStock ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  >
                    {/* Product Image Area */}
                    <div className="h-24 w-full bg-slate-50 relative overflow-hidden flex items-center justify-center shrink-0 border-b border-slate-100">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.englishName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className={`w-full h-full flex flex-col items-center justify-center font-black text-sm border-b uppercase ${colorClass}`}>
                          <span className="text-base tracking-wider">{initials}</span>
                          <span className="text-[7px] tracking-widest mt-0.5 opacity-60">RICE BAG</span>
                        </div>
                      )}

                      {/* Stock Status Badge with Total, Sold, and Remaining Stock */}
                      <span className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border shadow-xs ${
                        isOutOfStock 
                          ? "bg-rose-600 text-white border-rose-600" 
                          : inCartQty > 0
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : isLowStock 
                              ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse" 
                              : "bg-emerald-50 text-emerald-700 border-emerald-150"
                      }`}>
                        {isOutOfStock 
                          ? "OUT OF STOCK" 
                          : inCartQty > 0 
                            ? `Sell: ${inCartQty} | Remain: ${remainStock} Bags` 
                            : `Stock: ${p.currentStock} Bags`}
                      </span>
                    </div>

                    {/* Product Details Area */}
                    <div className="p-2 flex flex-col justify-between flex-1 bg-white">
                      <div>
                        <h4 className="text-[11px] font-black text-slate-800 uppercase line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {p.englishName}
                        </h4>
                        <p className="text-[9px] text-slate-400 font-bold uppercase truncate">
                          {p.tamilName || "-"}
                        </p>
                      </div>

                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs font-black text-blue-600 font-mono">
                          ₹{activePrice.toFixed(2)}
                        </span>
                        <span className="text-[8px] text-slate-400 font-bold bg-slate-50 px-1 py-0.5 rounded border border-slate-150 uppercase font-mono">
                          {p.bagSize || "25kg"}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* QUICK NEW CUSTOMER MODAL */}
      {showQuickCustomerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative border border-slate-100">
            <button
              onClick={() => setShowQuickCustomerModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-black text-slate-800 mb-4 uppercase tracking-wider flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-600" />
              Quick Add Customer
            </h3>

            <form onSubmit={handleQuickCustomerSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Customer Name (English)</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  data-no-transliterate="true"
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Kannan"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold uppercase"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">பெயர் (தமிழ்)</label>
                <input
                  type="text"
                  value={newCustTamil}
                  data-transliterate="true"
                  onChange={(e) => setNewCustTamil(e.target.value)}
                  placeholder="Phonetic (e.g. kannan)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Mobile Phone Number</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={newCustPhone}
                  data-no-transliterate="true"
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="10-digit Mobile"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Address (Optional)</label>
                <input
                  type="text"
                  value={newCustAddress}
                  data-no-transliterate="true"
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="Erode, Tamil Nadu"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold uppercase"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickCustomerModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-md"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHORTCUTS HELPER MODAL */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative border border-slate-100">
            <button
              onClick={() => setShowShortcutsModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-black text-slate-800 mb-3 uppercase tracking-wider flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-blue-600" />
              Keyboard Shortcuts
            </h3>

            <div className="space-y-2 text-xs font-bold text-slate-700">
              <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                <span>Search / Scan Barcode</span>
                <span className="bg-slate-200 px-1.5 py-0.5 rounded text-[10px] font-mono font-black">F9</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                <span>Save & Print Bill</span>
                <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-mono font-black">F5</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                <span>Hold Current Bill</span>
                <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[10px] font-mono font-black">F7</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                <span>Clear Cart / Reset</span>
                <span className="bg-slate-200 px-1.5 py-0.5 rounded text-[10px] font-mono font-black">F2</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
