import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/http-error.js";

export function notFoundMiddleware(request: Request, _response: Response, next: NextFunction): void {
  next(new HttpError(404, "ROUTE_NOT_FOUND", `Route not found: ${request.method} ${request.originalUrl}`));
}

