import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: { type: String, required: true },
  description: String,
  status: { type: String, default: "Active" }
}, { timestamps: true });

export default mongoose.models.Category || mongoose.model("Category", CategorySchema);
