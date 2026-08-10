import express from "express";
import { 
  getPurchaseReturns, 
  createPurchaseReturn, 
  updatePurchaseReturn, 
  deletePurchaseReturn 
} from "../controllers/purchaseReturns.controller.js";

const router = express.Router();

router.get("/", getPurchaseReturns);
router.post("/", createPurchaseReturn);
router.put("/:id", updatePurchaseReturn);
router.delete("/:id", deletePurchaseReturn);

export default router;
