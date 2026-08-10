import { dbInstance } from "../config/dbInstance.js";

const generateId = (prefix) => `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

function isRecordReferenced(type, id, db) {
  if (type === "suppliers") {
    const inPurchases = (db.purchases || []).some(p => p.supplierId === id);
    if (inPurchases) return true;
    const inLedger = (db.accountsLedger || []).some(l => l.supplierId === id);
    if (inLedger) return true;
  }
  return false;
}

export const getSuppliers = async (req, res) => {
  const db = dbInstance.get();
  res.json(db.suppliers || []);
};

export const createSupplier = async (req, res) => {
  const db = dbInstance.get();
  const newSupplier = {
    ...req.body,
    id: generateId("supp"),
    outstanding: Number(req.body.outstanding) || 0
  };
  db.suppliers.push(newSupplier);
  dbInstance.save(db);
  res.json({ success: true, supplier: newSupplier });
};

export const updateSupplier = async (req, res) => {
  const db = dbInstance.get();
  const index = db.suppliers.findIndex((s) => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Supplier not found" });
  db.suppliers[index] = { ...db.suppliers[index], ...req.body };
  dbInstance.save(db);
  res.json({ success: true, supplier: db.suppliers[index] });
};

export const deleteSupplier = async (req, res) => {
  const db = dbInstance.get();
  const id = req.params.id;
  if (isRecordReferenced("suppliers", id, db)) {
    return res.status(400).json({ success: false, message: "This record cannot be deleted because it is already used in transactions." });
  }
  const idx = db.suppliers.findIndex((s) => s.id === id);
  if (idx !== -1) {
    db.suppliers[idx].status = "Inactive";
    dbInstance.save(db);
  }
  res.json({ success: true });
};

export const recordSupplierPayment = async (req, res) => {
  const db = dbInstance.get();
  const suppId = req.params.id;
  const { amount, paymentMode, date, narration } = req.body;
  const numAmount = Number(amount) || 0;

  if (numAmount <= 0) {
    return res.status(400).json({ message: "Invalid payment amount" });
  }

  const suppIndex = db.suppliers.findIndex((s) => s.id === suppId);
  if (suppIndex === -1) {
    return res.status(404).json({ message: "Supplier not found" });
  }

  const supp = db.suppliers[suppIndex];
  supp.outstanding = Math.max(0, (supp.outstanding || 0) - numAmount);

  const payDate = date || new Date().toISOString().split("T")[0];
  const mode = paymentMode || "Bank";
  const refId = `spay-${Date.now()}`;

  db.accountsLedger.push({
    id: generateId("ldgr"),
    date: payDate,
    particulars: `Supplier Payment Made (${supp.name}) ${narration ? "- " + narration : ""}`,
    referenceId: refId,
    type: "Credit",
    amount: numAmount,
    accountGroup: mode === "Cash" ? "Cash" : "Bank",
    supplierId: supp.id,
    ledgerId: supp.id
  });

  db.accountsLedger.push({
    id: generateId("ldgr"),
    date: payDate,
    particulars: `Supplier Payable Payment - ${supp.name}`,
    referenceId: refId,
    type: "Debit",
    amount: numAmount,
    accountGroup: "Supplier Outstanding",
    supplierId: supp.id,
    ledgerId: supp.id
  });

  db.expenses.push({
    id: generateId("exp"),
    date: payDate,
    category: "Supplier Settlement",
    paymentType: mode,
    amount: numAmount,
    note: `Supplier Settlement to ${supp.name}${narration ? " - " + narration : ""}`,
    referenceId: refId,
    supplierId: supp.id
  });

  dbInstance.save(db);
  res.json({ success: true, supplier: supp, newOutstanding: supp.outstanding });
};
