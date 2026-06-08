import type { Request, Response } from "express";
import {
  createApplication,
  createCalendarEvent,
  createGoal,
  createTask,
  getWorkspaceOverview,
  updateApplication,
  updateCalendarEvent,
  updateGoal,
  updateTask,
} from "../services/workspace.service.js";
import { HttpError } from "../utils/http-error.js";

function requireUserId(request: Request): string {
  if (!request.auth) {
    throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required.");
  }

  return request.auth.userId;
}

export async function getWorkspaceOverviewController(request: Request, response: Response): Promise<void> {
  const userId = requireUserId(request);
  const result = await getWorkspaceOverview(userId);
  response.status(200).json(result);
}

export async function createApplicationController(request: Request, response: Response): Promise<void> {
  const userId = requireUserId(request);
  const result = await createApplication(userId, request.body);
  response.status(201).json(result);
}

export async function updateApplicationController(request: Request, response: Response): Promise<void> {
  const userId = requireUserId(request);
  const result = await updateApplication(userId, request.params.applicationId, request.body);
  response.status(200).json(result);
}

export async function createGoalController(request: Request, response: Response): Promise<void> {
  const userId = requireUserId(request);
  const result = await createGoal(userId, request.body);
  response.status(201).json(result);
}

export async function updateGoalController(request: Request, response: Response): Promise<void> {
  const userId = requireUserId(request);
  const result = await updateGoal(userId, request.params.goalId, request.body);
  response.status(200).json(result);
}

export async function createGoalTaskController(request: Request, response: Response): Promise<void> {
  const userId = requireUserId(request);
  const result = await createTask(userId, {
    ...request.body,
    relatedEntityType: "goal",
    relatedEntityId: request.params.goalId,
  });
  response.status(201).json(result);
}

export async function updateTaskController(request: Request, response: Response): Promise<void> {
  const userId = requireUserId(request);
  const result = await updateTask(userId, request.params.taskId, request.body);
  response.status(200).json(result);
}

export async function createCalendarEventController(request: Request, response: Response): Promise<void> {
  const userId = requireUserId(request);
  const result = await createCalendarEvent(userId, request.body);
  response.status(201).json(result);
}

export async function updateCalendarEventController(request: Request, response: Response): Promise<void> {
  const userId = requireUserId(request);
  const result = await updateCalendarEvent(userId, request.params.eventId, request.body);
  response.status(200).json(result);
}
