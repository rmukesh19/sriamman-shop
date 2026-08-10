import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  fullName: { type: String, required: true },
  role: { type: String, enum: ["Admin", "Manager", "Cashier", "Storekeeper"], default: "Admin" },
  status: { type: String, enum: ["Active", "Inactive", "Suspended"], default: "Active" }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", UserSchema);
