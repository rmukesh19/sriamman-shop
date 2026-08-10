import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import connectDB from "./backend/config/db.js";
import app from "./backend/app.js";

const PORT = process.env.PORT || 3000;

async function startServer() {
  // Connect to DB asynchronously without blocking server initialization
  connectDB().catch((err) => console.warn("MongoDB init notice:", err.message));

  // Vite middleware for development / production static handler
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Rice Shop Billing Software Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
