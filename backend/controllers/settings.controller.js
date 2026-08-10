import { dbInstance } from "../config/dbInstance.js";

export const getCompanySettings = async (req, res) => {
  const db = dbInstance.get();
  const settings = db.companySettings || {};
  res.json({
    ...settings,
    settings,
    users: db.users || [],
    financialYears: db.financialYears || []
  });
};

export const updateCompanySettings = async (req, res) => {
  const db = dbInstance.get();
  db.companySettings = { ...db.companySettings, ...req.body };
  dbInstance.save(db);
  res.json({ success: true, ...db.companySettings, settings: db.companySettings });
};

export const initializeSettings = async (req, res) => {
  const db = dbInstance.get();
  db.companySettings = { ...db.companySettings, ...req.body, isInitialized: true };
  dbInstance.save(db);
  res.json({ success: true, ...db.companySettings, settings: db.companySettings });
};

export const uploadLogo = async (req, res) => {
  const db = dbInstance.get();
  const logoUrl = req.uploadedFileUrl || req.body.logoData || "";
  if (!db.companySettings) db.companySettings = {};
  db.companySettings.logoUrl = logoUrl;
  dbInstance.save(db);
  res.json({ success: true, logoUrl, settings: db.companySettings });
};
