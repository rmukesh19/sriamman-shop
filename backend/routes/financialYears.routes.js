import express from "express";
import { 
  getFinancialYears, 
  createFinancialYear, 
  updateFinancialYear, 
  activateFinancialYear, 
  deleteFinancialYear 
} from "../controllers/financialYears.controller.js";

const router = express.Router();

router.get("/", getFinancialYears);
router.post("/", createFinancialYear);
router.put("/:id", updateFinancialYear);
router.post("/:id/activate", activateFinancialYear);
router.delete("/:id", deleteFinancialYear);

export default router;
