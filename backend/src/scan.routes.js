import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { createScan, listScans } from "../controllers/scan.controller.js";

const router = Router();

router.post("/", asyncHandler(createScan));
router.get("/", asyncHandler(listScans));

export { router as scanRoutes };
