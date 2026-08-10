import mongoose from "mongoose";

const SupplierSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: { type: String, required: true },
  phone: { type: String, default: "" },
  tamilName: { type: String, default: "" },
  address: { type: String, default: "" },
  gstin: { type: String, default: "" },
  outstanding: { type: Number, default: 0 },
  status: { type: String, default: "Active" }
}, { timestamps: true });

export default mongoose.models.Supplier || mongoose.model("Supplier", SupplierSchema);
