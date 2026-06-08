import type { Request, Response } from "express";
import { searchJobsWithFitScores } from "../services/jobs.service.js";
import { HttpError } from "../utils/http-error.js";

export async function searchJobsController(request: Request, response: Response): Promise<void> {
  if (!request.auth) {
    throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required.");
  }

  const includeExplanation = request.query.explain === "true";

  const result = await searchJobsWithFitScores({
    userId: request.auth.userId,
    what: String(request.query.what),
    where: request.query.where ? String(request.query.where) : undefined,
    page: Number(request.query.page),
    resultsPerPage: Number(request.query.resultsPerPage),
    includeExplanation,
  });

  response.status(200).json(result);
}
