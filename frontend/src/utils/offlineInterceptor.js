import { 
  getOfflineData, 
  saveOfflineData, 
  deleteOfflineData, 
  queueMutation,
  getQueuedMutations,
  deleteQueuedMutation
} from "./offlineDb.js";
import { transliterateSentence } from "./tamilTransliterator.js";

const nativeFetch = window.fetch;

// Helper to check if network is available
export async function testOnlineStatus() {
  if (!navigator.onLine) return false;
  try {
    const res = await nativeFetch("/api/settings", { method: "HEAD", cache: "no-store" });
    return res.ok;
  } catch (err) {
    return false;
  }
}

// Generate random ID
const generateId = (prefix) => `${prefix}-off-${Math.random().toString(36).substr(2, 9)}`;

// Helper to construct a Mock Response
function mockResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

// Map endpoints to IndexedDB stores
function getStoreName(urlPath) {
  if (urlPath.includes("/api/products")) return "products";
  if (urlPath.includes("/api/customers")) return "customers";
  if (urlPath.includes("/api/suppliers")) return "suppliers";
  if (urlPath.includes("/api/categories")) return "categories";
  if (urlPath.includes("/api/brands")) return "brands";
  if (urlPath.includes("/api/units")) return "units";
  if (urlPath.includes("/api/godowns")) return "godowns";
  if (urlPath.includes("/api/gstmasters")) return "gstmasters";
  if (urlPath.includes("/api/bills")) return "bills";
  if (urlPath.includes("/api/purchases")) return "purchases";
  if (urlPath.includes("/api/inventory/adjustments")) return "adjustments";
  if (urlPath.includes("/api/expenses")) return "expenses";
  if (urlPath.includes("/api/accounts/groups")) return "accountsGroups";
  if (urlPath.includes("/api/accounts/ledgers")) return "accountsLedgers";
  if (urlPath.includes("/api/accounts/ledger")) return "ledger";
  if (urlPath.includes("/api/employees")) return "employees";
  if (urlPath.includes("/api/settings")) return "settings";
  if (urlPath.includes("/api/financial-years")) return "financialYears";
  return null;
}

