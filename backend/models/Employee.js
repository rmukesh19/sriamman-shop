import mongoose from "mongoose";

const EmployeeSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  empCode: { type: String, required: true },
  name: { type: String, required: true },
  phone: String,
  role: { type: String, default: "Staff" },
  username: String,
  password: String,
  status: { type: String, default: "Active" },
  salary: { type: Number, default: 0 },
  permissions: [String],
  attendance: [mongoose.Schema.Types.Mixed],
  leaves: [mongoose.Schema.Types.Mixed],
  salaries: [mongoose.Schema.Types.Mixed],
  advances: [mongoose.Schema.Types.Mixed],
  incentives: [mongoose.Schema.Types.Mixed]
}, { timestamps: true });

export default mongoose.models.Employee || mongoose.model("Employee", EmployeeSchema);
