import { AppError } from "../utils/app-error.js";

export function errorMiddleware(error, req, res, next) {
  void req;
  void next;

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      error: {
        details: error.details,
      },
    });
  }

  console.error(error);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
    error: {
      details: error.message || "Unexpected error",
    },
  });
}
