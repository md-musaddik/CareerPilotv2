import type { NextFunction, Request, Response } from "express";
import { getFirebaseAdminAuth } from "../config/firebase-admin.js";
import { HttpError } from "../utils/http-error.js";

function getBearerToken(request: Request): string {
  const authorizationHeader = request.header("Authorization");

  if (!authorizationHeader) {
    throw new HttpError(401, "AUTH_MISSING_TOKEN", "Missing authorization token.");
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new HttpError(401, "AUTH_INVALID_HEADER", "Authorization header must use the Bearer scheme.");
  }

  return token;
}

export async function requireAuth(request: Request, _response: Response, next: NextFunction): Promise<void> {
  try {
    const token = getBearerToken(request);
    const decodedToken = await getFirebaseAdminAuth().verifyIdToken(token);

    request.auth = {
      userId: decodedToken.uid,
      token: decodedToken,
    };

    next();
  } catch (error) {
    if (error instanceof HttpError) {
      next(error);
      return;
    }

    next(new HttpError(401, "AUTH_INVALID_TOKEN", "Invalid or expired authorization token."));
  }
}

