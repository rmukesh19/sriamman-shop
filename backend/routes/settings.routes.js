import express from "express";
import { getCompanySettings, updateCompanySettings, initializeSettings, uploadLogo } from "../controllers/settings.controller.js";
import { handleBase64Upload } from "../middleware/upload.middleware.js";

const router = express.Router();

router.get("/", getCompanySettings);
router.head("/", getCompanySettings);
router.get("/company", getCompanySettings);
router.put("/", updateCompanySettings);
router.put("/company", updateCompanySettings);
router.post("/initialize", initializeSettings);
router.post("/logo", handleBase64Upload, uploadLogo);

export default router;
