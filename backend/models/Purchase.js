import mongoose from "mongoose";

const PurchaseSchema = new mongoose.Schema({
  id: { type: String, unique: true },
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
  balance: { type: Number, default: 0 },
  paymentType: { type: String, default: "Cash" }
}, { timestamps: true });

export default mongoose.models.Purchase || mongoose.model("Purchase", PurchaseSchema);
