import type { Request, Response } from "express";
import { getHealthStatus } from "../services/health.service.js";

export function getHealth(_request: Request, response: Response): void {
  response.status(200).json(getHealthStatus());
}
