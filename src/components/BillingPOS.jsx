import { useState, useEffect, useRef, useMemo } from "react";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { TransliteratedInput, TransliteratedTextArea } from "./TransliteratedInput.jsx";
import {
  Search,
  Trash2,
  Keyboard,
  ShoppingCart,
  UserPlus,
  ChevronDown,
  Play,
  Pause,
  Save,
  X,
  Tag,
  Package,
  Plus,
  Coins,
  CreditCard,
  CheckCircle
} from "lucide-react";

const BillingPOS = ({
  products: _products = [],
  customers: _customers = [],
  onAddCustomer,
  onSaveBill,
  holdBills: _holdBills = [],
  onHoldBill,
  onResumeBill,
  nextInvoiceNo
}) => {
  const products = Array.isArray(_products) ? _products : [];
  const customers = Array.isArray(_customers) ? _customers : [];
  const holdBills = Array.isArray(_holdBills) ? _holdBills : [];

  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("cust-walkin");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [billType, setBillType] = useState("Retail");
  const [paymentType, setPaymentType] = useState("Cash");
  const [paymentSplit, setPaymentSplit] = useState({ cash: 0, upi: 0, card: 0, credit: 0 });
  const [paidAmount, setPaidAmount] = useState("");
  const [globalDiscount, setGlobalDiscount] = useState("0");
  const [showQuickCustomerModal, setShowQuickCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustTamil, setNewCustTamil] = useState("");
  const [newCustAddress, setNewCustAddress] = useState("");
  const searchInputRef = useRef(null);
  const paidInputRef = useRef(null);
  const discountInputRef = useRef(null);
  const customerSelectRef = useRef(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Focus search input on load
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Recalculate cart rates when billType changes
  useEffect(() => {
    if (cart.length > 0) {
      const updatedCart = cart.map((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (prod) {
          const rate = billType === "Wholesale" ? prod.wholesaleRate : prod.sellingRate;
          return {
            ...item,
            rate,
            total: rate * item.qty - item.discount
          };
        }
        return item;
      });
      setCart(updatedCart);
    }
  }, [billType]);

  // Extract dynamic categories from active products
  const categoriesList = useMemo(() => {
    const list = new Set();
    products.forEach((p) => {
      if (p.category) {
        list.add(p.category);
      }
    });
    return ["All", ...Array.from(list)];
  }, [products]);

  // Filter products for the POS Grid
  const filteredGridProducts = useMemo(() => {
    return products.filter((p) => {
      // Must be active
      if (p.status !== "Active") return false;

      // Category filter
      if (selectedCategory !== "All" && p.category !== selectedCategory) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const codeMatch = (p.productCode || "").toLowerCase().includes(q);
        const barcodeMatch = (p.barcode || "").toLowerCase().includes(q);
        const englishMatch = (p.englishName || "").toLowerCase().includes(q);
        const tamilMatch = (p.tamilName || "").toLowerCase().includes(q);
        const shortMatch = (p.shortName || "").toLowerCase().includes(q);
        return codeMatch || barcodeMatch || englishMatch || tamilMatch || shortMatch;
      }

      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  // Handle barcode exact match auto-addition
  useEffect(() => {
    if (!searchQuery.trim()) return;
    const q = searchQuery.trim();
    const exactMatch = products.find((p) => p.status === "Active" && p.barcode === q);
    if (exactMatch) {
      addToCart(exactMatch);
      setSearchQuery("");
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }
  }, [searchQuery, products]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "F2") {
        e.preventDefault();
        clearPOS();
      }
      if (e.key === "F3") {
        e.preventDefault();
        if (customerSelectRef.current) {
          customerSelectRef.current.focus();
        }
      }
      if (e.key === "F4") {
        e.preventDefault();
        if (paidInputRef.current) {
          paidInputRef.current.focus();
          paidInputRef.current.select();
        }
      }
      if (e.key === "F5") {
        e.preventDefault();
        submitBill();
      }
      if (e.key === "F7") {
        e.preventDefault();
        triggerHold();
      }
      if (e.key === "F9") {
        e.preventDefault();
        if (discountInputRef.current) {
          discountInputRef.current.focus();
          discountInputRef.current.select();
        }
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowQuickCustomerModal(false);
        setShowShortcutsModal(false);
        setSearchQuery("");
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, selectedCustomerId, billType, paymentType, paidAmount, globalDiscount, paymentSplit]);

  const parseBagSizeKg = (method) => {
    if (method === "50kg") return 50;
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
      // If rate is per KG (e.g. 78/kg), 25kg bag total = 25 * 78 = 1950.
      // If rate is already per Bag (> 200/bag), total = qty * rate.
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
    
    // If switching from a Bag rate (> 200) to 1kg / custom retail, convert rate to Per KG Rate
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

  // Split payment & credit calculations
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

          <div className="relative">
            <select
              id="pos-customer-select"
              ref={customerSelectRef}
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 appearance-none cursor-pointer"
            >
              {customers.filter((c) => c.status !== "Inactive" || c.id === "cust-walkin" || c.id === selectedCustomerId).map((c) => (
                <option key={c.id} value={c.id}>
                  {language === "English" ? c.name : c.tamilName || c.name} {c.outstanding > 0 ? `(O/S: ₹${c.outstanding})` : ""}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Payment Mode Selector */}
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">PAYMENT MODE</label>
            <div className="grid grid-cols-4 gap-1.5 bg-slate-100 p-1.5 rounded-xl text-center">
              {[
                { id: "Cash", label: "💵 Cash" },
                { id: "Bank", label: "🏦 Bank / UPI" },
                { id: "Split", label: "🔀 Split Payment" },
                { id: "Credit", label: "📝 Credit" }
              ].map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    setPaymentType(mode.id);
                    if (mode.id === "Credit") setPaidAmount("0");
                    if (mode.id === "Split" && (!paymentSplit || (paymentSplit.cash === 0 && paymentSplit.upi === 0))) {
                      setPaymentSplit({ cash: Math.round(grandTotal / 2), upi: Math.round(grandTotal / 2) });
                    }
                  }}
                  className={`py-2 text-[10px] font-black uppercase rounded-lg text-center transition-all cursor-pointer ${
                    paymentType === mode.id ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* SPLIT PAYMENT DETAILED ENTRY BREAKDOWN */}
          {paymentType === "Split" && (
            <div className="mt-2.5 p-2.5 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-blue-900 uppercase tracking-wider">🔀 Split Payment Breakdown</span>
                <span className="text-[10px] font-mono font-bold text-slate-600">Total Bill: ₹{grandTotal}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">💵 Cash Amount (₹)</label>
                  <input
                    type="number"
                    value={paymentSplit?.cash || 0}
                    onChange={(e) => setPaymentSplit({ ...paymentSplit, cash: Math.max(0, Number(e.target.value)) })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-slate-800 text-center focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">🏦 Bank / UPI Amount (₹)</label>
                  <input
                    type="number"
                    value={paymentSplit?.upi || 0}
                    onChange={(e) => setPaymentSplit({ ...paymentSplit, upi: Math.max(0, Number(e.target.value)) })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-slate-800 text-center focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-blue-100 text-[10px] font-bold">
                <span className="text-slate-600">Total Paid: <b className="text-emerald-700">₹{splitTotalPaid}</b></span>
                {balance > 0 ? (
                  <span className="text-amber-600 font-black">Remaining Balance: ₹{balance}</span>
                ) : (
                  <span className="text-emerald-600 font-black">✅ Payment Complete</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Cart Item list */}
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
                {cart.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-2">
                      <p className="font-bold text-slate-800 text-[11px] truncate max-w-[140px]">
                        {language === "Both" || language === "Dual"
                          ? `${item.englishName} (${item.tamilName || item.englishName})`
                          : language === "Tamil"
                          ? item.tamilName || item.englishName
                          : item.englishName}
                      </p>
                      <span className="text-[9px] text-slate-400 font-mono font-bold bg-slate-100 px-1 py-0.2 rounded mt-0.5 inline-block">
                        {item.productCode}
                      </span>
                    </td>
                    <td className="p-2">
                      <select
                        value={item.sellingMethod || "25kg"}
                        onChange={(e) => updateCartMethod(idx, e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-center rounded py-0.5 font-bold text-slate-700 text-[10px] focus:outline-none focus:bg-white cursor-pointer"
                      >
                        <option value="50kg">50 Kg Bag</option>
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
                        className="text-slate-400 hover:text-rose-600 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Totals & Calculations Section */}
        <div className="space-y-2.5 shrink-0 border-t border-slate-100 pt-3">
          <div className="grid grid-cols-2 gap-2">
            {/* Additional Discount */}
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">FLAT DISCOUNT (₹)</label>
              <input
                type="number"
                ref={discountInputRef}
                value={globalDiscount}
                onChange={(e) => setGlobalDiscount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:bg-white"
              />
            </div>

            {/* Paid Amount */}
            {paymentType !== "Split" && (
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  AMOUNT PAID (₹) {paymentType === "Credit" ? "(Partial Credit)" : ""}
                </label>
                <input
                  type="number"
                  ref={paidInputRef}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-black text-slate-800 focus:outline-none focus:bg-white"
                  placeholder={paymentType === "Credit" ? "0 (Full Credit)" : String(grandTotal)}
                />
              </div>
            )}
          </div>

          <div className="bg-slate-50/80 rounded-xl p-3 space-y-1.5 border border-slate-150">
            <div className="flex justify-between text-[11px] text-slate-500 font-bold uppercase">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-[11px] text-rose-600 font-bold uppercase">
                <span>Discount</span>
                <span>- ₹{totalDiscount}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200">
              <span className="text-[11px] font-black text-slate-800 uppercase">NET PAYABLE</span>
              <span className="text-lg font-black text-blue-600">₹{grandTotal}</span>
            </div>
            {balance > 0 && (
              <div className="flex justify-between text-[11px] text-rose-500 font-black uppercase pt-1">
                <span>Outstanding / Credit Balance</span>
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
                id="pos-search-input"
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs font-bold text-slate-800 placeholder:text-slate-400 uppercase tracking-wide"
                placeholder="Scan barcode or search rice varieties (Ponni, Samba, Basmati)..."
                autoComplete="off"
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

        {/* Product Card Grid (Clean, Simple and Modern POS UI with Images) */}
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
                const isLowStock = p.currentStock <= (p.minimumStock || 10);
                const isOutOfStock = p.currentStock <= 0;
                const activePrice = billType === "Wholesale" ? p.wholesaleRate : p.sellingRate;

                // Color-coded placeholder logic based on product name to keep UI extremely aesthetic
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

                      {/* Stock Status Badge */}
                      <span className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border shadow-xs ${
                        isOutOfStock 
                          ? "bg-rose-600 text-white border-rose-600" 
                          : isLowStock 
                            ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse" 
                            : "bg-emerald-50 text-emerald-700 border-emerald-150"
                      }`}>
                        {isOutOfStock ? "OUT OF STOCK" : isLowStock ? `${p.currentStock} bags left` : `In Stock: ${p.currentStock}`}
                      </span>

                      {/* Product Code Badge */}
                      <span className="absolute bottom-1 left-1.5 bg-slate-900/60 text-white text-[8px] font-bold px-1 py-0.2 rounded font-mono">
                        {p.productCode}
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

      {/* QUICK CUSTOMER ADD MODAL */}
      {showQuickCustomerModal && (
        <div id="quick-customer-modal" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative border border-slate-100">
            <button
              onClick={() => setShowQuickCustomerModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xs font-black text-slate-800 mb-4 uppercase tracking-wider border-b pb-2">Create Counter Customer</h3>

            <form onSubmit={handleQuickCustomerSubmit} className="space-y-4">
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">Customer Name (English)</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold focus:outline-none focus:bg-white uppercase"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  {language === "Both" || language === "Dual" ? "Name (Tamil) / பெயர் (தமிழ்)" : "பெயர் (தமிழ்)"}
                </label>
                <TransliteratedInput
                  type="text"
                  value={newCustTamil}
                  onChange={(e) => setNewCustTamil(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold focus:outline-none focus:bg-white"
                  placeholder="e.g. ponni -> பொன்னி"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">Mobile / Phone Number</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="10-digit mobile number"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold font-mono focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  {language === "Both" || language === "Dual" ? "Delivery Address / முகவரி" : "Delivery Address"}
                </label>
                <TransliteratedTextArea
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold focus:outline-none focus:bg-white h-16"
                />
              </div>

              <button
                type="submit"
                id="quick-customer-submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs transition-colors uppercase tracking-widest cursor-pointer"
              >
                {t("save") || "Create Customer"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SHORTCUTS HELP MODAL */}
      {showShortcutsModal && (
        <div id="shortcuts-modal" className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl relative">
            <button
              onClick={() => setShowShortcutsModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xs font-black text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wider border-b pb-2">
              <Keyboard className="w-4 h-4 text-blue-600 animate-bounce" />
              Cashier Terminal Shortcuts
            </h3>

            <div className="space-y-2.5 text-[11px] font-bold text-slate-600 uppercase">
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span>F2</span> <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-black text-slate-700">Clear / Reset Bill</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span>F3</span> <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-black text-slate-700">Select Customer</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span>F4</span> <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-black text-slate-700">Paid Amount Field</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span>F5</span> <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-black text-slate-700">Save &amp; Print Ticket</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span>F7</span> <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-black text-slate-700">Hold active Bill</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span>F9</span> <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-black text-slate-700">Focus Flat Discount</span>
              </div>
              <div className="flex justify-between">
                <span>ESC</span> <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-black text-slate-700">Close Window</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export { BillingPOS };
