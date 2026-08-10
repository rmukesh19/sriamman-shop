# Rice Shop Billing Software - Full-Stack Architecture

A complete enterprise-grade Rice Shop Billing & Inventory Management application with Express backend, MongoDB / local database integration, and React + Tailwind frontend.

---

## 📁 Professional Project Architecture

```
project/
│
├── frontend/                ← React.js Application
│   ├── src/
│   │   ├── components/      ← Modules (Billing, Inventory, Accounts, Masters, Reports, etc.)
│   │   ├── contexts/        ← React Contexts (Language, Theme, Auth)
│   │   ├── utils/           ← Offline Interceptor, Sync Engine, PDF Generators
│   │   ├── App.jsx          ← Main Application Hub
│   │   └── main.jsx         ← Entry Point
│   ├── public/              ← Static Assets & Icons
│   ├── index.html           ← Single Page Application HTML
│   ├── package.json         ← Frontend Dependencies
│   └── vite.config.js       ← Vite Build & Development Config
│
├── backend/                 ← Node.js + Express API
│   ├── config/              ← Database Configurations (db.js for MongoDB)
│   ├── controllers/         ← Business Logic & Handlers
│   ├── middleware/          ← Authentication & Error Handling
│   ├── models/              ← Mongoose Database Schemas
│   ├── routes/              ← Express API Route Handlers
│   ├── services/            ← Data Services
│   ├── app.js               ← Express App Setup & Middleware
│   ├── server.js            ← Server Entry Point
│   └── package.json         ← Backend Dependencies
│
├── server/                  ← Root Backend (for Cloud Run / Single Container Deployment)
├── src/                     ← Root Frontend (for Cloud Run / Single Container Deployment)
├── server.js                ← Integrated Dev/Prod Server Entry Point
├── package.json             ← Root Manifest
├── .env.example             ← Environment Variable Definitions
└── README.md                ← Project Documentation
```

---

## 🚀 Quick Start Guide

### Option A: Standard Dual-Process Development (Frontend + Backend)

1. **Start Backend API Server**:
   ```bash
   cd backend
   npm install
   npm start
   ```
   *Runs Express API on `http://localhost:5000` (or `PORT` defined in `.env`).*

2. **Start Frontend Dev Server**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *Runs Vite Dev Server on `http://localhost:5173` with full hot reloading and proxying.*

---

### Option B: Unified Single-Container Deployment (AI Studio / Cloud Run / Production Docker)

1. **Install Root Dependencies**:
   ```bash
   npm install
   ```

2. **Run Integrated Server**:
   ```bash
   npm run dev
   ```
   *Boots Express backend server and mounts Vite middleware on port 3000.*

3. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

---

## 🛡️ Database & Persistent Storage

- **MongoDB Support**: Connects to MongoDB via `MONGODB_URI` environment variable (`backend/config/db.js`).
- **Resilient Fallback Mode**: If MongoDB is offline, the backend gracefully switches to local file-based database storage (`data/db.json`), ensuring 100% uptime and offline sync capability.

---

## 🔑 Key Features & Modules

- **Billing & POS System**: Thermal printing, GST calculation, Tamil transliteration support, barcode reader ready.
- **Inventory & Stock Management**: Real-time batch tracking, godown transfers, reorder level alerts, stock adjustments.
- **Financial Accounts & Ledgers**: Day book, trial balance, voucher entries, profit & loss statement.
- **Purchase & Returns**: Supplier invoice tracking, return debit notes, payment histories.
- **Employee & Payroll Management**: Attendance tracking, salary calculation, advance payments.
- **Master Data**: Custom categories, rice brands, units (kg, bag, quintal), tax slabs.

---

## ⚙️ Environment Variables (`.env`)

```env
PORT=3000
MONGODB_URI="mongodb://localhost:27017/riceshop"
JWT_SECRET="rice_shop_super_secret_jwt_key_2026"
```
