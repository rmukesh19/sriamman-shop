import mongoose from "mongoose";

const UnitSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: { type: String, required: true },
  symbol: String,
  status: { type: String, default: "Active" }
}, { timestamps: true });

export default mongoose.models.Unit || mongoose.model("Unit", UnitSchema);