// Local Database Mutation Processor (offline business logic replicates backend side-effects)
async function applyMutationLocally(method, url, body) {
  const urlObj = new URL(url, window.location.origin);
  const path = urlObj.pathname;
  
  if (path.includes("/activate")) {
    const fYears = await getOfflineData("financialYears");
    const segments = path.split("/");
    const fyId = segments[segments.length - 2];
    fYears.forEach((f) => {
      f.isActive = f.id === fyId;
    });
    await saveOfflineData("financialYears", fYears);
    return { success: true, financialYears: fYears };
  }

  const store = getStoreName(path);
  
  if (!store) return { success: true };

  // Parse ID if present (e.g., /api/products/prod-123)
  const segments = path.split("/");
  const lastSegment = segments[segments.length - 1];
  const isIdInUrl = lastSegment && lastSegment !== "products" && lastSegment !== "customers" && 
                    lastSegment !== "suppliers" && lastSegment !== "categories" && lastSegment !== "brands" && 
                    lastSegment !== "units" && lastSegment !== "godowns" && lastSegment !== "gstmasters" && 
                    lastSegment !== "bills" && lastSegment !== "purchases" && lastSegment !== "adjustments" && 
                    lastSegment !== "expenses" && lastSegment !== "ledger" && lastSegment !== "employees" &&
                    lastSegment !== "settings" && lastSegment !== "cancel" && lastSegment !== "financial-years" &&
                    lastSegment !== "groups" && lastSegment !== "ledgers";

  if (method === "DELETE") {
    if (isIdInUrl) {
      // Reverse custom side effects on delete if necessary
      if (store === "purchases") {
        const purchase = (await getOfflineData("purchases")).find(p => p.id === lastSegment);
        if (purchase) {
          // Revert stock
          const prods = await getOfflineData("products");
          purchase.items.forEach(item => {
            const prod = prods.find(p => p.id === item.productId);
            if (prod) prod.currentStock = (prod.currentStock || 0) - item.qty;
          });
          await saveOfflineData("products", prods);
          // Revert supplier outstanding
          const supps = await getOfflineData("suppliers");
          const supp = supps.find(s => s.id === purchase.supplierId);
          if (supp) supp.outstanding = Math.max(0, (supp.outstanding || 0) - (purchase.balance || 0));
          await saveOfflineData("suppliers", supps);
        }
      }
      await deleteOfflineData(store, lastSegment);
      return { success: true };
    }
  }

  if (method === "POST" || method === "PUT") {
    const id = isIdInUrl ? lastSegment : (body.id || generateId(store.substring(0, 4)));
    const records = await getOfflineData(store);
    
    let updatedRecord = { ...body, id };
    
    // Process complex business side effects of creating or editing transactions
    if (store === "bills" && method === "POST") {
      // Generate offline invoice number
      const count = records.length + 1;
      const year = new Date().getFullYear();
      updatedRecord.invoiceNo = body.invoiceNo || `SAT-${year}-${String(count).padStart(3, "0")}`;
      updatedRecord.date = body.date || new Date().toISOString().replace("T", " ").substring(0, 19);
      updatedRecord.createdAt = body.createdAt || new Date().toISOString();
      updatedRecord.status = "Active";

      // 1. Update local stock
      const products = await getOfflineData("products");
      updatedRecord.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        if (prod) {
          prod.currentStock = (prod.currentStock || 0) - item.qty;
        }
      });
      await saveOfflineData("products", products);

      // 2. Update customer outstanding
      if (updatedRecord.paymentType === "Credit") {
        const customers = await getOfflineData("customers");
        const cust = customers.find(c => c.id === updatedRecord.customerId);
        if (cust) {
          cust.outstanding = (cust.outstanding || 0) + (updatedRecord.balance || 0);
        }
        await saveOfflineData("customers", customers);
      }

      // 3. Add to local accounts ledger
      const ledger = await getOfflineData("ledger");
      ledger.push({
        id: generateId("ldgr"),
        date: updatedRecord.date.split(" ")[0],
        particulars: `Sales Invoice ${updatedRecord.invoiceNo}`,
        referenceId: updatedRecord.id,
        type: "Credit",
        amount: updatedRecord.total,
        accountGroup: "Sales"
      });
      if (updatedRecord.paidAmount > 0) {
        ledger.push({
          id: generateId("ldgr"),
          date: updatedRecord.date.split(" ")[0],
          particulars: `Payment Received for Sales Invoice ${updatedRecord.invoiceNo}`,
          referenceId: updatedRecord.id,
          type: "Debit",
          amount: updatedRecord.paidAmount,
          accountGroup: updatedRecord.paymentType === "UPI" ? "Bank" : "Cash"
        });
      }
      if (updatedRecord.balance > 0) {
        ledger.push({
          id: generateId("ldgr"),
          date: updatedRecord.date.split(" ")[0],
          particulars: `Credit Outstanding for Sales Invoice ${updatedRecord.invoiceNo}`,
          referenceId: updatedRecord.id,
          type: "Debit",
          amount: updatedRecord.balance,
          accountGroup: "Customer Outstanding",
          customerId: updatedRecord.customerId
        });
      }
      await saveOfflineData("ledger", ledger);
    }
    
    else if (store === "bills" && path.endsWith("/cancel") && method === "PUT") {
      const billIndex = records.findIndex(b => b.id === lastSegment);
      if (billIndex !== -1) {
        const bill = records[billIndex];
        bill.status = "Cancelled";
        updatedRecord = bill;

        // Revert stock
        const products = await getOfflineData("products");
        bill.items.forEach(item => {
          const prod = products.find(p => p.id === item.productId);
          if (prod) {
            prod.currentStock = (prod.currentStock || 0) + item.qty;
          }
        });
        await saveOfflineData("products", products);

        // Revert outstanding
        if (bill.paymentType === "Credit") {
          const customers = await getOfflineData("customers");
          const cust = customers.find(c => c.id === bill.customerId);
          if (cust) {
            cust.outstanding = Math.max(0, (cust.outstanding || 0) - (bill.balance || 0));
          }
          await saveOfflineData("customers", customers);
        }
      }
    }

    else if (store === "purchases" && method === "POST") {
      const count = records.length + 1;
      updatedRecord.purchaseNo = body.purchaseNo || `PUR-2026-${String(count).padStart(3, "0")}`;
      updatedRecord.date = body.date || new Date().toISOString().split("T")[0];
      updatedRecord.createdAt = body.createdAt || new Date().toISOString();

      // Update product stock
      const products = await getOfflineData("products");
      updatedRecord.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        if (prod) {
          prod.currentStock = (prod.currentStock || 0) + item.qty;
        }
      });
      await saveOfflineData("products", products);

      // Update supplier outstanding
      const suppliers = await getOfflineData("suppliers");
      const supp = suppliers.find(s => s.id === updatedRecord.supplierId);
      if (supp) {
        supp.outstanding = (supp.outstanding || 0) + (updatedRecord.balance || 0);
      }
      await saveOfflineData("suppliers", suppliers);

      // Add to local ledger
      const ledger = await getOfflineData("ledger");
      ledger.push({
        id: generateId("ldgr"),
        date: updatedRecord.date,
        particulars: `Purchase Invoice ${updatedRecord.purchaseNo}`,
        referenceId: updatedRecord.id,
        type: "Debit",
        amount: updatedRecord.total,
        accountGroup: "Purchase"
      });
      if (updatedRecord.paidAmount > 0) {
        ledger.push({
          id: generateId("ldgr"),
          date: updatedRecord.date,
          particulars: `Payment for Purchase Invoice ${updatedRecord.purchaseNo}`,
          referenceId: updatedRecord.id,
          type: "Credit",
          amount: updatedRecord.paidAmount,
          accountGroup: updatedRecord.paymentType === "Cash" ? "Cash" : "Bank"
        });
      }
      if (updatedRecord.balance > 0) {
        ledger.push({
          id: generateId("ldgr"),
          date: updatedRecord.date,
          particulars: `Supplier Outstanding for Purchase Invoice ${updatedRecord.purchaseNo}`,
          referenceId: updatedRecord.id,
          type: "Credit",
          amount: updatedRecord.balance,
          accountGroup: "Supplier Outstanding",
          supplierId: updatedRecord.supplierId
        });
      }
      await saveOfflineData("ledger", ledger);
    }

    else if (store === "inventory/adjustments" || store === "adjustments") {
      updatedRecord.date = body.date || new Date().toISOString().replace("T", " ").substring(0, 19);
      // Update stock
      const products = await getOfflineData("products");
      const prod = products.find(p => p.id === body.productId);
      if (prod) {
        prod.currentStock = (prod.currentStock || 0) + body.qty;
        updatedRecord.productName = prod.englishName;
      }
      await saveOfflineData("products", products);
    }

    else if (store === "expenses" && method === "POST") {
      updatedRecord.date = body.date || new Date().toISOString().split("T")[0];
      
      // Add to local accounts ledger
      const ledger = await getOfflineData("ledger");
      ledger.push({
        id: generateId("ldgr"),
        date: updatedRecord.date,
        particulars: `Expense: ${updatedRecord.category} - ${updatedRecord.note}`,
        referenceId: updatedRecord.id,
        type: "Debit",
        amount: updatedRecord.amount,
        accountGroup: "Expense"
      });
      await saveOfflineData("ledger", ledger);
    }

    else if (store === "ledger" && method === "POST") {
      updatedRecord.date = body.date || new Date().toISOString().split("T")[0];
      updatedRecord.amount = Number(body.amount) || 0;

      // 1. Process customer outstanding updates
      if (updatedRecord.accountGroup === "Customer Outstanding" && updatedRecord.customerId) {
        const customers = await getOfflineData("customers");
        const custIndex = customers.findIndex(c => c.id === updatedRecord.customerId);
        if (custIndex !== -1) {
          if (updatedRecord.type === "Credit") {
            customers[custIndex].outstanding = (customers[custIndex].outstanding || 0) - updatedRecord.amount;
          } else {
            customers[custIndex].outstanding = (customers[custIndex].outstanding || 0) + updatedRecord.amount;
          }
          await saveOfflineData("customers", customers);
        }
      }
      // 2. Process supplier outstanding updates
      else if (updatedRecord.accountGroup === "Supplier Outstanding" && updatedRecord.supplierId) {
        const suppliers = await getOfflineData("suppliers");
        const suppIndex = suppliers.findIndex(s => s.id === updatedRecord.supplierId);
        if (suppIndex !== -1) {
          if (updatedRecord.type === "Debit") {
            suppliers[suppIndex].outstanding = (suppliers[suppIndex].outstanding || 0) - updatedRecord.amount;
          } else {
            suppliers[suppIndex].outstanding = (suppliers[suppIndex].outstanding || 0) + updatedRecord.amount;
          }
          await saveOfflineData("suppliers", suppliers);
        }
      }

      // 3. Automatically generate matching double-entry contra posting for manual vouchers to balance Trial Balance
      if (updatedRecord.voucherType) {
        const vchType = updatedRecord.voucherType;
        let matchingGroup = "Cash";
        let matchingType = "Debit";
        
        if (vchType === "Receipt") {
          matchingGroup = updatedRecord.particulars?.toLowerCase().includes("bank") || updatedRecord.particulars?.toLowerCase().includes("sbi") || updatedRecord.particulars?.toLowerCase().includes("upi") ? "Bank" : "Cash";
          matchingType = "Debit";
        } else if (vchType === "Payment") {
          matchingGroup = updatedRecord.particulars?.toLowerCase().includes("cash") ? "Cash" : "Bank";
          matchingType = "Credit";
        } else if (vchType === "Expense") {
          matchingGroup = updatedRecord.particulars?.toLowerCase().includes("bank") || updatedRecord.particulars?.toLowerCase().includes("sbi") || updatedRecord.particulars?.toLowerCase().includes("upi") ? "Bank" : "Cash";
          matchingType = "Credit";
        } else if (vchType === "Income") {
          matchingGroup = updatedRecord.particulars?.toLowerCase().includes("bank") || updatedRecord.particulars?.toLowerCase().includes("sbi") || updatedRecord.particulars?.toLowerCase().includes("upi") ? "Bank" : "Cash";
          matchingType = "Debit";
        } else if (vchType === "Contra") {
          if (updatedRecord.accountGroup === "Cash" && updatedRecord.type === "Debit") {
            matchingGroup = "Bank";
            matchingType = "Credit";
          } else if (updatedRecord.accountGroup === "Cash" && updatedRecord.type === "Credit") {
            matchingGroup = "Bank";
            matchingType = "Debit";
          } else if (updatedRecord.accountGroup === "Bank" && updatedRecord.type === "Debit") {
            matchingGroup = "Cash";
            matchingType = "Credit";
          } else if (updatedRecord.accountGroup === "Bank" && updatedRecord.type === "Credit") {
            matchingGroup = "Cash";
            matchingType = "Debit";
          }
        }
        
        records.push({
          id: generateId("ldgr"),
          date: updatedRecord.date,
          particulars: `[Contra Balanced] ${updatedRecord.particulars}`,
          referenceId: id,
          type: matchingType,
          amount: updatedRecord.amount,
          accountGroup: matchingGroup,
          customerId: updatedRecord.customerId || "",
          supplierId: updatedRecord.supplierId || "",
          isBalancedEntry: true
        });
      }
    }

    else if (store === "products" && method === "POST") {
      updatedRecord.currentStock = Number(body.openingStock) || 0;
      if (updatedRecord.currentStock > 0) {
        const adjustments = await getOfflineData("adjustments");
        adjustments.push({
          id: generateId("sa"),
          productId: id,
          productName: updatedRecord.englishName,
          qty: updatedRecord.currentStock,
          type: "Opening Stock",
          reason: "Initial Product Import",
          date: new Date().toISOString().replace("T", " ").substring(0, 19)
        });
        await saveOfflineData("adjustments", adjustments);
      }
    }

    // Save record locally in IndexedDB
    const existingIndex = records.findIndex(r => r.id === id);
    if (existingIndex !== -1) {
      records[existingIndex] = { ...records[existingIndex], ...updatedRecord };
    } else {
      records.push(updatedRecord);
    }
    
    if (store === "settings") {
      await saveOfflineData("settings", updatedRecord);
    } else {
      await saveOfflineData(store, records);
    }

    // Return exact API formats
    const resultKey = store.endsWith("s") ? store.slice(0, -1) : store;
    const responseData = { success: true };
    responseData[resultKey] = updatedRecord;
    
    // Exceptions for specific keys
    if (store === "gstmasters") responseData.gstMaster = updatedRecord;
    if (store === "adjustments") responseData.adjustment = updatedRecord;
    
    return responseData;
  }
}

