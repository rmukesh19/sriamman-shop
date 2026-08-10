import mongoose from "mongoose";

const GodownSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: { type: String, required: true },
  capacity: String,
  itemsCount: { type: Number, default: 0 },
  status: { type: String, default: "Active" }
}, { timestamps: true });

export default mongoose.models.Godown || mongoose.model("Godown", GodownSchema);
