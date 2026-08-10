import express from "express";
import { 
  getAccountsData, 
  getLedger,
  createLedgerEntry,
  getGroups,
  createAccountsGroup, 
  getLedgers,
  createAccountsLedger, 
  getIncomes,
  createIncomeEntry, 
  getExpenses,
  createExpenseEntry,
  getVouchers,
  getTrialBalance
} from "../controllers/accounts.controller.js";

const router = express.Router();

router.get("/data", getAccountsData);
router.get("/ledger", getLedger);
router.post("/ledger", createLedgerEntry);
router.get("/groups", getGroups);
router.post("/groups", createAccountsGroup);
router.get("/ledgers", getLedgers);
router.post("/ledgers", createAccountsLedger);
router.get("/income", getIncomes);
router.post("/income", createIncomeEntry);
router.get("/expense", getExpenses);
router.post("/expense", createExpenseEntry);
router.get("/vouchers", getVouchers);
router.get("/trial-balance", getTrialBalance);

export default router;