// Compute Dashboard Stats dynamically offline from local tables
async function computeOfflineDashboardStats() {
  const bills = await getOfflineData("bills") || [];
  const purchases = await getOfflineData("purchases") || [];
  const expenses = await getOfflineData("expenses") || [];
  const products = await getOfflineData("products") || [];
  const customers = await getOfflineData("customers") || [];
  const suppliers = await getOfflineData("suppliers") || [];
  const ledger = await getOfflineData("ledger") || [];

  const todayStr = new Date().toISOString().split("T")[0];
  const todayBills = bills.filter(b => b.date.startsWith(todayStr) && b.status !== "Cancelled");
  
  const todayBillCollected = todayBills.reduce((sum, b) => {
    if (b.paidAmount !== undefined && b.paidAmount !== null) return sum + Number(b.paidAmount);
    if (b.paymentType === "Credit") return sum + 0;
    return sum + (b.grandTotal || b.total || 0);
  }, 0);

  const todayCustomerCollections = ledger
    .filter((l) => (l.date || "").substring(0, 10) === todayStr && l.type === "Debit" && (l.accountGroup === "Cash" || l.accountGroup === "Bank") && (l.particulars || "").toLowerCase().includes("customer payment"))
    .reduce((sum, l) => sum + (l.amount || 0), 0);

  const todaySales = todayBillCollected + todayCustomerCollections;
  const todayCash = todayBills.filter(b => b.paymentType === "Cash").reduce((sum, b) => sum + (b.paidAmount !== undefined ? b.paidAmount : b.total), 0);
  const todayUpi = todayBills.filter(b => b.paymentType === "UPI" || b.paymentType === "Bank").reduce((sum, b) => sum + (b.paidAmount !== undefined ? b.paidAmount : b.total), 0);
  const todayCredit = todayBills.filter(b => b.paymentType === "Credit").reduce((sum, b) => sum + (b.balance !== undefined ? b.balance : b.total), 0);
  const todayPurchases = purchases.filter(p => p.date === todayStr);
  const todayPurchaseTotal = todayPurchases.reduce((sum, p) => sum + p.total, 0);

  const stockValue = products.reduce((sum, p) => sum + (p.currentStock || 0) * (p.purchaseRate || 0), 0);
  const lowStockCount = products.filter(p => (p.currentStock || 0) <= (p.minimumStock || 0)).length;
  
  const outstandingCustomers = customers.reduce((sum, c) => sum + (c.outstanding || 0), 0);
  const outstandingSuppliers = suppliers.reduce((sum, s) => sum + (s.outstanding || 0), 0);

  // Dynamic current month prefix
  const currentMonthPrefix = new Date().toISOString().slice(0, 7);
  const monthlyBills = bills.filter(b => b.date.startsWith(currentMonthPrefix) && b.status !== "Cancelled");
  const monthlySales = monthlyBills.reduce((sum, b) => sum + (b.grandTotal || b.total || 0), 0);
  const monthlyExpenses = expenses.filter(e => e.date.startsWith(currentMonthPrefix)).reduce((sum, e) => sum + e.amount, 0);

  let monthlyCOGS = 0;
  monthlyBills.forEach(b => {
    b.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      const pRate = prod ? prod.purchaseRate : 0;
      monthlyCOGS += item.qty * pRate;
    });
  });
  const monthlyProfit = monthlySales - monthlyCOGS - monthlyExpenses;

  // Daily sales chart
  const dailySalesMap = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split("T")[0];
    dailySalesMap[dStr] = 0;
  }
  bills.forEach(b => {
    const datePart = b.date.split(" ")[0];
    if (dailySalesMap[datePart] !== undefined && b.status === "Active") {
      dailySalesMap[datePart] += b.total;
    }
  });
  const dailySalesChart = Object.keys(dailySalesMap).map(k => ({ date: k, amount: dailySalesMap[k] }));

  // Top products
  const productSalesMap = {};
  bills.filter(b => b.status === "Active").forEach(b => {
    b.items.forEach(item => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = { name: item.englishName, tamilName: item.tamilName, qty: 0, total: 0 };
      }
      productSalesMap[item.productId].qty += item.qty;
      productSalesMap[item.productId].total += item.total;
    });
  });
  const topProducts = Object.values(productSalesMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

  // Recent lists
  const recentBills = [...bills].reverse().slice(0, 5);
  const recentPurchases = [...purchases].reverse().slice(0, 5);

  return {
    counters: {
      todaySales,
      todayPurchaseTotal,
      todayBillsCount: todayBills.length,
      cashBalance: todayCash,
      upiCollection: todayUpi,
      creditCollection: todayCredit,
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
      topCustomers: []
    },
    recentBills,
    recentPurchases,
    notifications: products.filter(p => p.currentStock <= p.minimumStock).map(p => ({
      id: `notif-stock-${p.id}`,
      type: "Low Stock",
      message: `Low Stock: ${p.englishName} is at ${p.currentStock} Bags (Min: ${p.minimumStock})`,
      tamilMessage: `குறைந்த இருப்பு: ${p.tamilName} ${p.currentStock} மூட்டைகள் மட்டுமே உள்ளன (குறைந்தது: ${p.minimumStock})`
    }))
  };
}

