import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { login, register } from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));

export { router as authRoutes };
