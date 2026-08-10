import mongoose from "mongoose";

const CompanySchema = new mongoose.Schema({
  companyName: { type: String, default: "SRI AMMAN TRADERS" },
  gstin: { type: String, default: "33AAHFS3829M1Z8" },
  address: { type: String, default: "105, bypass Road, Erode, Tamil Nadu - 638001" },
  phone: { type: String, default: "9876543210" },
  email: { type: String, default: "sriammanriceerode@gmail.com" },
  website: { type: String, default: "www.sriammanrice.com" },
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

export default mongoose.models.Company || mongoose.model("Company", CompanySchema);
