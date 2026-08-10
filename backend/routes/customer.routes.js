import express from "express";
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, recordCustomerPayment } from "../controllers/customer.controller.js";

const router = express.Router();

router.get("/", getCustomers);
router.post("/", createCustomer);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);
router.post("/:id/payment", recordCustomerPayment);

export default router;
