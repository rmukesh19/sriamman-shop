import mongoose from "mongoose";
import { dbInstance } from "./db.js";

// Determine MongoDB URI from environment or default
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URL || "mongodb://localhost:27017/riceshop";
let isMongoConnected = false;

// 1. Establish connection with a quick timeout fallback
export async function connectMongoDB() {
  if (process.env.NODE_ENV === "test") return false;
  try {
    console.log("Connecting to MongoDB at:", MONGO_URI);
    // Connect with 10-second timeout for cloud MongoDB Atlas
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    isMongoConnected = true;
    console.log("🟢 Successfully connected to MongoDB via Mongoose!");
    return true;
  } catch (err) {
    console.warn("⚠️ MongoDB offline or unreachable. Falling back to robust JSON database.");
    isMongoConnected = false;
    return false;
  }
}

// Helper to generate IDs
const generateId = (prefix) => `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

// ==========================================
// 2. MONGOOSE SCHEMA & MODEL DEFINITIONS
// ==========================================

const ProductSchema = new mongoose.Schema({
  productCode: { type: String, required: true, unique: true },
  englishName: { type: String, required: true },
  tamilName: String,
  category: String,
  categoryId: String,
  brand: String,
  brandId: String,
  unit: String,
  unitId: String,
  godown: String,
  godownId: String,
  costPrice: { type: Number, default: 0 },
  sellingPrice: { type: Number, default: 0 },
  mrp: { type: Number, default: 0 },
  openingStock: { type: Number, default: 0 },
  currentStock: { type: Number, default: 0 },
  minimumStock: { type: Number, default: 10 },
  weightKg: { type: Number, default: 25 },
  bagSize: { type: String, default: "25kg" },
  status: { type: String, default: "Active" },
  imageUrl: { type: String, default: "" },
  gstPercent: { type: Number, default: 5 }
}, { timestamps: true });

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: String,
  tamilName: String,
  address: String,
  gstin: String,
  outstanding: { type: Number, default: 0 },
  status: { type: String, default: "Active" }
}, { timestamps: true });

const SupplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: String,
  tamilName: String,
  address: String,
  gstin: String,
  outstanding: { type: Number, default: 0 },
  status: { type: String, default: "Active" }
}, { timestamps: true });

const PurchaseSchema = new mongoose.Schema({
  purchaseNo: { type: String, required: true },
  supplierId: String,
  supplierName: String,
  date: String,
  items: [{
    productId: String,
    englishName: String,
    tamilName: String,
    qty: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  }],
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  gstAmount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  balance: { type: Number, default: 0 }
}, { timestamps: true });

const SaleSchema = new mongoose.Schema({
  invoiceNo: { type: String, required: true },
  customerId: String,
  customerName: String,
  date: String,
  items: [{
    productId: String,
    englishName: String,
    tamilName: String,
    qty: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    gstPercent: { type: Number, default: 0 }
  }],
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  gstAmount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  paymentType: { type: String, default: "Cash" },
  status: { type: String, default: "Active" }
}, { timestamps: true });

const StockSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productName: String,
  qty: { type: Number, default: 0 },
  type: { type: String, enum: ["Add", "Reduce"], required: true },
  reason: String,
  date: String
}, { timestamps: true });

const AccountSchema = new mongoose.Schema({
  date: String,
  particulars: String,
  referenceId: String,
  type: { type: String, enum: ["Debit", "Credit"], required: true },
  amount: { type: Number, default: 0 },
  accountGroup: String, // e.g., "Cash", "Bank", "Expense", "Income", "Customer Outstanding", "Supplier Outstanding"
  customerId: String,
  supplierId: String,
  voucherType: String // "Receipt", "Payment", "Expense", "Income"
}, { timestamps: true });

const EmployeeSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  role: { type: String, default: "Staff" },
  status: { type: String, default: "Active" },
  attendance: [mongoose.Schema.Types.Mixed],
  leaves: [mongoose.Schema.Types.Mixed],
  salaries: [mongoose.Schema.Types.Mixed],
  advances: [mongoose.Schema.Types.Mixed],
  incentives: [mongoose.Schema.Types.Mixed]
}, { timestamps: true });

const SettingSchema = new mongoose.Schema({
  companyName: { type: String, default: "SRI AMMAN TRADERS" },
  gstin: { type: String, default: "33AAHFS3829M1Z8" },
  address: { type: String, default: "" },
  phone: { type: String, default: "" },
  email: { type: String, default: "" },
  website: { type: String, default: "" },
  theme: { type: String, default: "Modern Slate" },
  invoiceDesign: { type: String, default: "standard_gst" },
  receiptDesign: { type: String, default: "thermal_80mm" },
  smsEnabled: { type: Boolean, default: true },
  whatsappEnabled: { type: Boolean, default: true },
  emailEnabled: { type: Boolean, default: false },
  thermalPrinterWidth: { type: String, default: "80mm" },
  invoicePrefix: { type: String, default: "SAT-2026-" },
  language: { type: String, default: "English" },
  darkMode: { type: Boolean, default: false }
}, { timestamps: true });

const ReportSchema = new mongoose.Schema({
  reportType: String,
  dateGenerated: String,
  filters: mongoose.Schema.Types.Mixed,
  dataSummary: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const FinancialYearSchema = new mongoose.Schema({
  name: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  isActive: { type: Boolean, default: false }
}, { timestamps: true });

const AccountsGroupSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  status: { type: String, default: "Active" }
}, { timestamps: true });

const AccountsLedgerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  tamilName: String,
  groupId: { type: String, required: true },
  openingBalance: { type: Number, default: 0 },
  balanceType: { type: String, default: "Debit" },
  currentBalance: { type: Number, default: 0 },
  status: { type: String, default: "Active" }
}, { timestamps: true });

// Declare Mongoose Models
const MongoProduct = mongoose.model("Product", ProductSchema);
const MongoCustomer = mongoose.model("Customer", CustomerSchema);
const MongoSupplier = mongoose.model("Supplier", SupplierSchema);
const MongoPurchase = mongoose.model("Purchase", PurchaseSchema);
const MongoSale = mongoose.model("Sale", SaleSchema);
const MongoStock = mongoose.model("Stock", StockSchema);
const MongoAccount = mongoose.model("Account", AccountSchema);
const MongoEmployee = mongoose.model("Employee", EmployeeSchema);
const MongoSetting = mongoose.model("Setting", SettingSchema);
const MongoReport = mongoose.model("Report", ReportSchema);
const MongoFinancialYear = mongoose.model("FinancialYear", FinancialYearSchema);
const MongoAccountsGroup = mongoose.model("AccountsGroup", AccountsGroupSchema);
const MongoAccountsLedger = mongoose.model("AccountsLedger", AccountsLedgerSchema);


// ==========================================
// 3. SEAMLESS FALLBACK DATABASE WRAPPERS
// ==========================================

const createFallbackWrapper = (collectionName, mongoModel) => {
  const checkMongo = () => mongoose.connection.readyState === 1 || isMongoConnected;
  return {
    find: async (query = {}) => {
      if (checkMongo()) {
        return await mongoModel.find(query).lean();
      } else {
        const db = dbInstance.get();
        let list = db[collectionName] || [];
        // Basic query simulation
        if (query && Object.keys(query).length > 0) {
          list = list.filter(item => {
            for (const key in query) {
              if (item[key] !== query[key]) return false;
            }
            return true;
          });
        }
        return list;
      }
    },
    findOne: async (query = {}) => {
      if (mongoose.connection.readyState === 1 || isMongoConnected) {
        return await mongoModel.findOne(query).lean();
      } else {
        const db = dbInstance.get();
        const list = db[collectionName] || [];
        return list.find(item => {
          for (const key in query) {
            if (item[key] !== query[key]) return false;
          }
          return true;
        }) || null;
      }
    },
    findById: async (id) => {
      if (mongoose.connection.readyState === 1 || isMongoConnected) {
        return await mongoModel.findById(id).lean();
      } else {
        const db = dbInstance.get();
        const list = db[collectionName] || [];
        return list.find(item => item.id === id) || null;
      }
    },
    create: async (data) => {
      if (mongoose.connection.readyState === 1 || isMongoConnected) {
        const newDoc = new mongoModel(data);
        return await newDoc.save();
      } else {
        const db = dbInstance.get();
        if (!db[collectionName]) db[collectionName] = [];
        const newRecord = { ...data, id: data.id || generateId(collectionName.slice(0, 3)) };
        db[collectionName].push(newRecord);
        dbInstance.save(db);
        return newRecord;
      }
    },
    findByIdAndUpdate: async (id, updateData) => {
      if (mongoose.connection.readyState === 1 || isMongoConnected) {
        return await mongoModel.findByIdAndUpdate(id, updateData, { new: true }).lean();
      } else {
        const db = dbInstance.get();
        const list = db[collectionName] || [];
        const index = list.findIndex(item => item.id === id);
        if (index !== -1) {
          list[index] = { ...list[index], ...updateData };
          db[collectionName] = list;
          dbInstance.save(db);
          return list[index];
        }
        return null;
      }
    },
    findByIdAndDelete: async (id) => {
      if (mongoose.connection.readyState === 1 || isMongoConnected) {
        return await mongoModel.findByIdAndDelete(id).lean();
      } else {
        const db = dbInstance.get();
        const list = db[collectionName] || [];
        const index = list.findIndex(item => item.id === id);
        if (index !== -1) {
          const removed = list.splice(index, 1)[0];
          db[collectionName] = list;
          dbInstance.save(db);
          return removed;
        }
        return null;
      }
    },
    deleteOne: async (query = {}) => {
      if (mongoose.connection.readyState === 1 || isMongoConnected) {
        return await mongoModel.deleteOne(query);
      } else {
        const db = dbInstance.get();
        const list = db[collectionName] || [];
        const index = list.findIndex(item => {
          for (const key in query) {
            if (item[key] !== query[key]) return false;
          }
          return true;
        });
        if (index !== -1) {
          list.splice(index, 1);
          db[collectionName] = list;
          dbInstance.save(db);
          return { deletedCount: 1 };
        }
        return { deletedCount: 0 };
      }
    }
  };
};

// Export fallback-wrapped models that match Mongoose naming and API
export const Product = createFallbackWrapper("products", MongoProduct);
export const Customer = createFallbackWrapper("customers", MongoCustomer);
export const Supplier = createFallbackWrapper("suppliers", MongoSupplier);
export const Purchase = createFallbackWrapper("purchases", MongoPurchase);
export const Sale = createFallbackWrapper("bills", MongoSale);
export const Stock = createFallbackWrapper("stockAdjustments", MongoStock);
export const Account = createFallbackWrapper("accountsLedger", MongoAccount);
export const Employee = createFallbackWrapper("employees", MongoEmployee);
export const Setting = {
  findOne: async () => {
    if (isMongoConnected) {
      let conf = await MongoSetting.findOne().lean();
      if (!conf) {
        conf = await MongoSetting.create({});
      }
      return conf;
    } else {
      const db = dbInstance.get();
      return db.companySettings;
    }
  },
  findOneAndUpdate: async (query, updateData) => {
    if (isMongoConnected) {
      return await MongoSetting.findOneAndUpdate(query, updateData, { new: true, upsert: true }).lean();
    } else {
      const db = dbInstance.get();
      db.companySettings = { ...db.companySettings, ...updateData };
      dbInstance.save(db);
      return db.companySettings;
    }
  }
};
export const Report = createFallbackWrapper("reports", MongoReport);
export const FinancialYear = createFallbackWrapper("financialYears", MongoFinancialYear);
export const AccountsGroup = createFallbackWrapper("accountsGroups", MongoAccountsGroup);
export const AccountsLedger = createFallbackWrapper("accountsLedgers", MongoAccountsLedger);
