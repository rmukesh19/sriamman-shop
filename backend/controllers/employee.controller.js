import { dbInstance } from "../config/dbInstance.js";

const generateId = (prefix) => `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

export const getEmployees = async (req, res) => {
  const db = dbInstance.get();
  res.json(db.employees || []);
};

export const createEmployee = async (req, res) => {
  const db = dbInstance.get();
  if (!db.employees) db.employees = [];
  const newEmp = {
    ...req.body,
    id: generateId("emp"),
    attendance: [],
    leaves: [],
    salaries: [],
    advances: [],
    incentives: []
  };
  db.employees.push(newEmp);
  dbInstance.save(db);
  res.json({ success: true, employee: newEmp });
};

export const updateEmployee = async (req, res) => {
  const db = dbInstance.get();
  if (!db.employees) db.employees = [];
  const index = db.employees.findIndex((e) => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Employee not found" });
  db.employees[index] = { ...db.employees[index], ...req.body };
  dbInstance.save(db);
  res.json({ success: true, employee: db.employees[index] });
};

export const deleteEmployee = async (req, res) => {
  const db = dbInstance.get();
  if (!db.employees) db.employees = [];
  db.employees = db.employees.filter((e) => e.id !== req.params.id);
  dbInstance.save(db);
  res.json({ success: true });
};
