import mongoose from "mongoose";

const StockSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  productId: { type: String, required: true },
  productName: String,
  qty: { type: Number, default: 0 },
  type: { type: String, required: true },
  reason: String,
  date: String
}, { timestamps: true });

export default mongoose.models.Stock || mongoose.model("Stock", StockSchema);
