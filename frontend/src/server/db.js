import fs from "fs";
import path from "path";
const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "db.json");
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
const INITIAL_DATABASE = {
  products: [],
  customers: [],
  suppliers: [],
  bills: [],
  purchases: [],
  stockAdjustments: [],
  expenses: [],
  incomes: [],
  accountsLedger: [],
  financialYears: [
    {
      id: "fy-2026-27",
      name: "FY 2026-27",
      startDate: "2026-04-01",
      endDate: "2027-03-31",
      isActive: true
    }
  ],
  users: [
    {
      id: "user-admin",
      username: "admin",
      passwordHash: "admin123",
      role: "Admin",
      fullName: "Sri Amman Admin",
      status: "Active"
    }
  ],
  employees: [],
  companySettings: {
    companyName: "SRI AMMAN TRADERS",
    gstin: "33AAHFS3829M1Z8",
    address: "105, bypass Road, Erode, Tamil Nadu - 638001",
    phone: "9876543210 / 0424-222333",
    email: "sriammanriceerode@gmail.com",
    website: "www.sriammanrice.com",
    theme: "Modern Slate",
    invoiceDesign: "standard_gst",
    receiptDesign: "thermal_80mm",
    smsEnabled: true,
    whatsappEnabled: true,
    emailEnabled: false,
    thermalPrinterWidth: "80mm",
    invoicePrefix: "SAT-2026-",
    language: "English",
    darkMode: false,
    isInitialized: false
  },
  categories: [],
  brands: [],
  units: [],
  godowns: [],
  gstMasters: [],
  accountsGroups: [],
  accountsLedgers: []
};
class LocalDB {
  data;
  constructor() {
    this.data = this.load();
  }
  load() {
    if (fs.existsSync(DB_PATH)) {
      try {
        const fileContent = fs.readFileSync(DB_PATH, "utf-8");
        const db = JSON.parse(fileContent);
        if (!db.accountsGroups) {
          db.accountsGroups = [];
        }
        if (!db.expenses) {
          db.expenses = [];
        }
        if (!db.incomes) {
          db.incomes = [];
        }
        if (!db.financialYears || db.financialYears.length === 0) {
          db.financialYears = INITIAL_DATABASE.financialYears;
        }
        if (!db.employees) {
          db.employees = INITIAL_DATABASE.employees;
        }
        if (!db.categories) {
          db.categories = INITIAL_DATABASE.categories;
        }
        if (!db.brands) {
          db.brands = INITIAL_DATABASE.brands;
        }
        if (!db.units) {
          db.units = INITIAL_DATABASE.units;
        }
        if (!db.godowns) {
          db.godowns = INITIAL_DATABASE.godowns;
        }
        if (!db.gstMasters) {
          db.gstMasters = INITIAL_DATABASE.gstMasters;
        }
        if (db.companySettings) {
          db.companySettings = {
            ...INITIAL_DATABASE.companySettings,
            ...db.companySettings
          };
        } else {
          db.companySettings = INITIAL_DATABASE.companySettings;
        }
        return db;
      } catch (err) {
        console.error("Error reading database, resetting to seed data", err);
        this.saveData(INITIAL_DATABASE);
        return INITIAL_DATABASE;
      }
    } else {
      this.saveData(INITIAL_DATABASE);
      return INITIAL_DATABASE;
    }
  }
  saveData(data) {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      console.error("Error writing database", err);
    }
  }
  get() {
    return this.data;
  }
  save(newData) {
    this.data = newData;
    this.saveData(newData);
  }
  // Auto incremental helper
  nextInvoiceNo() {
    const activeBills = this.data.bills;
    const count = activeBills.length + 1;
    const year = (/* @__PURE__ */ new Date()).getFullYear();
    return `${this.data.companySettings.invoicePrefix}${year}-${String(count).padStart(3, "0")}`;
  }
  nextPurchaseNo() {
    const count = this.data.purchases.length + 1;
    return `PUR-2026-${String(count).padStart(3, "0")}`;
  }
}
const dbInstance = new LocalDB();
export {
  dbInstance
};
