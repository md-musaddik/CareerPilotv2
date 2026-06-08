import type { ErrorRequestHandler } from "express";
import { config } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";
import { logger } from "../utils/logger.js";

export const errorMiddleware: ErrorRequestHandler = (error, request, response, _next) => {
  const isHttpError = error instanceof HttpError;
  const statusCode = isHttpError ? error.statusCode : 500;
  const code = isHttpError ? error.code : "INTERNAL_SERVER_ERROR";
  const message = isHttpError ? error.message : "Unexpected server error.";

  logger.error("Request failed.", {
    code,
    method: request.method,
    path: request.path,
    statusCode,
  });

  response.status(statusCode).json({
    error: {
      code,
      message,
      details: isHttpError || config.nodeEnv !== "production" ? error.details : undefined,
    },
  });
};

