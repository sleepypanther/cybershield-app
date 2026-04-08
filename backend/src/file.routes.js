import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../utils/async-handler.js";
import { createFileAnalysis } from "../controllers/file.controller.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("file"), asyncHandler(createFileAnalysis));

export { router as fileRoutes };
