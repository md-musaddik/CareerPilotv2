import type { Request, Response } from "express";
import { getCurrentResume, updateParsedResume, uploadAndParseResume } from "../services/resume.service.js";
import { HttpError } from "../utils/http-error.js";

export async function uploadResume(request: Request, response: Response): Promise<void> {
  if (!request.auth) {
    throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required.");
  }

  if (!request.file) {
    throw new HttpError(400, "RESUME_FILE_REQUIRED", "Resume file is required.");
  }

  const resume = await uploadAndParseResume(request.auth.userId, request.file);
  response.status(201).json(resume);
}

export async function getCurrentResumeController(request: Request, response: Response): Promise<void> {
  if (!request.auth) {
    throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required.");
  }

  const resume = await getCurrentResume(request.auth.userId);
  response.status(200).json({ resume });
}

export async function updateResumeController(request: Request, response: Response): Promise<void> {
  if (!request.auth) {
    throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required.");
  }

  const resume = await updateParsedResume({
    userId: request.auth.userId,
    resumeId: request.params.resumeId,
    structuredData: request.body.structuredData,
    editableProfile: request.body.editableProfile,
  });

  response.status(200).json(resume);
}

