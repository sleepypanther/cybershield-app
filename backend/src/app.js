import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";

import { router } from "./routes/index.js";
import { errorMiddleware } from "./middleware/error.middleware.js";

export function createApp() {
  const app = express();

  // ✅ ROOT ROUTE (IMPORTANT FIX)
  app.get("/", (req, res) => {
    res.send("Backend working 🔥");
  });

  // ✅ MIDDLEWARES
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(morgan("dev"));

  // ✅ RATE LIMIT
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 200,
    })
  );

  // ✅ API ROUTES
  app.use("/api", router);

  // ✅ ERROR HANDLER (LAST)
  app.use(errorMiddleware);

  return app;
}
