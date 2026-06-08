import type { Request, Response } from "express";
import { retrieveRelevantResumeChunks } from "../services/rag.service.js";
import { HttpError } from "../utils/http-error.js";

export async function retrieveChunksController(request: Request, response: Response): Promise<void> {
  if (!request.auth) {
    throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required.");
  }

  const chunks = await retrieveRelevantResumeChunks({
    userId: request.auth.userId,
    query: request.body.query,
    limit: request.body.limit,
    chunkTypes: request.body.chunkTypes,
  });

  response.status(200).json({
    query: request.body.query,
    topRelevantChunks: chunks,
  });
}

