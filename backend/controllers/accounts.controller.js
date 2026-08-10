import { dbInstance } from "../config/dbInstance.js";

const generateId = (prefix) => `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

export const getAccountsData = async (req, res) => {
  const db = dbInstance.get();
  res.json({
    accountsGroups: db.accountsGroups || [],
    accountsLedgers: db.accountsLedgers || [],
    accountsLedger: db.accountsLedger || [],
    incomes: db.incomes || [],
    expenses: db.expenses || [],
    vouchers: db.vouchers || []
  });
};

export const getLedger = async (req, res) => {
  const db = dbInstance.get();
  res.json(db.accountsLedger || []);
};

export const createLedgerEntry = async (req, res) => {
  const db = dbInstance.get();
  const newEntry = {
    ...req.body,
    id: generateId("ldgr"),
    date: req.body.date || new Date().toISOString().split("T")[0]
  };
  if (!db.accountsLedger) db.accountsLedger = [];
  db.accountsLedger.push(newEntry);
  dbInstance.save(db);
  res.json({ success: true, ledger: newEntry });
};

export const getGroups = async (req, res) => {
  const db = dbInstance.get();
  res.json(db.accountsGroups || []);
};

export const createAccountsGroup = async (req, res) => {
  const db = dbInstance.get();
  const newGp = { ...req.body, id: generateId("gp") };
  if (!db.accountsGroups) db.accountsGroups = [];
  db.accountsGroups.push(newGp);
  dbInstance.save(db);
  res.json({ success: true, group: newGp });
};

export const getLedgers = async (req, res) => {
  const db = dbInstance.get();
  res.json(db.accountsLedgers || []);
};

export const createAccountsLedger = async (req, res) => {
  const db = dbInstance.get();
  const newLd = { ...req.body, id: generateId("ld") };
  if (!db.accountsLedgers) db.accountsLedgers = [];
  db.accountsLedgers.push(newLd);
  dbInstance.save(db);
  res.json({ success: true, ledger: newLd });
};

export const getIncomes = async (req, res) => {
  const db = dbInstance.get();
  res.json(db.incomes || []);
};

export const createIncomeEntry = async (req, res) => {
  const db = dbInstance.get();
  const newInc = { ...req.body, id: generateId("inc") };
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

export const getExpenses = async (req, res) => {
  const db = dbInstance.get();
  res.json(db.expenses || []);
};

export const createExpenseEntry = async (req, res) => {
  const db = dbInstance.get();
  const newExp = { ...req.body, id: generateId("exp") };
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

export const getVouchers = async (req, res) => {
  const db = dbInstance.get();
  res.json(db.vouchers || []);
};

export const getTrialBalance = async (req, res) => {
  const db = dbInstance.get();
  const ledger = db.accountsLedger || [];
  
  const groupBalances = {};
  ledger.forEach((item) => {
    const group = item.accountGroup || "General";
    if (!groupBalances[group]) {
      groupBalances[group] = { debit: 0, credit: 0 };
    }
    if (item.type === "Debit") {
      groupBalances[group].debit += Number(item.amount) || 0;
    } else {
      groupBalances[group].credit += Number(item.amount) || 0;
    }
  });

  let debitTotal = 0;
  let creditTotal = 0;
  const rows = Object.keys(groupBalances).map((g) => {
    const deb = groupBalances[g].debit;
    const cred = groupBalances[g].credit;
    debitTotal += deb;
    creditTotal += cred;
    return { accountGroup: g, debit: deb, credit: cred, net: deb - cred };
  });

  res.json({ debitTotal, creditTotal, rows, isBalanced: debitTotal === creditTotal });
};
