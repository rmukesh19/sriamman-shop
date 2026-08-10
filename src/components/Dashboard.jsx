import { useLanguage } from "../contexts/LanguageContext.jsx";
import {
  TrendingUp,
  AlertTriangle,
  CircleDollarSign,
  ShoppingBag,
  Layers,
  FileText,
  ShieldCheck,
  BellRing,
  RefreshCw,
  Users,
  Wallet,
  Receipt,
  Coins,
  Landmark
} from "lucide-react";
const Dashboard = ({
  stats,
  onNavigate,
  isOnline,
  syncData,
  pendingOfflineCount,
  bills: _bills = [],
  purchases: _purchases = [],
  expenses: _expenses = [],
  customers: _customers = [],
  suppliers: _suppliers = [],
  products: _products = [],
  ledger: _ledger = [],
  accountsGroups: _accountsGroups = [],
  accountsLedgers: _accountsLedgers = []
}) => {
  const bills = Array.isArray(_bills) ? _bills : [];
  const purchases = Array.isArray(_purchases) ? _purchases : [];
  const expenses = Array.isArray(_expenses) ? _expenses : [];
  const customers = Array.isArray(_customers) ? _customers : [];
  const suppliers = Array.isArray(_suppliers) ? _suppliers : [];
  const products = Array.isArray(_products) ? _products : [];
  const ledger = Array.isArray(_ledger) ? _ledger : [];
  const accountsGroups = Array.isArray(_accountsGroups) ? _accountsGroups : [];
  const accountsLedgers = Array.isArray(_accountsLedgers) ? _accountsLedgers : [];

  const { t, language } = useLanguage();
  if (!stats) {
    return <div className="space-y-6 animate-pulse">
        {
      /* Sync Status bar skeleton */
    }
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
          <div className="space-y-2 w-full max-w-sm">
            <div className="h-5 bg-slate-200 rounded-md w-3/4" />
            <div className="h-3 bg-slate-100 rounded-md w-1/2" />
          </div>
          <div className="h-9 bg-slate-200 rounded-xl w-32 shrink-0" />
        </div>

        {
      /* 10 Grid skeleton */
    }
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-3 bg-slate-200 rounded-md w-16" />
                <div className="w-8 h-8 bg-slate-100 rounded-full" />
              </div>
              <div className="h-7 bg-slate-200 rounded-md w-24" />
              <div className="h-3 bg-slate-100 rounded-md w-20" />
            </div>)}
        </div>

        {
      /* Bottom structures skeletons */
    }
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs h-64 lg:col-span-2" />
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs h-64" />
        </div>
      </div>;
  }
  const { counters, charts, recentBills, notifications } = stats;
  const fmt = (num) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(num || 0);
  };
  const dailySales = charts?.dailySalesChart || [];
  const maxSale = Math.max(...dailySales.map((d) => d.amount || 0), 1e4);
  const todayDateStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const todaySalesVal = counters?.todaySales ?? bills.filter((b) => b.date?.startsWith(todayDateStr) && b.status !== "Cancelled").reduce((sum, b) => {
    if (b.paidAmount !== undefined && b.paidAmount !== null) return sum + Number(b.paidAmount);
    if (b.paymentType === "Credit") return sum + 0;
    return sum + (b.grandTotal || b.total || 0);
  }, 0);
  const todayPurchaseVal = counters?.todayPurchaseTotal ?? purchases.filter((p) => p.date?.startsWith(todayDateStr)).reduce((sum, p) => sum + (p.grandTotal || p.total || 0), 0);
  const cashEntries = ledger.filter((l) => l.accountGroup === "Cash" || l.particulars?.toLowerCase().includes("cash"));
  const cashDebit = cashEntries.filter((e) => e.type === "Debit").reduce((s, e) => s + e.amount, 0);
  const cashCredit = cashEntries.filter((e) => e.type === "Credit").reduce((s, e) => s + e.amount, 0);
  
  const groups = accountsGroups || [];
  const customLedgers = accountsLedgers || [];
  const cashOpening = customLedgers
    .filter(cl => {
      const g = groups.find(gp => gp.id === cl.groupId);
      return g && (g.name.toLowerCase().includes("cash") || g.type === "Cash");
    })
    .reduce((sum, cl) => sum + (cl.balanceType === "Debit" ? cl.openingBalance : -cl.openingBalance), 0);

  const cashBalanceVal = cashOpening + cashDebit - cashCredit;

  const bankEntries = ledger.filter((l) => l.accountGroup === "Bank" || l.particulars?.toLowerCase().includes("bank") || l.particulars?.toLowerCase().includes("upi") || l.particulars?.toLowerCase().includes("cheque"));
  const bankDebit = bankEntries.filter((e) => e.type === "Debit").reduce((s, e) => s + e.amount, 0);
  const bankCredit = bankEntries.filter((e) => e.type === "Credit").reduce((s, e) => s + e.amount, 0);
  const bankOpening = customLedgers
    .filter(cl => {
      const g = groups.find(gp => gp.id === cl.groupId);
      return g && (g.name.toLowerCase().includes("bank") || g.type === "Bank");
    })
    .reduce((sum, cl) => sum + (cl.balanceType === "Debit" ? cl.openingBalance : -cl.openingBalance), 0);
  const bankBalanceVal = bankOpening + bankDebit - bankCredit;

  const billOutstandingSum = bills
    .filter((b) => b.status !== "Cancelled")
    .reduce((sum, b) => {
      const tot = b.grandTotal !== undefined ? b.grandTotal : b.total || 0;
      const paid = b.paidAmount !== undefined ? b.paidAmount : (b.paymentType === "Credit" ? 0 : tot);
      return sum + Math.max(0, tot - paid);
    }, 0);
  const custMasterOutstandingSum = customers.reduce((sum, c) => sum + (Number(c.outstanding) || 0), 0);
  const outstandingVal = Math.max(custMasterOutstandingSum, billOutstandingSum);

  const purchaseOutstandingSum = purchases.reduce((sum, p) => {
    const tot = p.grandTotal !== undefined ? p.grandTotal : p.total || 0;
    const paid = p.paidAmount !== undefined ? p.paidAmount : 0;
    return sum + Math.max(0, tot - paid);
  }, 0);
  const suppMasterOutstandingSum = suppliers.reduce((sum, s) => sum + (Number(s.outstanding) || 0), 0);
  const supplierOutstandingVal = Math.max(suppMasterOutstandingSum, purchaseOutstandingSum);
  const openingStockVal = products.reduce((sum, p) => sum + (p.openingStock || 0) * (p.purchaseRate || p.purchasePrice || p.price || 0), 0);
  const stockValueVal = counters?.stockValue ?? products.reduce((sum, p) => sum + (p.currentStock || 0) * (p.purchaseRate || p.purchasePrice || p.price || 0), 0);
  const lowStockVal = counters?.lowStockCount ?? products.filter((p) => (p.currentStock || 0) <= (p.reorderLevel || 10)).length;
  const customerCountVal = customers.length;
  const profitVal = counters?.monthlyProfit ?? bills.filter((b) => b.status === "Active").reduce((s, b) => s + b.grandTotal, 0) + stockValueVal - (openingStockVal + purchases.reduce((s, p) => s + (p.grandTotal || p.total || 0), 0) + expenses.reduce((s, e) => s + e.amount, 0));
  const expenseVal = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const billsCountVal = bills.length;
  const kpiCards = [
    {
      id: "today-sales",
      title: t("todaySales") || "Today's Sales",
      value: fmt(todaySalesVal),
      subtext: `${counters?.todayBillsCount || bills.filter((b) => b.date?.startsWith(todayDateStr)).length} invoices`,
      icon: TrendingUp,
      gradient: "from-emerald-500 to-teal-600 shadow-emerald-500/10",
      action: () => onNavigate("billing")
    },
    {
      id: "today-purchase",
      title: "Today's Purchase",
      value: fmt(todayPurchaseVal),
      subtext: "Mill procurements",
      icon: ShoppingBag,
      gradient: "from-orange-500 to-amber-600 shadow-orange-500/10",
      action: () => onNavigate("purchase_entry")
    },
    {
      id: "cash-balance",
      title: "Cash Balance",
      value: fmt(cashBalanceVal),
      subtext: "Liquid ledger cash",
      icon: Wallet,
      gradient: "from-blue-600 to-indigo-700 shadow-blue-500/10",
      action: () => onNavigate("accounts_cashbook")
    },
    {
      id: "bank-balance",
      title: "Bank Balance",
      value: fmt(bankBalanceVal),
      subtext: "Calculated Bank Book Balance",
      icon: Landmark,
      gradient: "from-blue-400 to-cyan-500 shadow-blue-500/10",
      action: () => onNavigate("accounts_bankbook")
    },
    {
      id: "stock-value",
      title: t("stockValue") || "Stock Value",
      value: fmt(stockValueVal),
      subtext: "Valued at cost price",
      icon: Layers,
      gradient: "from-purple-600 to-indigo-800 shadow-purple-500/10",
      action: () => onNavigate("inventory_report")
    },
    {
      id: "customer-outstanding",
      title: "Customer Receivables",
      value: fmt(outstandingVal),
      subtext: "Customer Outstanding",
      icon: AlertTriangle,
      gradient: "from-rose-600 to-red-700 shadow-rose-500/10",
      action: () => onNavigate("reports_customer")
    },
    {
      id: "supplier-outstanding",
      title: "Supplier Payables",
      value: fmt(supplierOutstandingVal),
      subtext: "Mill Payables Outstanding",
      icon: ShoppingBag,
      gradient: "from-amber-600 to-orange-700 shadow-amber-500/10",
      action: () => onNavigate("reports_supplier")
    }
  ];

  return <div className="space-y-8 w-full">
      {
    /* Sync Status bar */
  }
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800">
              {t("subtitle")}
            </h2>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${isOnline ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
              {isOnline ? t("online") : t("offline")}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {language === "English" ? "Automatic backup and secure cloud synchronization active." : "\u0BA4\u0BBE\u0BA9\u0BBF\u0BAF\u0B99\u0BCD\u0B95\u0BBF \u0B95\u0BBF\u0BB3\u0BB5\u0BC1\u0B9F\u0BCD \u0B95\u0BBE\u0BAA\u0BCD\u0BAA\u0BC1\u0BAA\u0BCD\u0BAA\u0BBF\u0BB0\u0BA4\u0BBF \u0BAE\u0BB1\u0BCD\u0BB1\u0BC1\u0BAE\u0BCD \u0B92\u0BA4\u0BCD\u0BA4\u0BBF\u0B9A\u0BC8\u0BB5\u0BC1 \u0B9A\u0BC6\u0BAF\u0BB2\u0BCD\u0BAA\u0BBE\u0B9F\u0BCD\u0B9F\u0BBF\u0BB2\u0BCD \u0B89\u0BB3\u0BCD\u0BB3\u0BA4\u0BC1."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {pendingOfflineCount > 0 && <div className="text-right">
              <span className="text-xs font-semibold text-amber-700 block bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                {pendingOfflineCount} {t("notSynced")}
              </span>
            </div>}
          <button
            type="button"
            id="dashboard-sync-btn"
            onClick={syncData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/10 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {t("syncNow")}
          </button>
        </div>
      </div>

      {
    /* KPI Counters Grid */
  }
      <div id="stats-grid" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiCards.map((card) => {
          const IconComponent = card.icon;
          return <div
            key={card.id}
            onClick={card.action}
            className={`relative bg-gradient-to-br ${card.gradient} p-6 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 active:scale-98 transition-all duration-200 overflow-hidden cursor-pointer group`}
          >
            <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-white/5 rounded-full blur-xl group-hover:scale-120 transition-transform duration-300" />
            
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/80 block">
                {card.title}
              </span>
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white border border-white/10">
                <IconComponent className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-4">
              <p className="text-2xl font-black text-white tracking-tight font-mono">
                {card.value}
              </p>
              <p className="text-xs text-white/60 font-medium mt-1 truncate">
                {card.subtext}
              </p>
            </div>
          </div>;
        })}
      </div>

      {
    /* Quick Buttons */
  }
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <button
            onClick={() => onNavigate("billing")}
            className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 rounded-2xl text-slate-800 hover:text-blue-600 transition-all cursor-pointer group space-y-3 shadow-2xs"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider">New Bill</span>
          </button>

          <button
            onClick={() => onNavigate("purchase_entry")}
            className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 hover:border-orange-500 hover:bg-orange-50/30 rounded-2xl text-slate-800 hover:text-orange-600 transition-all cursor-pointer group space-y-3 shadow-2xs"
          >
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider">Purchase Entry</span>
          </button>

          <button
            onClick={() => onNavigate("masters_customers")}
            className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 rounded-2xl text-slate-800 hover:text-emerald-600 transition-all cursor-pointer group space-y-3 shadow-2xs"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider">Customer</span>
          </button>

          <button
            onClick={() => onNavigate("masters_products")}
            className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 hover:border-purple-500 hover:bg-purple-50/30 rounded-2xl text-slate-800 hover:text-purple-600 transition-all cursor-pointer group space-y-3 shadow-2xs"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider">Product</span>
          </button>

          <button
            onClick={() => onNavigate("reports_sales")}
            className="col-span-2 md:col-span-1 flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 rounded-2xl text-slate-800 hover:text-indigo-600 transition-all cursor-pointer group space-y-3 shadow-2xs"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider">Reports</span>
          </button>
        </div>
      </div>
    </div>;
};
export {
  Dashboard
};