// Compute Trial Balance dynamically offline from ledger & masters
async function computeOfflineTrialBalance() {
  const ledger = await getOfflineData("ledger") || [];
  const customers = await getOfflineData("customers") || [];
  const suppliers = await getOfflineData("suppliers") || [];
  const customLedgers = await getOfflineData("accountsLedgers") || [];
  const groups = await getOfflineData("accountsGroups") || [];

  const trialBalance = {
    "Capital": { debit: 0, credit: 0 },
    "Sales": { debit: 0, credit: 0 },
    "Purchase": { debit: 0, credit: 0 },
    "Cash": { debit: 0, credit: 0 },
    "Bank": { debit: 0, credit: 0 },
    "Customer Outstanding": { debit: 0, credit: 0 },
    "Supplier Outstanding": { debit: 0, credit: 0 },
    "Expense": { debit: 0, credit: 0 }
  };

  // Include custom ledger opening balances dynamically
  customLedgers.forEach((cl) => {
    const g = groups.find((gp) => gp.id === cl.groupId);
    let head = "Capital";
    if (g) {
      if (g.type === "Asset" && g.name.toLowerCase().includes("cash")) head = "Cash";
      else if (g.type === "Asset" && g.name.toLowerCase().includes("bank")) head = "Bank";
      else if (g.type === "Asset" && g.name.toLowerCase().includes("debtor")) head = "Customer Outstanding";
      else if (g.type === "Liability" && g.name.toLowerCase().includes("creditor")) head = "Supplier Outstanding";
      else if (g.type === "Expense") head = "Expense";
      else if (g.type === "Income") head = "Sales";
      else if (g.type === "Capital") head = "Capital";
      else {
        if (g.type === "Asset") head = "Cash";
        else if (g.type === "Liability") head = "Capital";
        else if (g.type === "Expense") head = "Expense";
        else if (g.type === "Income") head = "Sales";
      }
    }
    if (cl.balanceType === "Debit") {
      trialBalance[head].debit += cl.openingBalance;
    } else {
      trialBalance[head].credit += cl.openingBalance;
    }
  });

  ledger.forEach(l => {
    if (!trialBalance[l.accountGroup]) {
      trialBalance[l.accountGroup] = { debit: 0, credit: 0 };
    }
    if (l.type === "Debit") {
      trialBalance[l.accountGroup].debit += l.amount;
    } else {
      trialBalance[l.accountGroup].credit += l.amount;
    }
  });

  trialBalance["Customer Outstanding"].debit = customers.reduce((sum, c) => sum + (c.outstanding || 0), 0);
  trialBalance["Supplier Outstanding"].credit = suppliers.reduce((sum, s) => sum + (s.outstanding || 0), 0);

  return trialBalance;
}

