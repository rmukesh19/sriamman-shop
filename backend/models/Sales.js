import mongoose from "mongoose";

const SalesSchema = new mongoose.Schema({
  id: { type: String, unique: true },
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
  grandTotal: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  paymentType: { type: String, default: "Cash" },
  paymentSplit: mongoose.Schema.Types.Mixed,
  payments: [mongoose.Schema.Types.Mixed],
  status: { type: String, default: "Active" }
}, { timestamps: true });

export default mongoose.models.Sales || mongoose.model("Sales", SalesSchema);
