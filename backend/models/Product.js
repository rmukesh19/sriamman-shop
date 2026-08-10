import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  productCode: { type: String, required: true },
  englishName: { type: String, required: true },
  tamilName: { type: String, default: "" },
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
  gstPercent: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);
