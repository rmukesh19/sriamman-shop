import mongoose from "mongoose";

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URL || "mongodb://localhost:27017/riceshop";

export async function connectDB() {
  try {
    console.log("Connecting to MongoDB at:", MONGO_URI);
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("🟢 Successfully connected to MongoDB database!");
    return true;
  } catch (err) {
    console.warn("⚠️ Could not connect to MongoDB:", err.message);
    return false;
  }
}

export default connectDB;
