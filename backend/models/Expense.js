import mongoose from "mongoose";

const ExpenseSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  expenseNo: String,
  category: String,
  particulars: String,
  amount: { type: Number, default: 0 },
  date: String,
  paymentMode: { type: String, default: "Cash" },
  paidTo: String,
  narration: String
}, { timestamps: true });

export default mongoose.models.Expense || mongoose.model("Expense", ExpenseSchema);
