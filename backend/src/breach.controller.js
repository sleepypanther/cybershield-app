import { BreachCheck } from "../models/breach-check.model.js";
import { checkEmailBreach } from "../services/breach.service.js";
import { sendSuccess } from "../utils/api-response.js";
import { AppError } from "../utils/app-error.js";

export async function createBreachCheck(req, res) {
  const email = String(req.body?.email || "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    throw new AppError("A valid email address is required", 400);
  }

  const result = await checkEmailBreach(email);
  const record = await BreachCheck.create({
    userId: req.user.id,
    email,
    provider: result.provider,
    found: result.found,
    breachCount: result.breachCount,
    breaches: result.breaches,
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: result.found ? "Email exposure found" : "No breaches found for this email",
    data: {
      checkId: record._id.toString(),
      email,
      provider: result.provider,
      found: result.found,
      breachCount: result.breachCount,
      breaches: result.breaches,
      checkedAt: record.createdAt,
    },
  });
}
