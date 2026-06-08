import cors from "cors";
import express from "express";
import { config } from "../config/env.js";
import { errorMiddleware } from "../middleware/error.middleware.js";
import { loggingMiddleware } from "../middleware/logging.middleware.js";
import { notFoundMiddleware } from "../middleware/not-found.middleware.js";
import { v1Router } from "../routes/v1.routes.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(loggingMiddleware);

  app.use("/api/v1", v1Router);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
