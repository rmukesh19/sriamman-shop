import express from "express";
import { getReportsData } from "../controllers/reports.controller.js";

const router = express.Router();

router.get("/data", getReportsData);

export default router;
