import { Router } from "express";
import {
  createApplicationController,
  createCalendarEventController,
  createGoalController,
  createGoalTaskController,
  getWorkspaceOverviewController,
  updateApplicationController,
  updateCalendarEventController,
  updateGoalController,
  updateTaskController,
} from "../controllers/workspace-controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import {
  createApplicationSchema,
  createCalendarEventSchema,
  createGoalSchema,
  createGoalTaskSchema,
  updateApplicationSchema,
  updateCalendarEventSchema,
  updateGoalSchema,
  updateTaskSchema,
} from "../schemas/workspace.schemas.js";
import { asyncHandler } from "../utils/async-handler.js";

export const workspaceRouter = Router();

workspaceRouter.use(requireAuth);

workspaceRouter.get("/overview", asyncHandler(getWorkspaceOverviewController));
workspaceRouter.post("/applications", validateRequest(createApplicationSchema), asyncHandler(createApplicationController));
workspaceRouter.patch(
  "/applications/:applicationId",
  validateRequest(updateApplicationSchema),
  asyncHandler(updateApplicationController),
);
workspaceRouter.post("/goals", validateRequest(createGoalSchema), asyncHandler(createGoalController));
workspaceRouter.patch("/goals/:goalId", validateRequest(updateGoalSchema), asyncHandler(updateGoalController));
workspaceRouter.post(
  "/goals/:goalId/tasks",
  validateRequest(createGoalTaskSchema),
  asyncHandler(createGoalTaskController),
);
workspaceRouter.patch("/tasks/:taskId", validateRequest(updateTaskSchema), asyncHandler(updateTaskController));
workspaceRouter.post(
  "/calendar-events",
  validateRequest(createCalendarEventSchema),
  asyncHandler(createCalendarEventController),
);
workspaceRouter.patch(
  "/calendar-events/:eventId",
  validateRequest(updateCalendarEventSchema),
  asyncHandler(updateCalendarEventController),
);
