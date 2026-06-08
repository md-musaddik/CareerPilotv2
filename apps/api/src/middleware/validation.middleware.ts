import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";
import { z } from "zod";
import { HttpError } from "../utils/http-error.js";

type RequestValidationSchema = {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
};

function formatValidationError(error: z.ZodError): unknown {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}

export function validateRequest(schema: RequestValidationSchema) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    try {
      if (schema.body) {
        request.body = schema.body.parse(request.body) as unknown;
      }

      if (schema.params) {
        request.params = schema.params.parse(request.params) as Record<string, string>;
      }

      if (schema.query) {
        request.query = schema.query.parse(request.query) as Request["query"];
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new HttpError(400, "VALIDATION_ERROR", "Invalid request data.", formatValidationError(error)));
        return;
      }

      next(error);
    }
  };
}

