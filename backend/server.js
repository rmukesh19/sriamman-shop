import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Express Backend Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
