import { useState, useMemo } from "react";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import {
  Printer,
  FileSpreadsheet,
  BarChart4,
  Landmark,
  Search,
  User,
  Truck,
  TrendingUp,
  FileText
} from "lucide-react";

const ReportsModule = ({
  bills: _bills = [],
  purchases: _purchases = [],
  expenses: _expenses = [],
  incomes: _incomes = [],
  products: _products = [],
  customers: _customers = [],
  suppliers: _suppliers = [],
  ledger: _ledger = [],
  activeSubTab = "reports_sales",
  isOnline,
  loadAllData
}) => {
  const bills = Array.isArray(_bills) ? _bills : [];
  const purchases = Array.isArray(_purchases) ? _purchases : [];
  const expenses = Array.isArray(_expenses) ? _expenses : [];
  const incomes = Array.isArray(_incomes) ? _incomes : [];
  const products = Array.isArray(_products) ? _products : [];
  const customers = Array.isArray(_customers) ? _customers : [];
  const suppliers = Array.isArray(_suppliers) ? _suppliers : [];
  const ledger = Array.isArray(_ledger) ? _ledger : [];

  const { t } = useLanguage();

  // Dynamic Date Filter initialization
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedDay, setSelectedDay] = useState(() => new Date().toISOString().split("T")[0]);
  const [searchQuery, setSearchQuery] = useState("");

  const fmt = (num) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  const handleExportExcel = (title, data, columns, keys) => {
    if (!data || data.length === 0) return alert("No data to export.");
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += columns.join(",") + "\n";
    data.forEach((row) => {
      const line = keys.map((key) => {
        let val = row[key] !== undefined ? row[key] : "";
        if (typeof val === "string") {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(",");
      csvContent += line + "\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, "_")}_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = (title, data, columns, keys, totals) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const rowsHtml = data.map((row) => `
      <tr>
        ${keys.map((key) => {
          let val = row[key] !== undefined ? row[key] : "-";
          if (typeof val === "number") {
            val = val.toLocaleString("en-IN");
          }
          return `<td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${val}</td>`;
        }).join("")}
      </tr>
    `).join("");
    let totalsHtml = "";
    if (totals) {
      totalsHtml = `
        <tr style="background-color: #f8fafc; font-weight: bold; border-top: 2px solid #334155;">
          ${keys.map((key, idx) => {
            if (idx === 0) return `<td style="padding: 10px; font-size: 11px;">TOTAL</td>`;
            const totVal = totals[key] !== undefined ? (typeof totals[key] === "number" ? `₹${totals[key].toLocaleString("en-IN")}` : totals[key]) : "";
            return `<td style="padding: 10px; font-size: 11px; text-align: ${typeof totals[key] === "number" ? "right" : "left"};">${totVal}</td>`;
          }).join("")}
        </tr>
      `;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>${title} - SRI AMMAN TRADERS</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #1e293b; }
            h2 { margin: 0 0 4px 0; color: #0f172a; font-size: 18px; text-transform: uppercase; }
            p { margin: 0 0 16px 0; font-size: 11px; color: #64748b; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background-color: #f1f5f9; text-align: left; padding: 8px; font-size: 10px; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
            @media print {
              body { padding: 0; }
              @page { size: auto; margin: 15mm; }
            }
          </style>
        </head>
        <body>
          <h2>SRI AMMAN TRADERS • RICE MERCHANTS</h2>
          <p>${title.toUpperCase()} • Generated on ${new Date().toLocaleString("en-IN")}</p>
          <table>
            <thead>
              <tr>
                ${columns.map((col) => `<th>${col}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              ${totalsHtml}
            </tbody>
          </table>
          <div style="margin-top: 40px; display: flex; justify-between: space-between; font-size: 11px; font-weight: bold;">
            <div>Prepared By: _________________</div>
            <div>Authorized Signatory: _________________</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  // ---------------- 1. FILTERED SALES REPORT ----------------
  const filteredSales = useMemo(() => {
    return bills.filter((b) => {
      if (b.status === "Cancelled") return false;
      const bDate = (b.date || b.createdAt || "").substring(0, 10);
      const matchDate = (!fromDate || bDate >= fromDate) && (!toDate || bDate <= toDate);
      const matchSearch =
        (b.invoiceNo || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.customerName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.customerPhone || "").includes(searchQuery);
      return matchDate && matchSearch;
    });
  }, [bills, fromDate, toDate, searchQuery]);

  const salesTotals = useMemo(() => {
    const total = filteredSales.reduce((sum, s) => sum + (s.grandTotal !== undefined ? s.grandTotal : s.total || 0), 0);
    const received = filteredSales.reduce((sum, s) => {
      if (s.paidAmount !== undefined && s.paidAmount !== null) return sum + Number(s.paidAmount);
      if (s.paymentType === "Credit") return sum + 0;
      return sum + (s.grandTotal !== undefined ? s.grandTotal : s.total || 0);
    }, 0);
    const credit = filteredSales.reduce((sum, s) => {
      if (s.balance !== undefined && s.balance !== null) return sum + Number(s.balance);
      const inv = s.grandTotal !== undefined ? s.grandTotal : s.total || 0;
      const paid = s.paidAmount !== undefined ? s.paidAmount : (s.paymentType === "Credit" ? 0 : inv);
      return sum + Math.max(0, inv - paid);
    }, 0);
    return { total, received, credit };
  }, [filteredSales]);

  // ---------------- 2. FILTERED PURCHASES REPORT ----------------
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const pDate = (p.date || p.createdAt || "").substring(0, 10);
      const matchDate = (!fromDate || pDate >= fromDate) && (!toDate || pDate <= toDate);
      const matchSearch =
        (p.purchaseNo || p.invoiceNo || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.supplierName || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchDate && matchSearch;
    });
  }, [purchases, fromDate, toDate, searchQuery]);

  const purchaseTotals = useMemo(() => {
    const total = filteredPurchases.reduce((sum, p) => sum + (p.grandTotal || p.total || 0), 0);
    return { total };
  }, [filteredPurchases]);

  // ---------------- 3. INVENTORY STOCK REPORT ----------------
  const stockReportItems = useMemo(() => {
    return products
      .map((p) => {
        const value = (p.currentStock || 0) * (p.purchaseRate || 0);
        const salesValue = (p.currentStock || 0) * (p.sellingRate || 0);
        return {
          ...p,
          value,
          salesValue,
          status: (p.currentStock || 0) <= (p.minimumStock || 10) ? "LOW STOCK" : "OK"
        };
      })
      .filter(
        (p) =>
          (p.englishName || p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.productCode || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [products, searchQuery]);

  const stockTotals = useMemo(() => {
    const totalItems = stockReportItems.length;
    const totalBags = stockReportItems.reduce((sum, p) => sum + (p.currentStock || 0), 0);
    const totalCostValue = stockReportItems.reduce((sum, p) => sum + p.value, 0);
    const totalSalesValue = stockReportItems.reduce((sum, p) => sum + p.salesValue, 0);
    return { totalItems, totalBags, totalCostValue, totalSalesValue };
  }, [stockReportItems]);

  // ---------------- 4. CUSTOMER REPORT ----------------
  const customerReportData = useMemo(() => {
    return customers
      .map((c) => {
        const custBills = bills.filter((b) => {
          if (b.status === "Cancelled") return false;
          const bDate = (b.date || b.createdAt || "").substring(0, 10);
          const matchDate = (!fromDate || bDate >= fromDate) && (!toDate || bDate <= toDate);
          const matchCust = b.customerId === c.id || b.customerName === c.name || (c.mobile && b.customerPhone === c.mobile) || (c.phone && b.customerPhone === c.phone);
          return matchDate && matchCust;
        });

        const totalBills = custBills.length;
        const totalSales = custBills.reduce((s, b) => s + (b.grandTotal !== undefined ? b.grandTotal : b.total || 0), 0);
        const paidAmount = custBills.reduce((s, b) => {
          if (b.paidAmount !== undefined && b.paidAmount !== null) return s + Number(b.paidAmount);
          if (b.paymentType === "Credit") return s + 0;
          return s + (b.grandTotal !== undefined ? b.grandTotal : b.total || 0);
        }, 0);

        const sortedBills = [...custBills].sort((a, b) => (b.date || b.createdAt || "").localeCompare(a.date || a.createdAt || ""));
        const lastBillDate = sortedBills.length > 0 ? (sortedBills[0].date || sortedBills[0].createdAt || "").substring(0, 10) : "-";

        const calculatedDue = Math.max(0, totalSales - paidAmount);
        const outstandingAmount = Math.max(Number(c.outstanding) || 0, calculatedDue);

        const allPayments = custBills.flatMap(b => b.payments || []);
        const sortedPayments = [...allPayments].sort((p1, p2) => (p2.date || "").localeCompare(p1.date || ""));
        const lastPaymentDate = c.lastPaymentDate || (sortedPayments.length > 0 ? (sortedPayments[0].date || "").substring(0, 10) : "-");

        let status = "Active";
        if (outstandingAmount <= 0 && totalSales > 0) {
          status = "Paid";
        } else if (paidAmount > 0 && outstandingAmount > 0) {
          status = "Partial";
        } else if (paidAmount === 0 && outstandingAmount > 0) {
          status = "Pending";
        } else if (outstandingAmount === 0) {
          status = "Paid";
        }

        return {
          id: c.id,
          name: c.name || "Customer",
          mobile: c.mobile || c.phone || "-",
          address: c.address || c.city || "-",
          totalBills,
          totalSales,
          paidAmount,
          outstandingAmount,
          lastPaymentDate,
          lastBillDate,
          status
        };
      })
      .filter((c) => {
        const q = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.mobile.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q)
        );
      });
  }, [customers, bills, fromDate, toDate, searchQuery]);

  const customerReportTotals = useMemo(() => {
    const sales = customerReportData.reduce((s, c) => s + c.totalSales, 0);
    const paid = customerReportData.reduce((s, c) => s + c.paidAmount, 0);
    const due = customerReportData.reduce((s, c) => s + c.outstandingAmount, 0);
    const billsCount = customerReportData.reduce((s, c) => s + c.totalBills, 0);
    return { sales, paid, due, billsCount };
  }, [customerReportData]);

  // ---------------- 5. SUPPLIER REPORT ----------------
  const supplierReportData = useMemo(() => {
    return suppliers
      .map((s) => {
        const suppPurchases = purchases.filter((p) => {
          const pDate = (p.date || p.createdAt || "").substring(0, 10);
          const matchDate = (!fromDate || pDate >= fromDate) && (!toDate || pDate <= toDate);
          const matchSupp = p.supplierId === s.id || p.supplierName === s.name;
          return matchDate && matchSupp;
        });

        const totalPurchasesCount = suppPurchases.length;
        const totalPurchases = suppPurchases.reduce((sum, p) => sum + (p.grandTotal !== undefined ? p.grandTotal : p.total || 0), 0);
        const paidAmount = suppPurchases.reduce((sum, p) => {
          if (p.paidAmount !== undefined && p.paidAmount !== null) return sum + Number(p.paidAmount);
          if (p.paymentType === "Credit") return sum + 0;
          return sum + (p.grandTotal !== undefined ? p.grandTotal : p.total || 0);
        }, 0);

        const sortedPurchases = [...suppPurchases].sort((a, b) => (b.date || b.createdAt || "").localeCompare(a.date || a.createdAt || ""));
        const lastPurchaseDate = sortedPurchases.length > 0 ? (sortedPurchases[0].date || sortedPurchases[0].createdAt || "").substring(0, 10) : "-";

        const calculatedDue = totalPurchases - paidAmount;
        const pendingAmount = s.outstanding !== undefined && s.outstanding !== null ? Number(s.outstanding) : Math.max(0, calculatedDue);

        return {
          id: s.id,
          name: s.name || "Supplier",
          mobile: s.mobile || s.phone || "-",
          address: s.address || s.companyName || "-",
          totalPurchasesCount,
          totalPurchases,
          paidAmount,
          pendingAmount,
          lastPurchaseDate,
          status: s.status || "Active"
        };
      })
      .filter((s) => {
        const q = searchQuery.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.mobile.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q)
        );
      });
  }, [suppliers, purchases, fromDate, toDate, searchQuery]);

  const supplierReportTotals = useMemo(() => {
    const purchasesVal = supplierReportData.reduce((s, supp) => s + supp.totalPurchases, 0);
    const paid = supplierReportData.reduce((s, supp) => s + supp.paidAmount, 0);
    const due = supplierReportData.reduce((s, supp) => s + supp.pendingAmount, 0);
    const count = supplierReportData.reduce((s, supp) => s + supp.totalPurchasesCount, 0);
    return { purchasesVal, paid, due, count };
  }, [supplierReportData]);

  // ---------------- 6. OUTSTANDING AGING ----------------
  const outstandingAging = useMemo(() => {
    const custOut = customers
      .filter((c) => (c.outstanding || 0) > 0)
      .map((c) => ({
        name: c.name,
        type: "Customer Receivable",
        phone: c.phone || c.mobile || "-",
        amount: c.outstanding,
        aging: "0 - 30 Days"
      }));
    const suppOut = suppliers
      .filter((s) => (s.outstanding || 0) > 0)
      .map((s) => ({
        name: s.name,
        type: "Supplier Payable",
        phone: s.phone || s.mobile || "-",
        amount: s.outstanding,
        aging: "0 - 30 Days"
      }));
    return [...custOut, ...suppOut].filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [customers, suppliers, searchQuery]);

  // ---------------- 7. DAY BOOK REPORT ----------------
  const dayBookEntries = useMemo(() => {
    const dayBills = bills
      .filter((b) => (b.date || b.createdAt || "").substring(0, 10) === selectedDay)
      .map((b) => ({
        time: (b.createdAt || "").split("T")[1]?.slice(0, 5) || "09:30",
        type: `Sale (${b.paymentType || 'Cash'})`,
        particulars: `Bill: ${b.invoiceNo} - ${b.customerName || 'Walk-in'}`,
        ref: b.invoiceNo,
        inflow: b.grandTotal || b.total || 0,
        outflow: 0
      }));
    const dayPurchases = purchases
      .filter((p) => (p.date || p.createdAt || "").substring(0, 10) === selectedDay)
      .map((p) => ({
        time: (p.createdAt || "").split("T")[1]?.slice(0, 5) || "11:00",
        type: "Purchase (Outflow)",
        particulars: `Supplier: ${p.supplierName}`,
        ref: p.purchaseNo || "PUR",
        inflow: 0,
        outflow: p.grandTotal || p.total || 0
      }));
    const dayExpenses = expenses
      .filter((e) => e.date === selectedDay)
      .map((e) => ({
        time: "14:00",
        type: "Expense Entry",
        particulars: `Paid for ${e.category} - ${e.note || e.remarks || ''}`,
        ref: "EXP",
        inflow: 0,
        outflow: e.amount || 0
      }));
    const dayIncomes = incomes
      .filter((i) => i.date === selectedDay)
      .map((i) => ({
        time: "15:00",
        type: "Income Entry",
        particulars: `Received for ${i.category} - ${i.remarks || ''}`,
        ref: "INC",
        inflow: i.amount || 0,
        outflow: 0
      }));
    return [...dayBills, ...dayPurchases, ...dayExpenses, ...dayIncomes].sort((a, b) => a.time.localeCompare(b.time));
  }, [bills, purchases, expenses, incomes, selectedDay]);

  // ---------------- 8. BANK REPORT ----------------
  const bankReportData = useMemo(() => {
    const bankLedgerEntries = ledger.filter(
      (l) =>
        l.accountGroup === "Bank" ||
        l.particulars?.toLowerCase().includes("bank") ||
        l.particulars?.toLowerCase().includes("upi") ||
        l.particulars?.toLowerCase().includes("card")
    );

    const priorEntries = bankLedgerEntries.filter((l) => (l.date || "").substring(0, 10) < fromDate);
    const priorIn = priorEntries.filter((l) => l.type === "Debit").reduce((s, l) => s + (l.amount || 0), 0);
    const priorOut = priorEntries.filter((l) => l.type === "Credit").reduce((s, l) => s + (l.amount || 0), 0);
    const openingBalance = priorIn - priorOut;

    const periodEntries = bankLedgerEntries.filter((l) => {
      const d = (l.date || "").substring(0, 10);
      const matchDate = (!fromDate || d >= fromDate) && (!toDate || d <= toDate);
      const matchSearch = (l.particulars || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchDate && matchSearch;
    });

    const cashDeposits = periodEntries
      .filter((l) => l.type === "Debit" && l.particulars?.toLowerCase().includes("deposit"))
      .reduce((s, l) => s + (l.amount || 0), 0);

    const bankReceipts = periodEntries
      .filter((l) => l.type === "Debit" && !l.particulars?.toLowerCase().includes("deposit"))
      .reduce((s, l) => s + (l.amount || 0), 0);

    const bankPayments = periodEntries
      .filter((l) => l.type === "Credit")
      .reduce((s, l) => s + (l.amount || 0), 0);

    const closingBalance = openingBalance + cashDeposits + bankReceipts - bankPayments;

    return {
      openingBalance,
      cashDeposits,
      bankReceipts,
      bankPayments,
      closingBalance,
      periodEntries
    };
  }, [ledger, fromDate, toDate, searchQuery]);

  // ---------------- 9. DAILY SALES REPORT ----------------
  const dailySalesReport = useMemo(() => {
    const map = {};
    filteredSales.forEach((s) => {
      const d = (s.date || s.createdAt || "").substring(0, 10);
      if (!map[d]) {
        map[d] = { date: d, count: 0, cash: 0, bank: 0, credit: 0, total: 0 };
      }
      map[d].count += 1;
      const amt = s.grandTotal !== undefined ? s.grandTotal : s.total || 0;
      map[d].total += amt;
      if (s.paymentType === "Credit") map[d].credit += amt;
      else if (s.paymentType === "Bank" || s.paymentType === "UPI") map[d].bank += amt;
      else map[d].cash += amt;
    });
    return Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredSales]);

  // ---------------- 10. MONTHLY SALES REPORT ----------------
  const monthlySalesReport = useMemo(() => {
    const map = {};
    bills.forEach((s) => {
      if (s.status === "Cancelled") return;
      const m = (s.date || s.createdAt || "").substring(0, 7);
      if (!map[m]) {
        map[m] = { month: m, count: 0, total: 0 };
      }
      map[m].count += 1;
      const amt = s.grandTotal !== undefined ? s.grandTotal : s.total || 0;
      map[m].total += amt;
    });
    return Object.values(map).sort((a, b) => b.month.localeCompare(a.month));
  }, [bills]);

  // ---------------- 11. PROFIT REPORT ----------------
  const profitReport = useMemo(() => {
    const totalSales = filteredSales.reduce((sum, s) => sum + (s.grandTotal !== undefined ? s.grandTotal : s.total || 0), 0);
    const cogs = totalSales * 0.85;
    const grossProfit = totalSales - cogs;
    const periodExpenses = expenses
      .filter((e) => {
        const d = (e.date || "").substring(0, 10);
        return (!fromDate || d >= fromDate) && (!toDate || d <= toDate);
      })
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    const periodOtherIncome = incomes
      .filter((i) => {
        const d = (i.date || "").substring(0, 10);
        return (!fromDate || d >= fromDate) && (!toDate || d <= toDate);
      })
      .reduce((sum, i) => sum + (i.amount || 0), 0);

    const netProfit = grossProfit + periodOtherIncome - periodExpenses;

    return {
      totalSales,
      cogs,
      grossProfit,
      expensesTotal: periodExpenses,
      otherIncomeTotal: periodOtherIncome,
      netProfit
    };
  }, [filteredSales, expenses, incomes, fromDate, toDate]);

  return (
    <div className="space-y-6 select-none font-semibold text-slate-800 pb-10">
      {/* Date Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <BarChart4 className="w-5 h-5 text-blue-600" />
            {activeSubTab.replace("reports_", "").replace("_", " ").toUpperCase()} REPORT
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            SRI AMMAN TRADERS • LIVE ANALYTICAL DESK
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {activeSubTab === "reports_daybook" ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold uppercase">Select Day:</span>
              <input
                type="date"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-400 font-bold">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="relative w-full sm:w-44">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Quick filter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-bold placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
            />
          </div>
        </div>
      </div>

      {/* ==================== 1. SALES REPORT ==================== */}
      {(activeSubTab === "reports_sales" || activeSubTab === "sales") && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-black uppercase text-slate-900">Invoiced Retail & Wholesale Sales</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Summary of all outward transactions</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  handleExportExcel(
                    "Sales_Report",
                    filteredSales,
                    ["Invoice No", "Customer", "Date", "Grand Total (INR)"],
                    ["invoiceNo", "customerName", "date", "grandTotal"]
                  )
                }
                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 flex items-center gap-1 text-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV
              </button>
              <button
                onClick={() =>
                  handlePrint(
                    "Sales Report",
                    filteredSales.map((s) => ({ ...s, date: (s.date || s.createdAt || "").slice(0, 10) })),
                    ["Invoice No", "Customer", "Date", "Grand Total (INR)"],
                    ["invoiceNo", "customerName", "date", "grandTotal"],
                    { grandTotal: salesTotals.total }
                  )
                }
                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 flex items-center gap-1 text-xs cursor-pointer"
              >
                <Printer className="w-4 h-4 text-blue-600" /> Print Report
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black block">Total Bills</span>
              <span className="text-lg font-black text-slate-900 mt-1 block">{filteredSales.length} Bills</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black block">Total Invoice Amount</span>
              <span className="text-lg font-black text-blue-600 mt-1 block">{fmt(salesTotals.total)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black block">Received Amount</span>
              <span className="text-lg font-black text-emerald-600 mt-1 block">{fmt(salesTotals.received)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black block">Outstanding Amount</span>
              <span className="text-lg font-black text-rose-600 mt-1 block">{fmt(salesTotals.credit)}</span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Invoice No</th>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">Billing Date</th>
                  <th className="p-3">Payment Mode</th>
                  <th className="p-3 text-right">Invoice Amount</th>
                  <th className="p-3 text-right">Received Amount</th>
                  <th className="p-3 text-right">Outstanding</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400 italic">No sales bills found</td>
                  </tr>
                ) : (
                  filteredSales.map((s) => {
                    const invTotal = s.grandTotal !== undefined ? s.grandTotal : s.total || 0;
                    const rcvd = s.paidAmount !== undefined && s.paidAmount !== null ? Number(s.paidAmount) : (s.paymentType === "Credit" ? 0 : invTotal);
                    const out = s.balance !== undefined && s.balance !== null ? Number(s.balance) : Math.max(0, invTotal - rcvd);
                    let st = "Paid";
                    if (out > 0 && rcvd > 0) st = "Partial";
                    else if (out > 0 && rcvd === 0) st = "Pending";

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="p-3 text-blue-600 font-black font-mono">{s.invoiceNo}</td>
                        <td className="p-3 text-slate-800">{s.customerName || "Walk-in Customer"}</td>
                        <td className="p-3 text-slate-400 font-mono">{(s.date || s.createdAt || "").slice(0, 10)}</td>
                        <td className="p-3">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                            {s.paymentType || "Cash"}
                          </span>
                        </td>
                        <td className="p-3 text-right font-black text-slate-900">{fmt(invTotal)}</td>
                        <td className="p-3 text-right font-bold text-emerald-600">{fmt(rcvd)}</td>
                        <td className={`p-3 text-right font-black font-mono ${out > 0 ? "text-rose-600" : "text-slate-400"}`}>{fmt(out)}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${st === "Paid" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : st === "Partial" ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-rose-50 text-rose-700 border border-rose-100"}`}>
                            {st}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== 2. DAILY SALES REPORT ==================== */}
      {(activeSubTab === "reports_daily" || activeSubTab === "daily") && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-black uppercase text-slate-900">Daily Sales Revenue Breakdown</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Aggregated daily cash, bank and credit sales totals</p>
            </div>
            <button
              onClick={() =>
                handleExportExcel(
                  "Daily_Sales",
                  dailySalesReport,
                  ["Date", "Bills Count", "Cash Sales", "Bank/UPI Sales", "Credit Sales", "Total Revenue"],
                  ["date", "count", "cash", "bank", "credit", "total"]
                )
              }
              className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 flex items-center gap-1 text-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-center">Bills Count</th>
                  <th className="p-3 text-right">Cash Sales</th>
                  <th className="p-3 text-right">Bank / UPI</th>
                  <th className="p-3 text-right">Credit Sales</th>
                  <th className="p-3 text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {dailySalesReport.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400 italic">No sales recorded</td>
                  </tr>
                ) : (
                  dailySalesReport.map((row) => (
                    <tr key={row.date} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono text-slate-900 font-bold">{row.date}</td>
                      <td className="p-3 text-center font-bold text-blue-600">{row.count}</td>
                      <td className="p-3 text-right text-emerald-600 font-mono">{fmt(row.cash)}</td>
                      <td className="p-3 text-right text-indigo-600 font-mono">{fmt(row.bank)}</td>
                      <td className="p-3 text-right text-rose-600 font-mono">{fmt(row.credit)}</td>
                      <td className="p-3 text-right font-black text-slate-900">{fmt(row.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== 3. MONTHLY SALES REPORT ==================== */}
      {(activeSubTab === "reports_monthly" || activeSubTab === "monthly") && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-black uppercase text-slate-900">Monthly Sales Revenue Trend</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Month-wise total turnover</p>
            </div>
            <button
              onClick={() =>
                handleExportExcel(
                  "Monthly_Sales",
                  monthlySalesReport,
                  ["Month", "Invoices Issued", "Total Revenue (INR)"],
                  ["month", "count", "total"]
                )
              }
              className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 flex items-center gap-1 text-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Month (YYYY-MM)</th>
                  <th className="p-3 text-center">Invoices Issued</th>
                  <th className="p-3 text-right">Gross Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {monthlySalesReport.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-slate-400 italic">No monthly data available</td>
                  </tr>
                ) : (
                  monthlySalesReport.map((m) => (
                    <tr key={m.month} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-slate-900">{m.month}</td>
                      <td className="p-3 text-center font-bold text-blue-600">{m.count}</td>
                      <td className="p-3 text-right font-black text-emerald-600">{fmt(m.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== 4. PURCHASE REPORT ==================== */}
      {(activeSubTab === "reports_purchase" || activeSubTab === "purchase") && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-black uppercase text-slate-900">Mill Procurement Sourcing Orders</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Purchases from rice mills and suppliers</p>
            </div>
            <button
              onClick={() =>
                handleExportExcel(
                  "Purchase_Report",
                  filteredPurchases,
                  ["Purchase No", "Supplier Name", "Date", "Status", "Grand Total (INR)"],
                  ["purchaseNo", "supplierName", "date", "status", "grandTotal"]
                )
              }
              className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 flex items-center gap-1 text-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV
            </button>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-black block">Total Sourced Cost</span>
            <span className="text-lg font-black text-rose-600 mt-1 block">{fmt(purchaseTotals.total)}</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Purchase No</th>
                  <th className="p-3">Supplier Name</th>
                  <th className="p-3">Sourcing Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Grand Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400 italic">No purchase entries found</td>
                  </tr>
                ) : (
                  filteredPurchases.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="p-3 text-blue-600 font-black font-mono">{p.purchaseNo || "PUR-2026-N"}</td>
                      <td className="p-3 text-slate-800">{p.supplierName}</td>
                      <td className="p-3 text-slate-400 font-mono">{(p.date || p.createdAt || "").slice(0, 10)}</td>
                      <td className="p-3">
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-black uppercase">
                          {p.status || "Received"}
                        </span>
                      </td>
                      <td className="p-3 text-right font-black text-slate-900">{fmt(p.grandTotal || p.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== 5. CUSTOMER REPORT ==================== */}
      {(activeSubTab === "reports_customer" || activeSubTab === "customer") && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-600" /> Customer Sales & Outstanding Balance Report
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Comprehensive billing, collections & balance statement for all buyers</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  handleExportExcel(
                    "Customer_Report",
                    customerReportData,
                    ["Customer Name", "Mobile Number", "Address", "Total Bills", "Total Invoice Amount (INR)", "Received Amount (INR)", "Outstanding Amount (INR)", "Last Payment Date", "Last Bill Date", "Status"],
                    ["name", "mobile", "address", "totalBills", "totalSales", "paidAmount", "outstandingAmount", "lastPaymentDate", "lastBillDate", "status"]
                  )
                }
                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 flex items-center gap-1 text-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV
              </button>
              <button
                onClick={() =>
                  handlePrint(
                    "Customer Sales & Outstanding Report",
                    customerReportData,
                    ["Customer Name", "Mobile Number", "Address", "Total Bills", "Total Invoice Amount (INR)", "Received Amount (INR)", "Outstanding Amount (INR)", "Last Payment Date", "Last Bill Date", "Status"],
                    ["name", "mobile", "address", "totalBills", "totalSales", "paidAmount", "outstandingAmount", "lastPaymentDate", "lastBillDate", "status"],
                    {
                      name: "TOTAL",
                      totalBills: customerReportTotals.billsCount,
                      totalSales: customerReportTotals.sales,
                      paidAmount: customerReportTotals.paid,
                      outstandingAmount: customerReportTotals.due
                    }
                  )
                }
                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 flex items-center gap-1 text-xs cursor-pointer"
              >
                <Printer className="w-4 h-4 text-blue-600" /> Print PDF Report
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black block">Total Customers</span>
              <span className="text-lg font-black text-slate-900 mt-1 block">{customerReportData.length}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black block">Total Invoice Amount</span>
              <span className="text-lg font-black text-blue-600 mt-1 block">{fmt(customerReportTotals.sales)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black block">Total Received Amount</span>
              <span className="text-lg font-black text-emerald-600 mt-1 block">{fmt(customerReportTotals.paid)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black block">Total Outstanding Balance</span>
              <span className="text-lg font-black text-rose-600 mt-1 block">{fmt(customerReportTotals.due)}</span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">Mobile Number</th>
                  <th className="p-3">Address</th>
                  <th className="p-3 text-center">Total Bills</th>
                  <th className="p-3 text-right">Total Invoice Amount</th>
                  <th className="p-3 text-right">Received Amount</th>
                  <th className="p-3 text-right">Outstanding Amount</th>
                  <th className="p-3 text-center">Last Payment Date</th>
                  <th className="p-3 text-center">Last Bill Date</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerReportData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-6 text-center text-slate-400 italic">No customer records found</td>
                  </tr>
                ) : (
                  customerReportData.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-900">{c.name}</td>
                      <td className="p-3 font-mono text-slate-600">{c.mobile}</td>
                      <td className="p-3 text-slate-500 max-w-[200px] truncate">{c.address}</td>
                      <td className="p-3 text-center font-bold text-blue-600">{c.totalBills}</td>
                      <td className="p-3 text-right font-black text-slate-900">{fmt(c.totalSales)}</td>
                      <td className="p-3 text-right font-bold text-emerald-600">{fmt(c.paidAmount)}</td>
                      <td className={`p-3 text-right font-black font-mono ${c.outstandingAmount > 0 ? "text-rose-600" : "text-slate-400"}`}>
                        {fmt(c.outstandingAmount)}
                      </td>
                      <td className="p-3 text-center font-mono text-slate-500">{c.lastPaymentDate || "-"}</td>
                      <td className="p-3 text-center font-mono text-slate-500">{c.lastBillDate}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${c.status === "Paid" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : c.status === "Partial" ? "bg-amber-50 text-amber-700 border border-amber-100" : c.status === "Pending" ? "bg-rose-50 text-rose-700 border border-rose-100" : "bg-slate-100 text-slate-600"}`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== 6. SUPPLIER REPORT ==================== */}
      {(activeSubTab === "reports_supplier" || activeSubTab === "supplier") && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-orange-600" /> Supplier Purchases & Pending Debts Report
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Procurement orders, mill outflows & pending payable liabilities</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  handleExportExcel(
                    "Supplier_Report",
                    supplierReportData,
                    ["Supplier Name", "Mobile Number", "Address", "Total Purchases", "Paid Amount (INR)", "Pending Amount (INR)", "Last Purchase Date", "Status"],
                    ["name", "mobile", "address", "totalPurchases", "paidAmount", "pendingAmount", "lastPurchaseDate", "status"]
                  )
                }
                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 flex items-center gap-1 text-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV
              </button>
              <button
                onClick={() =>
                  handlePrint(
                    "Supplier Purchases & Payable Report",
                    supplierReportData,
                    ["Supplier Name", "Mobile Number", "Address", "Total Purchases", "Paid Amount (INR)", "Pending Amount (INR)", "Last Purchase Date", "Status"],
                    ["name", "mobile", "address", "totalPurchases", "paidAmount", "pendingAmount", "lastPurchaseDate", "status"],
                    {
                      name: "TOTAL",
                      totalPurchasesCount: supplierReportTotals.count,
                      totalPurchases: supplierReportTotals.purchasesVal,
                      paidAmount: supplierReportTotals.paid,
                      pendingAmount: supplierReportTotals.due
                    }
                  )
                }
                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 flex items-center gap-1 text-xs cursor-pointer"
              >
                <Printer className="w-4 h-4 text-blue-600" /> Print PDF Report
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black block">Total Suppliers</span>
              <span className="text-lg font-black text-slate-900 mt-1 block">{supplierReportData.length}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black block">Total Purchases</span>
              <span className="text-lg font-black text-rose-600 mt-1 block">{fmt(supplierReportTotals.purchasesVal)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black block">Total Outflow Paid</span>
              <span className="text-lg font-black text-emerald-600 mt-1 block">{fmt(supplierReportTotals.paid)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black block">Total Pending Debts</span>
              <span className="text-lg font-black text-amber-600 mt-1 block">{fmt(supplierReportTotals.due)}</span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Supplier Name</th>
                  <th className="p-3">Mobile Number</th>
                  <th className="p-3">Address / Location</th>
                  <th className="p-3 text-center">Total Orders</th>
                  <th className="p-3 text-right">Total Purchases</th>
                  <th className="p-3 text-right">Paid Amount</th>
                  <th className="p-3 text-right">Pending Amount</th>
                  <th className="p-3 text-center">Last Purchase Date</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supplierReportData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-slate-400 italic">No supplier records found</td>
                  </tr>
                ) : (
                  supplierReportData.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-900">{s.name}</td>
                      <td className="p-3 font-mono text-slate-600">{s.mobile}</td>
                      <td className="p-3 text-slate-500 max-w-[200px] truncate">{s.address}</td>
                      <td className="p-3 text-center font-bold text-blue-600">{s.totalPurchasesCount}</td>
                      <td className="p-3 text-right font-black text-slate-900">{fmt(s.totalPurchases)}</td>
                      <td className="p-3 text-right font-bold text-emerald-600">{fmt(s.paidAmount)}</td>
                      <td className={`p-3 text-right font-black font-mono ${s.pendingAmount > 0 ? "text-amber-600" : "text-slate-400"}`}>
                        {fmt(s.pendingAmount)}
                      </td>
                      <td className="p-3 text-center font-mono text-slate-500">{s.lastPurchaseDate}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${s.status === "Inactive" ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-700 border border-emerald-100"}`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== 7. STOCK REPORT ==================== */}
      {(activeSubTab === "reports_stock" || activeSubTab === "stock") && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-black uppercase text-slate-900">🌾 Inventory Rice Bags Stock Valuation</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Live stock quantity, reorder levels & purchase valuation</p>
            </div>
            <button
              onClick={() =>
                handleExportExcel(
                  "Stock_Valuation",
                  stockReportItems,
                  ["Product Code", "English Name", "Tamil Name", "Current Stock (Bags)", "Cost Value (INR)", "Status"],
                  ["productCode", "englishName", "tamilName", "currentStock", "value", "status"]
                )
              }
              className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 flex items-center gap-1 text-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black block">Total Stock Quantity</span>
              <span className="text-lg font-black text-blue-600 mt-1 block">{stockTotals.totalBags} Bags</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black block">Purchase Valuation</span>
              <span className="text-lg font-black text-emerald-600 mt-1 block">{fmt(stockTotals.totalCostValue)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black block">Retail Selling Value</span>
              <span className="text-lg font-black text-indigo-600 mt-1 block">{fmt(stockTotals.totalSalesValue)}</span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Code</th>
                  <th className="p-3">Rice Variety Name</th>
                  <th className="p-3">Current Stock</th>
                  <th className="p-3 text-right">Purchase Rate</th>
                  <th className="p-3 text-right">Selling Rate</th>
                  <th className="p-3 text-right">Cost Value</th>
                  <th className="p-3 text-center">Stock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockReportItems.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono text-slate-400">{p.productCode}</td>
                    <td className="p-3 font-bold text-slate-800">{p.englishName || p.name}</td>
                    <td className="p-3 font-black text-blue-600">{p.currentStock} Bags</td>
                    <td className="p-3 text-right font-mono text-slate-600">{fmt(p.purchaseRate)}</td>
                    <td className="p-3 text-right font-mono text-slate-600">{fmt(p.sellingRate)}</td>
                    <td className="p-3 text-right font-black text-emerald-600">{fmt(p.value)}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.status === "LOW STOCK" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== 8. OUTSTANDING REPORT ==================== */}
      {(activeSubTab === "reports_outstanding" || activeSubTab === "outstanding") && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-black uppercase text-slate-900">Outstanding Receivables & Payables Aging</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Control credit risks with automatic customer & supplier balances</p>
            </div>
            <button
              onClick={() =>
                handleExportExcel(
                  "Outstanding_Aging",
                  outstandingAging,
                  ["Name", "Type", "Phone", "Amount (INR)", "Aging Bucket"],
                  ["name", "type", "phone", "amount", "aging"]
                )
              }
              className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 flex items-center gap-1 text-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Party Name</th>
                  <th className="p-3">Classification</th>
                  <th className="p-3">Contact Phone</th>
                  <th className="p-3">Aging Bucket</th>
                  <th className="p-3 text-right">Outstanding Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {outstandingAging.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400 italic">No outstanding balances found</td>
                  </tr>
                ) : (
                  outstandingAging.map((o, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3 text-slate-950 font-black">{o.name}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${o.type.includes("Receivable") ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"}`}>
                          {o.type}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 font-mono">{o.phone}</td>
                      <td className="p-3 text-slate-600 font-mono">{o.aging}</td>
                      <td className={`p-3 text-right font-black font-mono ${o.type.includes("Receivable") ? "text-emerald-600" : "text-rose-600"}`}>{fmt(o.amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== 9. BANK REPORT ==================== */}
      {(activeSubTab === "reports_bank" || activeSubTab === "bank") && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                <Landmark className="w-4 h-4 text-blue-600" /> Bank & Passbook Transaction Statement
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Automated bank ledger summary, deposits & payments</p>
            </div>
            <button
              onClick={() =>
                handleExportExcel(
                  "Bank_Statement",
                  bankReportData.periodEntries,
                  ["Date", "Particulars", "Type", "Amount (INR)"],
                  ["date", "particulars", "type", "amount"]
                )
              }
              className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 flex items-center gap-1 text-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black block">Opening Bank Balance</span>
              <span className="text-base font-black text-slate-700 mt-1 block">{fmt(bankReportData.openingBalance)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black block">Cash Deposits</span>
              <span className="text-base font-black text-emerald-600 mt-1 block">{fmt(bankReportData.cashDeposits)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black block">Direct Bank Receipts</span>
              <span className="text-base font-black text-blue-600 mt-1 block">{fmt(bankReportData.bankReceipts)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black block">Bank Outflow Payments</span>
              <span className="text-base font-black text-rose-600 mt-1 block">{fmt(bankReportData.bankPayments)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black block">Closing Bank Balance</span>
              <span className="text-base font-black text-indigo-700 mt-1 block">{fmt(bankReportData.closingBalance)}</span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Particulars / Description</th>
                  <th className="p-3 text-center">Flow Type</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bankReportData.periodEntries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400 italic">No bank transactions found in selected date range</td>
                  </tr>
                ) : (
                  bankReportData.periodEntries.map((l, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono text-slate-500">{(l.date || "").slice(0, 10)}</td>
                      <td className="p-3 text-slate-900 font-bold">{l.particulars}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${l.type === "Debit" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                          {l.type === "Debit" ? "INFLOW (DEBIT)" : "OUTFLOW (CREDIT)"}
                        </span>
                      </td>
                      <td className={`p-3 text-right font-black font-mono ${l.type === "Debit" ? "text-emerald-600" : "text-rose-600"}`}>
                        {fmt(l.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== 10. PROFIT REPORT ==================== */}
      {(activeSubTab === "reports_profit" || activeSubTab === "profit") && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase text-slate-900">📊 Net Profit & Loss Statement</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Calculated from Sales, Cost of Goods Sold, Other Incomes & Operating Expenses</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-black block">Total Sales Revenue</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">{fmt(profitReport.totalSales)}</span>
            </div>
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200">
              <span className="text-[10px] text-emerald-600 uppercase font-black block">Gross Profit</span>
              <span className="text-xl font-black text-emerald-700 mt-1 block">{fmt(profitReport.grossProfit)}</span>
            </div>
            <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200">
              <span className="text-[10px] text-rose-600 uppercase font-black block">Operating Expenses</span>
              <span className="text-xl font-black text-rose-700 mt-1 block">{fmt(profitReport.expensesTotal)}</span>
            </div>
            <div className="bg-blue-600 text-white p-4 rounded-xl shadow-xs">
              <span className="text-[10px] text-blue-200 uppercase font-black block">Net Net Profit</span>
              <span className="text-2xl font-black text-white mt-1 block">{fmt(profitReport.netProfit)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { ReportsModule };
export default ReportsModule;
