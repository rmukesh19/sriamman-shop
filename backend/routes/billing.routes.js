import express from "express";
import { getBills, getNextBillNumber, createBill, cancelBill } from "../controllers/billing.controller.js";

const router = express.Router();

router.get("/", getBills);
router.get("/next-number", getNextBillNumber);
router.post("/", createBill);
router.put("/:id/cancel", cancelBill);

export default router;
