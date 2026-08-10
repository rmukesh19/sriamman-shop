import { dbInstance } from "../config/dbInstance.js";

const generateId = (prefix) => `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

export const getExpenses = async (req, res) => {
  const db = dbInstance.get();
  res.json(db.expenses || []);
};

export const createExpense = async (req, res) => {
  const db = dbInstance.get();
  const newExp = {
    ...req.body,
    id: generateId("exp"),
    date: req.body.date || new Date().toISOString().split("T")[0]
  };
  if (!db.expenses) db.expenses = [];
  db.expenses.push(newExp);

  if (!db.accountsLedger) db.accountsLedger = [];
  db.accountsLedger.push({
    id: generateId("ldgr"),
    date: newExp.date,
    particulars: `Expense: ${newExp.particulars || newExp.category}`,
    referenceId: newExp.id,
    type: "Credit",
    amount: Number(newExp.amount) || 0,
    accountGroup: newExp.paymentMode === "Bank" ? "Bank" : "Cash"
  });

  dbInstance.save(db);
  res.json({ success: true, expense: newExp });
};

export const updateExpense = async (req, res) => {
  const db = dbInstance.get();
  if (!db.expenses) db.expenses = [];
  const index = db.expenses.findIndex((e) => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Expense not found" });

  const updated = { ...db.expenses[index], ...req.body };
  db.expenses[index] = updated;

  // Update corresponding ledger entry
  if (db.accountsLedger) {
    const lIdx = db.accountsLedger.findIndex((l) => l.referenceId === req.params.id);
    if (lIdx !== -1) {
      db.accountsLedger[lIdx].amount = Number(updated.amount) || 0;
      db.accountsLedger[lIdx].particulars = `Expense: ${updated.particulars || updated.category}`;
      db.accountsLedger[lIdx].date = updated.date;
    }
  }

  dbInstance.save(db);
  res.json({ success: true, expense: updated });
};

export const deleteExpense = async (req, res) => {
  const db = dbInstance.get();
  if (!db.expenses) db.expenses = [];
  db.expenses = db.expenses.filter((e) => e.id !== req.params.id);
  if (db.accountsLedger) {
    db.accountsLedger = db.accountsLedger.filter((l) => l.referenceId !== req.params.id);
  }
  dbInstance.save(db);
  res.json({ success: true });
};
