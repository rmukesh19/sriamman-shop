import { dbInstance } from "../config/dbInstance.js";

export const getDashboardStats = async (req, res) => {
  try {
    const db = dbInstance.get();
    const todayStr = new Date().toISOString().split("T")[0];
    const todayBills = (db.bills || []).filter((b) => b.date.startsWith(todayStr) && b.status !== "Cancelled");
    
    const todayBillCollected = todayBills.reduce((sum, b) => {
      if (b.paidAmount !== undefined && b.paidAmount !== null) return sum + Number(b.paidAmount);
      if (b.paymentType === "Credit") return sum + 0;
      return sum + (b.grandTotal || b.total || 0);
    }, 0);

    const todayCustomerCollections = (db.accountsLedger || [])
      .filter((l) => (l.date || "").substring(0, 10) === todayStr && l.type === "Debit" && (l.accountGroup === "Cash" || l.accountGroup === "Bank") && (l.particulars || "").toLowerCase().includes("customer payment"))
      .reduce((sum, l) => sum + (l.amount || 0), 0);

    const todaySales = todayBillCollected + todayCustomerCollections;

    let todayCash = 0;
    let todayUpi = 0;
    let todayCredit = 0;

    todayBills.forEach((b) => {
      if (b.paymentType === "Split" && b.paymentSplit) {
        todayCash += Number(b.paymentSplit.cash) || 0;
        todayUpi += (Number(b.paymentSplit.upi) || 0) + (Number(b.paymentSplit.card) || 0) + (Number(b.paymentSplit.bank) || 0);
        todayCredit += Number(b.balance) || 0;
      } else if (b.paymentType === "Credit") {
        todayCredit += Number(b.balance || b.total) || 0;
      } else if (b.paymentType === "Cash") {
        const p = b.paidAmount !== undefined ? Number(b.paidAmount) : Number(b.total);
        todayCash += p;
        if (b.balance > 0) todayCredit += Number(b.balance);
      } else {
        const p = b.paidAmount !== undefined ? Number(b.paidAmount) : Number(b.total);
        todayUpi += p;
        if (b.balance > 0) todayCredit += Number(b.balance);
      }
    });

    // Real Cumulative Ledger Cash & Bank Balances
    const ledger = db.accountsLedger || [];
    const groups = db.accountsGroups || [];
    const customLedgers = db.accountsLedgers || [];

    const cashOpening = customLedgers
      .filter((cl) => {
        const g = groups.find((gp) => gp.id === cl.groupId);
        return g && (g.name.toLowerCase().includes("cash") || g.type === "Cash");
      })
      .reduce((sum, cl) => sum + (cl.balanceType === "Debit" ? (cl.openingBalance || 0) : -(cl.openingBalance || 0)), 0);

    const cashEntries = ledger.filter((l) => l.accountGroup === "Cash" || (l.particulars || "").toLowerCase().includes("cash"));
    const cashDebit = cashEntries.filter((e) => e.type === "Debit").reduce((s, e) => s + (e.amount || 0), 0);
    const cashCredit = cashEntries.filter((e) => e.type === "Credit").reduce((s, e) => s + (e.amount || 0), 0);
    const cashBalance = cashOpening + cashDebit - cashCredit;

    const bankOpening = customLedgers
      .filter((cl) => {
        const g = groups.find((gp) => gp.id === cl.groupId);
        return g && (g.name.toLowerCase().includes("bank") || g.type === "Bank");
      })
      .reduce((sum, cl) => sum + (cl.balanceType === "Debit" ? (cl.openingBalance || 0) : -(cl.openingBalance || 0)), 0);

    const bankEntries = ledger.filter((l) => l.accountGroup === "Bank" || (l.particulars || "").toLowerCase().includes("bank") || (l.particulars || "").toLowerCase().includes("upi") || (l.particulars || "").toLowerCase().includes("card"));
    const bankDebit = bankEntries.filter((e) => e.type === "Debit").reduce((s, e) => s + (e.amount || 0), 0);
    const bankCredit = bankEntries.filter((e) => e.type === "Credit").reduce((s, e) => s + (e.amount || 0), 0);
    const bankBalance = bankOpening + bankDebit - bankCredit;

    const todayPurchases = (db.purchases || []).filter((p) => p.date === todayStr);
    const todayPurchaseTotal = todayPurchases.reduce((sum, p) => sum + (p.grandTotal || p.total || 0), 0);
    const stockValue = (db.products || []).reduce((sum, p) => sum + (p.currentStock || 0) * (p.purchaseRate || p.sellingRate || 0), 0);
    const lowStockCount = (db.products || []).filter((p) => (p.currentStock || 0) <= (p.minimumStock || 0)).length;
    const outstandingCustomers = (db.customers || []).reduce((sum, c) => sum + (c.outstanding || 0), 0);
    const outstandingSuppliers = (db.suppliers || []).reduce((sum, s) => sum + (s.outstanding || 0), 0);

    const currentMonthPrefix = new Date().toISOString().slice(0, 7);
    const monthlyBills = (db.bills || []).filter((b) => b.date.startsWith(currentMonthPrefix) && b.status !== "Cancelled");
    const monthlySales = monthlyBills.reduce((sum, b) => sum + (b.grandTotal || b.total || 0), 0);
    const monthlyExpenses = (db.expenses || []).filter((e) => e.date.startsWith(currentMonthPrefix)).reduce((sum, e) => sum + (e.amount || 0), 0);
    
    let monthlyCOGS = 0;
    monthlyBills.forEach((b) => {
      (b.items || []).forEach((item) => {
        const prod = (db.products || []).find((p) => p.id === item.productId);
        const pRate = prod ? (prod.purchaseRate || 0) : 0;
        monthlyCOGS += (item.qty || 0) * pRate;
      });
    });
    const monthlyProfit = monthlySales - monthlyCOGS - monthlyExpenses;

    const dailySalesMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split("T")[0];
      dailySalesMap[dStr] = 0;
    }
    (db.bills || []).forEach((b) => {
      const datePart = (b.date || "").split(" ")[0];
      if (dailySalesMap[datePart] !== undefined && b.status !== "Cancelled") {
        dailySalesMap[datePart] += (b.grandTotal || b.total || 0);
      }
    });
    const dailySalesChart = Object.keys(dailySalesMap).map((k) => ({ date: k, amount: dailySalesMap[k] }));

    const productSalesMap = {};
    (db.bills || []).filter((b) => b.status !== "Cancelled").forEach((b) => {
      (b.items || []).forEach((item) => {
        if (!productSalesMap[item.productId]) {
          productSalesMap[item.productId] = { name: item.englishName, tamilName: item.tamilName, qty: 0, total: 0 };
        }
        productSalesMap[item.productId].qty += item.qty || 0;
        productSalesMap[item.productId].total += item.total || 0;
      });
    });
    const topProducts = Object.values(productSalesMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

    const customerSalesMap = {};
    (db.bills || []).filter((b) => b.status !== "Cancelled").forEach((b) => {
      const cust = (db.customers || []).find((c) => c.id === b.customerId);
      const custName = cust ? cust.name : b.customerName;
      if (!customerSalesMap[b.customerId]) {
        customerSalesMap[b.customerId] = { name: custName, outstanding: cust ? cust.outstanding : 0, totalBills: 0, totalAmount: 0 };
      }
      customerSalesMap[b.customerId].totalBills += 1;
      customerSalesMap[b.customerId].totalAmount += (b.grandTotal || b.total || 0);
    });
    const topCustomers = Object.values(customerSalesMap).sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 5);

    return res.json({
      counters: {
        todaySales,
        todayPurchaseTotal,
        todayBillsCount: todayBills.length,
        todayCash,
        todayUpi,
        todayCredit,
        cashBalance,
        bankBalance,
        outstandingCustomers,
        outstandingSuppliers,
        stockValue,
        lowStockCount,
        monthlySales,
        monthlyProfit,
        monthlyExpenses
      },
      charts: {
        dailySalesChart,
        topProducts,
        topCustomers
      },
      recentBills: (db.bills || []).slice(-5).reverse(),
      recentPurchases: (db.purchases || []).slice(-5).reverse(),
      notifications: [
        ...(db.products || []).filter((p) => (p.currentStock || 0) <= (p.minimumStock || 0)).map((p) => ({
          id: `notif-stock-${p.id}`,
          type: "Low Stock",
          message: `Low Stock: ${p.englishName} is at ${p.currentStock} Bags (Min: ${p.minimumStock})`,
          tamilMessage: `குறைந்த இருப்பு: ${p.tamilName} ${p.currentStock} மூட்டைகள் மட்டுமே உள்ளன`
        })),
        ...(db.customers || []).filter((c) => (c.outstanding || 0) > 10000).map((c) => ({
          id: `notif-cust-${c.id}`,
          type: "Pending Payment",
          message: `${c.name} has a pending outstanding of ₹${c.outstanding}`,
          tamilMessage: `${c.name} வாடிக்கையாளர் நிலுவைத்தொகை ₹${c.outstanding} உள்ளது`
        }))
      ]
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
