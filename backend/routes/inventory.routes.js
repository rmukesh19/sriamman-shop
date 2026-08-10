import express from "express";
import { getStockAdjustments, createStockAdjustment } from "../controllers/inventory.controller.js";

const router = express.Router();

router.get("/adjustments", getStockAdjustments);
router.post("/adjustments", createStockAdjustment);

export default router;
