import { dbInstance } from "../config/dbInstance.js";

const generateId = (prefix) => `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

function isRecordReferenced(type, id, db) {
  if (type === "products") {
    const inBills = (db.bills || []).some(b => 
      b.status !== "Cancelled" && (b.items || []).some(item => item.productId === id)
    );
    if (inBills) return true;
    const inPurchases = (db.purchases || []).some(p => 
      (p.items || []).some(item => item.productId === id)
    );
    if (inPurchases) return true;
    const inAdjustments = (db.stockAdjustments || []).some(sa => sa.productId === id);
    if (inAdjustments) return true;
  }
  return false;
}

export const getProducts = async (req, res) => {
  const db = dbInstance.get();
  res.json(db.products || []);
};

export const createProduct = async (req, res) => {
  const db = dbInstance.get();
  const newProduct = {
    ...req.body,
    id: generateId("prod"),
    currentStock: Number(req.body.openingStock) || 0
  };
  db.products.push(newProduct);
  if (newProduct.openingStock > 0) {
    db.stockAdjustments.push({
      id: generateId("sa"),
      productId: newProduct.id,
      productName: newProduct.englishName,
      qty: newProduct.openingStock,
      type: "Opening Stock",
      reason: "Initial Product Import",
      date: new Date().toISOString().replace("T", " ").substring(0, 19)
    });
  }
  dbInstance.save(db);
  res.json({ success: true, product: newProduct });
};

export const updateProduct = async (req, res) => {
  const db = dbInstance.get();
  const index = db.products.findIndex((p) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Product not found" });
  db.products[index] = { ...db.products[index], ...req.body };
  dbInstance.save(db);
  res.json({ success: true, product: db.products[index] });
};

export const deleteProduct = async (req, res) => {
  const db = dbInstance.get();
  const id = req.params.id;
  if (isRecordReferenced("products", id, db)) {
    return res.status(400).json({ success: false, message: "This record cannot be deleted because it is already used in transactions." });
  }
  const idx = db.products.findIndex((p) => p.id === id);
  if (idx !== -1) {
    db.products[idx].status = "Inactive";
    dbInstance.save(db);
  }
  res.json({ success: true });
};
