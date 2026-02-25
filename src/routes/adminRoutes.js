import express from "express";
import protect from "../middleware/authMiddleware.js";
import adminOnly from "../middleware/adminMiddleware.js";
import { getStats } from "../controllers/adminController.js";

const router = express.Router();

router.get("/stats", protect, adminOnly, getStats);

export default router;
