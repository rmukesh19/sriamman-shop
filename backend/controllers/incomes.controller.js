import { dbInstance } from "../config/dbInstance.js";

const generateId = (prefix) => `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

export const getIncomes = async (req, res) => {
  const db = dbInstance.get();
  res.json(db.incomes || []);
};

export const createIncome = async (req, res) => {
  const db = dbInstance.get();
  const newInc = {
    ...req.body,
    id: generateId("inc"),
    date: req.body.date || new Date().toISOString().split("T")[0]
  };
  if (!db.incomes) db.incomes = [];
  db.incomes.push(newInc);

  if (!db.accountsLedger) db.accountsLedger = [];
  db.accountsLedger.push({
    id: generateId("ldgr"),
    date: newInc.date,
    particulars: `Income: ${newInc.particulars || newInc.category}`,
    referenceId: newInc.id,
    type: "Debit",
    amount: Number(newInc.amount) || 0,
    accountGroup: newInc.paymentMode === "Bank" ? "Bank" : "Cash"
  });

  dbInstance.save(db);
  res.json({ success: true, income: newInc });
};

export const updateIncome = async (req, res) => {
  const db = dbInstance.get();
  if (!db.incomes) db.incomes = [];
  const index = db.incomes.findIndex((i) => i.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Income not found" });

  const updated = { ...db.incomes[index], ...req.body };
  db.incomes[index] = updated;

  if (db.accountsLedger) {
    const lIdx = db.accountsLedger.findIndex((l) => l.referenceId === req.params.id);
    if (lIdx !== -1) {
      db.accountsLedger[lIdx].amount = Number(updated.amount) || 0;
      db.accountsLedger[lIdx].particulars = `Income: ${updated.particulars || updated.category}`;
      db.accountsLedger[lIdx].date = updated.date;
    }
  }

  dbInstance.save(db);
  res.json({ success: true, income: updated });
};

export const deleteIncome = async (req, res) => {
  const db = dbInstance.get();
  if (!db.incomes) db.incomes = [];
  db.incomes = db.incomes.filter((i) => i.id !== req.params.id);
  if (db.accountsLedger) {
    db.accountsLedger = db.accountsLedger.filter((l) => l.referenceId !== req.params.id);
  }
  dbInstance.save(db);
  res.json({ success: true });
};
