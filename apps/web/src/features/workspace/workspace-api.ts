import type { User } from "firebase/auth";
import { createApiClient } from "@/services/api-client";
import type {
  CreateApplicationInput,
  CreateCalendarEventInput,
  CreateGoalInput,
  CreateTaskInput,
  UpdateApplicationInput,
  UpdateCalendarEventInput,
  UpdateGoalInput,
  UpdateTaskInput,
  WorkspaceApplication,
  WorkspaceCalendarEvent,
  WorkspaceGoal,
  WorkspaceOverviewResponse,
  WorkspaceTask,
} from "@/features/workspace/types";

export function createWorkspaceApi(user: User | null) {
  const client = createApiClient({ user });

  return {
    getOverview: () => client.get<WorkspaceOverviewResponse>("/workspace/overview"),
    createApplication: (payload: CreateApplicationInput) => client.post<WorkspaceApplication>("/workspace/applications", payload),
    updateApplication: (applicationId: string, payload: UpdateApplicationInput) =>
      client.patch<WorkspaceApplication>(`/workspace/applications/${applicationId}`, payload),
    createGoal: (payload: CreateGoalInput) => client.post<WorkspaceGoal>("/workspace/goals", payload),
    updateGoal: (goalId: string, payload: UpdateGoalInput) =>
      client.patch<WorkspaceGoal>(`/workspace/goals/${goalId}`, payload),
    createGoalTask: (goalId: string, payload: CreateTaskInput) =>
      client.post<WorkspaceTask>(`/workspace/goals/${goalId}/tasks`, payload),
    updateTask: (taskId: string, payload: UpdateTaskInput) =>
      client.patch<WorkspaceTask>(`/workspace/tasks/${taskId}`, payload),
    createCalendarEvent: (payload: CreateCalendarEventInput) =>
      client.post<WorkspaceCalendarEvent>("/workspace/calendar-events", payload),
    updateCalendarEvent: (eventId: string, payload: UpdateCalendarEventInput) =>
      client.patch<WorkspaceCalendarEvent>(`/workspace/calendar-events/${eventId}`, payload),
  };
}
