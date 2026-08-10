import mongoose from "mongoose";

const LedgerSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  date: String,
  particulars: String,
  referenceId: String,
  type: { type: String, enum: ["Debit", "Credit"], required: true },
  amount: { type: Number, default: 0 },
  accountGroup: String,
  customerId: String,
  supplierId: String,
  ledgerId: String,
  voucherType: String
}, { timestamps: true });

export default mongoose.models.Ledger || mongoose.model("Ledger", LedgerSchema);
