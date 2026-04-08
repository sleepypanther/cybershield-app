import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/user.model.js";
import { AppError } from "../utils/app-error.js";

export async function protect(req, res, next) {
  void res;

  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    next(new AppError("Authentication required", 401));
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.sub).lean();

    if (!user) {
      next(new AppError("User no longer exists", 401));
      return;
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    };
    next();
  } catch (error) {
    next(new AppError("Invalid or expired token", 401));
  }
}