// Override Global window.fetch safely (handles iframe and read-only window.fetch constraints)
const customFetch = async function(resource, init) {
  const url = typeof resource === "string" ? resource : resource.url;
  
  // Only intercept /api/ requests (exclude static assets, logo images, auth login, etc.)
  if (!url.startsWith("/api/") || url.includes("/api/auth/login")) {
    return nativeFetch.apply(this, arguments);
  }

  const method = init?.method ? init.method.toUpperCase() : "GET";
  const isOnline = await testOnlineStatus();

  // ----------------- ONLINE HANDLER -----------------
  if (isOnline) {
    try {
      const response = await nativeFetch.apply(this, arguments);
      if (response.ok) {
        // Clone response to avoid locking stream
        const responseClone = response.clone();
        
        // Dynamic caching on success GET requests
        if (method === "GET") {
          const path = new URL(url, window.location.origin).pathname;
          const store = getStoreName(path);
          if (store) {
            const data = await responseClone.json();
            await saveOfflineData(store, data);
          }
        }
        return response;
      }
    } catch (networkErr) {
      console.warn(`Network request failed for ${url}. Switching to IndexedDB fallback...`, networkErr);
    }
  }

  // ----------------- OFFLINE HANDLER -----------------
  const urlObj = new URL(url, window.location.origin);
  const path = urlObj.pathname;

  if (path === "/api/settings/initialize" && method === "POST") {
    let bodyObj = {};
    if (init?.body) {
      try {
        bodyObj = JSON.parse(init.body);
      } catch (e) {
        bodyObj = {};
      }
    }
    const { companySettings, adminUser } = bodyObj;
    const stores = [
      "products", "customers", "suppliers", "categories", "brands", "units",
      "godowns", "gstmasters", "bills", "purchases", "adjustments", "expenses",
      "ledger", "employees", "accountsGroups", "accountsLedgers"
    ];
    for (const st of stores) {
      await saveOfflineData(st, []);
    }
    const initSet = { ...companySettings, isInitialized: true };
    await saveOfflineData("settings", [initSet]);
    return mockResponse({ success: true, settings: initSet });
  }

  // GET Handlers
  if (method === "GET") {
    if (path === "/api/transliterate") {
      const text = urlObj.searchParams.get("text") || "";
      const result = transliterateSentence(text);
      return mockResponse({ success: true, result });
    }

    // Specialized next-number generator
    if (path === "/api/bills/next-number") {
      const bills = await getOfflineData("bills");
      const count = bills.length + 1;
      const year = new Date().getFullYear();
      const nextInvoiceNo = `SAT-${year}-${String(count).padStart(3, "0")}`;
      return mockResponse({ nextInvoiceNo });
    }

    // Dynamic Stats Calculator
    if (path === "/api/dashboard/stats") {
      const stats = await computeOfflineDashboardStats();
      return mockResponse(stats);
    }

    // Dynamic Trial Balance Calculator
    if (path === "/api/accounts/trial-balance") {
      const trial = await computeOfflineTrialBalance();
      return mockResponse(trial);
    }

    // Standard list getter
    const store = getStoreName(path);
    if (store) {
      const cachedData = await getOfflineData(store);
      
      // Default configurations or items if database is totally empty
      if (store === "settings" && cachedData.length === 0) {
        const defaultSettings = {
          companyName: "SRI AMMAN TRADERS",
          gstin: "33AAHFS3829M1Z8",
          address: "105, bypass Road, Erode, Tamil Nadu - 638001",
          phone: "9876543210 / 0424-222333",
          email: "sriammanriceerode@gmail.com",
          thermalPrinterWidth: "80mm",
          invoicePrefix: "SAT-2026-",
          language: "English"
        };
        return mockResponse(defaultSettings);
      }
      
      if (store === "financialYears" && cachedData.length === 0) {
        const defaultFys = [
          {
            id: "fy-2026-27",
            name: "FY 2026-27",
            startDate: "2026-04-01",
            endDate: "2027-03-31",
            isActive: true
          }
        ];
        await saveOfflineData("financialYears", defaultFys);
        return mockResponse(defaultFys);
      }
      
      if (store === "settings" && cachedData.length > 0) {
        return mockResponse(cachedData[0]);
      }

      return mockResponse(cachedData);
    }

    return mockResponse([]);
  }

  // MUTATION Handlers (POST / PUT / DELETE)
  let requestBody = {};
  if (init?.body) {
    try {
      requestBody = JSON.parse(init.body);
    } catch (e) {
      requestBody = {};
    }
  }

  // 1. Queue mutation for future background sync
  const queuedMutation = {
    url,
    method,
    body: requestBody,
  };
  await queueMutation(queuedMutation);

  // 2. Apply mutation locally inside IndexedDB cache immediately so GET sees consistent states
  const mockResult = await applyMutationLocally(method, url, requestBody);

  // 3. Return mock successful response
  return mockResponse(mockResult);
};

try {
  Object.defineProperty(window, "fetch", {
    value: customFetch,
    writable: true,
    configurable: true,
    enumerable: true
  });
} catch (e) {
  console.warn("Standard Object.defineProperty failed, trying window.fetch override fallback.", e);
  window.fetch = customFetch;
}

// Replay queued mutations to the server in chronological order
export async function syncOfflineMutations() {
  const mutations = await getQueuedMutations();
  if (mutations.length === 0) return true;

  console.log(`Replaying ${mutations.length} offline mutations...`);
  
  for (const mut of mutations) {
    try {
      const res = await nativeFetch(mut.url, {
        method: mut.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mut.body)
      });
      if (res.ok) {
        await deleteQueuedMutation(mut.id);
      } else {
        console.warn(`Failed to replay mutation ${mut.id}. Status: ${res.status}. Stopping sync.`);
        return false;
      }
    } catch (err) {
      console.error(`Network error replaying mutation ${mut.id}:`, err);
      return false; // Pause replaying if offline again
    }
  }
  
  console.log("All offline mutations replayed successfully!");
  return true;
}

