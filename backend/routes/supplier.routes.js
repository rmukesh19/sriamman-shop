import express from "express";
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier, recordSupplierPayment } from "../controllers/supplier.controller.js";

const router = express.Router();

router.get("/", getSuppliers);
router.post("/", createSupplier);
router.put("/:id", updateSupplier);
router.delete("/:id", deleteSupplier);
router.post("/:id/payment", recordSupplierPayment);

export default router;
