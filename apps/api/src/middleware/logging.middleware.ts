import type { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger.js";

export function loggingMiddleware(request: Request, response: Response, next: NextFunction): void {
  const startedAt = Date.now();

  response.on("finish", () => {
    logger.info("HTTP request completed.", {
      durationMs: Date.now() - startedAt,
      method: request.method,
      path: request.originalUrl,
      statusCode: response.statusCode,
    });
  });

  next();
}

