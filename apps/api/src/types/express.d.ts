import type { DecodedIdToken } from "firebase-admin/auth";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        token: DecodedIdToken;
      };
    }
  }
}

export {};

