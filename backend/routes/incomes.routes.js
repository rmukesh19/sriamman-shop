import express from "express";
import { getIncomes, createIncome, updateIncome, deleteIncome } from "../controllers/incomes.controller.js";

const router = express.Router();

router.get("/", getIncomes);
router.post("/", createIncome);
router.put("/:id", updateIncome);
router.delete("/:id", deleteIncome);

export default router;
