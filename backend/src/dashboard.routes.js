import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { getDashboard } from "../controllers/dashboard.controller.js";

const router = Router();

router.get("/", asyncHandler(getDashboard));

export { router as dashboardRoutes };
