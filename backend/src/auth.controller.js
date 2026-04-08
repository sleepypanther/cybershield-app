import { User } from "../models/user.model.js";
import { comparePassword, hashPassword, signToken } from "../services/auth.service.js";
import { sendSuccess } from "../utils/api-response.js";
import { AppError } from "../utils/app-error.js";

export async function register(req, res) {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    throw new AppError("name, email, and password are required", 400);
  }

  const existing = await User.findOne({ email: email.toLowerCase() }).lean();
  if (existing) {
    throw new AppError("A user with this email already exists", 409);
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash: await hashPassword(password),
  });

  const token = signToken(user);

  return sendSuccess(res, {
    statusCode: 201,
    message: "User registered successfully",
    data: {
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    },
  });
}

export async function login(req, res) {
  const { email, password } = req.body || {};

  if (!email || !password) {
    throw new AppError("email and password are required", 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  const matches = await comparePassword(password, user.passwordHash);
  if (!matches) {
    throw new AppError("Invalid credentials", 401);
  }

  return sendSuccess(res, {
    message: "Login successful",
    data: {
      token: signToken(user),
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    },
  });
}
