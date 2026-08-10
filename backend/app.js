import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";

import authRoutes from "./routes/auth.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import productRoutes from "./routes/product.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import supplierRoutes from "./routes/supplier.routes.js";
import purchaseRoutes from "./routes/purchase.routes.js";
import purchaseReturnsRoutes from "./routes/purchaseReturns.routes.js";
import billingRoutes from "./routes/billing.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import accountsRoutes from "./routes/accounts.routes.js";
import expensesRoutes from "./routes/expenses.routes.js";
import incomesRoutes from "./routes/incomes.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
import employeeRoutes from "./routes/employee.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import financialYearsRoutes from "./routes/financialYears.routes.js";
import mastersRoutes, { 
  categoriesRouter, 
  brandsRouter, 
  unitsRouter, 
  godownsRouter, 
  gstmastersRouter,
  paymentTypesRouter
} from "./routes/masters.routes.js";

import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

const uploadsDir = path.join(process.cwd(), "data/uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(uploadsDir));

// Transliterate endpoint
app.get("/api/transliterate", async (req, res) => {
  try {
    const { text } = req.query;
    if (!text) return res.json({ success: true, result: "" });
    const url = `https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=ta-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`;
    const response = await fetch(url);
    const data = await response.json();
    if (data && data[0] === "SUCCESS" && data[1] && data[1][0] && data[1][0].candidate) {
      return res.json({ success: true, result: data[1][0].candidate[0] });
    }
    return res.json({ success: false, message: "Invalid API response" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/products", productRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/purchase-returns", purchaseReturnsRoutes);
app.use("/api/bills", billingRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/accounts", accountsRoutes);
app.use("/api/expenses", expensesRoutes);
app.use("/api/incomes", incomesRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/financial-years", financialYearsRoutes);
app.use("/api/masters", mastersRoutes);
app.use("/api/categories", categoriesRouter);
app.use("/api/brands", brandsRouter);
app.use("/api/units", unitsRouter);
app.use("/api/godowns", godownsRouter);
app.use("/api/gstmasters", gstmastersRouter);
app.use("/api/payment-types", paymentTypesRouter);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "Rice Shop Billing Software API", timestamp: new Date() });
});

app.use(errorHandler);

export default app;
