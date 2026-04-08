import { Router } from "express";
import { authRoutes } from "./auth.routes.js";
import { scanRoutes } from "./scan.routes.js";
import { breachRoutes } from "./breach.routes.js";
import { fileRoutes } from "./file.routes.js";
import { dashboardRoutes } from "./dashboard.routes.js";
import { protect } from "../middleware/auth.middleware.js";
import { sendSuccess } from "../utils/api-response.js";
import { detectNmap } from "../services/tooling.service.js";

const router = Router();

router.get("/health", (req, res) =>
  sendSuccess(res, {
    message: "Service is healthy",
    data: {
      timestamp: new Date().toISOString(),
      tools: {
        nmap: detectNmap(),
      },
      platform: process.platform,
    },
  })
);

router.use("/auth", authRoutes);
router.use(protect);
router.use("/scan", scanRoutes);
router.use("/breach", breachRoutes);
router.use("/file", fileRoutes);
router.use("/dashboard", dashboardRoutes);

export { router };
