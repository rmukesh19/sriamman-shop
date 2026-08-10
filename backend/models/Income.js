import mongoose from "mongoose";

const IncomeSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  incomeNo: String,
  category: String,
  particulars: String,
  amount: { type: Number, default: 0 },
  date: String,
  paymentMode: { type: String, default: "Cash" },
  receivedFrom: String,
  narration: String
}, { timestamps: true });

export default mongoose.models.Income || mongoose.model("Income", IncomeSchema);
