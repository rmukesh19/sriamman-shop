import { dbInstance } from "../config/dbInstance.js";

const generateId = (prefix) => `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

export const getPurchaseReturns = async (req, res) => {
  const db = dbInstance.get();
  res.json(db.purchaseReturns || []);
};

export const createPurchaseReturn = async (req, res) => {
  const db = dbInstance.get();
  const newReturn = {
    ...req.body,
    id: generateId("pr"),
    date: req.body.date || new Date().toISOString().split("T")[0],
    createdAt: new Date().toISOString()
  };

  if (!db.purchaseReturns) db.purchaseReturns = [];

  // Deduct returned stock
  if (Array.isArray(newReturn.items)) {
    newReturn.items.forEach((item) => {
      const prodIndex = db.products.findIndex((p) => p.id === item.productId);
      if (prodIndex !== -1) {
        db.products[prodIndex].currentStock = Math.max(0, db.products[prodIndex].currentStock - (Number(item.qty) || 0));
      }
    });
  }

  // Adjust supplier outstanding if applicable
  if (newReturn.supplierId && newReturn.amount) {
    const suppIndex = db.suppliers.findIndex((s) => s.id === newReturn.supplierId);
    if (suppIndex !== -1) {
      db.suppliers[suppIndex].outstanding = Math.max(0, (db.suppliers[suppIndex].outstanding || 0) - (Number(newReturn.amount) || 0));
    }
  }

  db.purchaseReturns.push(newReturn);
  dbInstance.save(db);
  res.json({ success: true, purchaseReturn: newReturn });
};

export const updatePurchaseReturn = async (req, res) => {
  const db = dbInstance.get();
  if (!db.purchaseReturns) db.purchaseReturns = [];
  const index = db.purchaseReturns.findIndex((pr) => pr.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Purchase return not found" });

  const updated = { ...db.purchaseReturns[index], ...req.body };
  db.purchaseReturns[index] = updated;
  dbInstance.save(db);
  res.json({ success: true, purchaseReturn: updated });
};

export const deletePurchaseReturn = async (req, res) => {
  const db = dbInstance.get();
  if (!db.purchaseReturns) db.purchaseReturns = [];
  db.purchaseReturns = db.purchaseReturns.filter((pr) => pr.id !== req.params.id);
  dbInstance.save(db);
  res.json({ success: true });
};
