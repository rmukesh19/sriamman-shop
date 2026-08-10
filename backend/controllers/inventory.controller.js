import { dbInstance } from "../config/dbInstance.js";

const generateId = (prefix) => `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

export const getStockAdjustments = async (req, res) => {
  const db = dbInstance.get();
  res.json(db.stockAdjustments || []);
};

export const createStockAdjustment = async (req, res) => {
  const db = dbInstance.get();
  const { productId, type, qty, reason } = req.body;
  const numQty = Number(qty) || 0;

  const prodIndex = db.products.findIndex((p) => p.id === productId);
  if (prodIndex === -1) {
    return res.status(404).json({ message: "Product not found" });
  }

  const prod = db.products[prodIndex];
  if (type === "Add") {
    prod.currentStock += numQty;
  } else if (type === "Reduce") {
    prod.currentStock = Math.max(0, prod.currentStock - numQty);
  }

  const newAdj = {
    id: generateId("sa"),
    productId,
    productName: prod.englishName,
    qty: numQty,
    type,
    reason: reason || "Manual Adjustment",
    date: new Date().toISOString().replace("T", " ").substring(0, 19)
  };

  db.stockAdjustments.push(newAdj);
  dbInstance.save(db);
  res.json({ success: true, adjustment: newAdj, currentStock: prod.currentStock });
};
