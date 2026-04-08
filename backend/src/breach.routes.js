import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { createBreachCheck } from "../controllers/breach.controller.js";

const router = Router();

router.post("/", asyncHandler(createBreachCheck));

export { router as breachRoutes };
