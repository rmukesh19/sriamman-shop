import { dbInstance } from "../config/dbInstance.js";

const generateId = (prefix) => `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

export const getPurchases = async (req, res) => {
  const db = dbInstance.get();
  res.json(db.purchases || []);
};

export const createPurchase = async (req, res) => {
  const db = dbInstance.get();
  const purchaseNo = dbInstance.nextPurchaseNo();
  const newPurchase = {
    ...req.body,
    id: generateId("pur"),
    purchaseNo,
    date: new Date().toISOString().split("T")[0],
    createdAt: new Date().toISOString()
  };

  newPurchase.items.forEach((item) => {
    const prodIndex = db.products.findIndex((p) => p.id === item.productId);
    if (prodIndex !== -1) {
      db.products[prodIndex].currentStock += item.qty;
    }
  });

  const suppIndex = db.suppliers.findIndex((s) => s.id === newPurchase.supplierId);
  if (suppIndex !== -1) {
    db.suppliers[suppIndex].outstanding += newPurchase.balance;
  }
  db.purchases.push(newPurchase);

  db.accountsLedger.push({
    id: generateId("ldgr"),
    date: newPurchase.date,
    particulars: `Purchase Invoice ${newPurchase.purchaseNo}`,
    referenceId: newPurchase.id,
    type: "Debit",
    amount: newPurchase.total,
    accountGroup: "Purchase"
  });

  if (newPurchase.paidAmount > 0) {
    db.accountsLedger.push({
      id: generateId("ldgr"),
      date: newPurchase.date,
      particulars: `Payment for Purchase Invoice ${newPurchase.purchaseNo}`,
      referenceId: newPurchase.id,
      type: "Credit",
      amount: newPurchase.paidAmount,
      accountGroup: newPurchase.paymentType === "Cash" ? "Cash" : "Bank"
    });

    db.expenses.push({
      id: generateId("exp"),
      date: newPurchase.date,
      category: "Supplier Purchase / Advance",
      paymentType: newPurchase.paymentType || "Bank",
      amount: newPurchase.paidAmount,
      note: `Purchase ${newPurchase.purchaseNo} Advance/Payment to ${newPurchase.supplierName || 'Supplier'}`,
      referenceId: newPurchase.id,
      supplierId: newPurchase.supplierId
    });
  }

  if (newPurchase.balance > 0) {
    db.accountsLedger.push({
      id: generateId("ldgr"),
      date: newPurchase.date,
      particulars: `Supplier Outstanding for Purchase Invoice ${newPurchase.purchaseNo}`,
      referenceId: newPurchase.id,
      type: "Credit",
      amount: newPurchase.balance,
      accountGroup: "Supplier Outstanding",
      supplierId: newPurchase.supplierId
    });
  }

  dbInstance.save(db);
  res.json({ success: true, purchase: newPurchase });
};

export const updatePurchase = async (req, res) => {
  const db = dbInstance.get();
  const index = db.purchases.findIndex((p) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Purchase not found" });
  const oldPurchase = db.purchases[index];

  oldPurchase.items.forEach((item) => {
    const prodIndex = db.products.findIndex((p) => p.id === item.productId);
    if (prodIndex !== -1) {
      db.products[prodIndex].currentStock -= item.qty;
    }
  });

  const oldSuppIndex = db.suppliers.findIndex((s) => s.id === oldPurchase.supplierId);
  if (oldSuppIndex !== -1) {
    db.suppliers[oldSuppIndex].outstanding -= oldPurchase.balance;
  }

  const updatedPurchase = { ...oldPurchase, ...req.body };
  updatedPurchase.items.forEach((item) => {
    const prodIndex = db.products.findIndex((p) => p.id === item.productId);
    if (prodIndex !== -1) {
      db.products[prodIndex].currentStock += item.qty;
    }
  });

  const newSuppIndex = db.suppliers.findIndex((s) => s.id === updatedPurchase.supplierId);
  if (newSuppIndex !== -1) {
    db.suppliers[newSuppIndex].outstanding += updatedPurchase.balance;
  }

  db.purchases[index] = updatedPurchase;
  db.accountsLedger = db.accountsLedger.filter((l) => l.referenceId !== req.params.id);

  db.accountsLedger.push({
    id: generateId("ldgr"),
    date: updatedPurchase.date,
    particulars: `Purchase Invoice ${updatedPurchase.purchaseNo}`,
    referenceId: updatedPurchase.id,
    type: "Debit",
    amount: updatedPurchase.total,
    accountGroup: "Purchase"
  });

  if (updatedPurchase.paidAmount > 0) {
    db.accountsLedger.push({
      id: generateId("ldgr"),
      date: updatedPurchase.date,
      particulars: `Payment for Purchase Invoice ${updatedPurchase.purchaseNo}`,
      referenceId: updatedPurchase.id,
      type: "Credit",
      amount: updatedPurchase.paidAmount,
      accountGroup: updatedPurchase.paymentType === "Cash" ? "Cash" : "Bank"
    });
  }

  if (updatedPurchase.balance > 0) {
    db.accountsLedger.push({
      id: generateId("ldgr"),
      date: updatedPurchase.date,
      particulars: `Supplier Outstanding for Purchase Invoice ${updatedPurchase.purchaseNo}`,
      referenceId: updatedPurchase.id,
      type: "Credit",
      amount: updatedPurchase.balance,
      accountGroup: "Supplier Outstanding",
      supplierId: updatedPurchase.supplierId
    });
  }

  dbInstance.save(db);
  res.json({ success: true, purchase: updatedPurchase });
};

export const deletePurchase = async (req, res) => {
  const db = dbInstance.get();
  const index = db.purchases.findIndex((p) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Purchase not found" });
  const purchase = db.purchases[index];

  purchase.items.forEach((item) => {
    const prodIndex = db.products.findIndex((p) => p.id === item.productId);
    if (prodIndex !== -1) {
      db.products[prodIndex].currentStock -= item.qty;
    }
  });

  const suppIndex = db.suppliers.findIndex((s) => s.id === purchase.supplierId);
  if (suppIndex !== -1) {
    db.suppliers[suppIndex].outstanding -= purchase.balance;
  }

  db.purchases = db.purchases.filter((p) => p.id !== req.params.id);
  db.accountsLedger = db.accountsLedger.filter((l) => l.referenceId !== req.params.id);

  dbInstance.save(db);
  res.json({ success: true });
};
