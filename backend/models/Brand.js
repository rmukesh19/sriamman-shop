import mongoose from "mongoose";

const BrandSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: { type: String, required: true },
  description: String,
  status: { type: String, default: "Active" }
}, { timestamps: true });

export default mongoose.models.Brand || mongoose.model("Brand", BrandSchema);
