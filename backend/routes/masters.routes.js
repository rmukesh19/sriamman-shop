import express from "express";
import { dbInstance } from "../config/dbInstance.js";

const router = express.Router();
const generateId = (prefix) => `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

// Helper to handle master collections dynamically
const createMasterRoutes = (collectionName, prefix) => {
  const masterRouter = express.Router();

  masterRouter.get("/", (req, res) => {
    res.json(dbInstance.get()[collectionName] || []);
  });

  masterRouter.post("/", (req, res) => {
    const db = dbInstance.get();
    const newItem = { ...req.body, id: req.body.id || generateId(prefix) };
    if (!db[collectionName]) db[collectionName] = [];
    db[collectionName].push(newItem);
    dbInstance.save(db);
    res.json({ success: true, item: newItem, [collectionName.slice(0, -1)]: newItem });
  });

  masterRouter.put("/:id", (req, res) => {
    const db = dbInstance.get();
    if (!db[collectionName]) db[collectionName] = [];
    const idx = db[collectionName].findIndex((i) => i.id === req.params.id);
    if (idx !== -1) {
      db[collectionName][idx] = { ...db[collectionName][idx], ...req.body };
      dbInstance.save(db);
      res.json({ success: true, item: db[collectionName][idx] });
    } else {
      res.status(404).json({ message: "Item not found" });
    }
  });

  masterRouter.delete("/:id", (req, res) => {
    const db = dbInstance.get();
    if (!db[collectionName]) db[collectionName] = [];
    db[collectionName] = db[collectionName].filter((i) => i.id !== req.params.id);
    dbInstance.save(db);
    res.json({ success: true });
  });

  return masterRouter;
};

export const categoriesRouter = createMasterRoutes("categories", "cat");
export const brandsRouter = createMasterRoutes("brands", "br");
export const unitsRouter = createMasterRoutes("units", "un");
export const godownsRouter = createMasterRoutes("godowns", "god");
export const gstmastersRouter = createMasterRoutes("gstmasters", "gst");
export const paymentTypesRouter = createMasterRoutes("paymentTypes", "pay");

router.use("/categories", categoriesRouter);
router.use("/brands", brandsRouter);
router.use("/units", unitsRouter);
router.use("/godowns", godownsRouter);
router.use("/gstmasters", gstmastersRouter);
router.use("/payment-types", paymentTypesRouter);

export default router;
