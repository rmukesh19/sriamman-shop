import { dbInstance } from "../config/dbInstance.js";

const generateId = (prefix) => `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

export const getFinancialYears = async (req, res) => {
  const db = dbInstance.get();
  res.json(db.financialYears || []);
};

export const createFinancialYear = async (req, res) => {
  const db = dbInstance.get();
  const newFY = {
    ...req.body,
    id: generateId("fy"),
    isActive: false
  };
  if (!db.financialYears) db.financialYears = [];
  db.financialYears.push(newFY);
  dbInstance.save(db);
  res.json({ success: true, financialYear: newFY, financialYears: db.financialYears });
};

export const updateFinancialYear = async (req, res) => {
  const db = dbInstance.get();
  if (!db.financialYears) db.financialYears = [];
  const index = db.financialYears.findIndex((f) => f.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Financial year not found" });

  db.financialYears[index] = { ...db.financialYears[index], ...req.body };
  dbInstance.save(db);
  res.json({ success: true, financialYear: db.financialYears[index], financialYears: db.financialYears });
};

export const activateFinancialYear = async (req, res) => {
  const db = dbInstance.get();
  if (!db.financialYears) db.financialYears = [];
  db.financialYears.forEach((f) => {
    f.isActive = f.id === req.params.id;
  });
  dbInstance.save(db);
  res.json({ success: true, financialYears: db.financialYears });
};

export const deleteFinancialYear = async (req, res) => {
  const db = dbInstance.get();
  if (!db.financialYears) db.financialYears = [];
  db.financialYears = db.financialYears.filter((f) => f.id !== req.params.id);
  dbInstance.save(db);
  res.json({ success: true, financialYears: db.financialYears });
};
