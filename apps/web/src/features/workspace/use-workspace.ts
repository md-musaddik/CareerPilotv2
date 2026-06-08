import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/auth-context";
import { createWorkspaceApi } from "@/features/workspace/workspace-api";
import type {
  CreateApplicationInput,
  CreateCalendarEventInput,
  CreateGoalInput,
  CreateTaskInput,
  UpdateApplicationInput,
  UpdateCalendarEventInput,
  UpdateGoalInput,
  UpdateTaskInput,
} from "@/features/workspace/types";

export const workspaceOverviewQueryKey = ["workspace", "overview"];

export function useWorkspaceOverview() {
  const { user } = useAuth();
  const workspaceApi = createWorkspaceApi(user);

  return useQuery({
    enabled: Boolean(user),
    queryKey: workspaceOverviewQueryKey,
    queryFn: () => workspaceApi.getOverview(),
  });
}

export function useCreateApplication() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const workspaceApi = createWorkspaceApi(user);

  return useMutation({
    mutationFn: (payload: CreateApplicationInput) => workspaceApi.createApplication(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspaceOverviewQueryKey });
    },
  });
}

export function useUpdateApplication() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const workspaceApi = createWorkspaceApi(user);

  return useMutation({
    mutationFn: (params: { applicationId: string; payload: UpdateApplicationInput }) =>
      workspaceApi.updateApplication(params.applicationId, params.payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspaceOverviewQueryKey });
    },
  });
}

export function useCreateGoal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const workspaceApi = createWorkspaceApi(user);

  return useMutation({
    mutationFn: (payload: CreateGoalInput) => workspaceApi.createGoal(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspaceOverviewQueryKey });
    },
  });
}

export function useUpdateGoal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const workspaceApi = createWorkspaceApi(user);

  return useMutation({
    mutationFn: (params: { goalId: string; payload: UpdateGoalInput }) =>
      workspaceApi.updateGoal(params.goalId, params.payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspaceOverviewQueryKey });
    },
  });
}

export function useCreateGoalTask() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const workspaceApi = createWorkspaceApi(user);

  return useMutation({
    mutationFn: (params: { goalId: string; payload: CreateTaskInput }) =>
      workspaceApi.createGoalTask(params.goalId, params.payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspaceOverviewQueryKey });
    },
  });
}

export function useUpdateTask() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const workspaceApi = createWorkspaceApi(user);

  return useMutation({
    mutationFn: (params: { taskId: string; payload: UpdateTaskInput }) =>
      workspaceApi.updateTask(params.taskId, params.payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspaceOverviewQueryKey });
    },
  });
}

export function useCreateCalendarEvent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const workspaceApi = createWorkspaceApi(user);

  return useMutation({
    mutationFn: (payload: CreateCalendarEventInput) => workspaceApi.createCalendarEvent(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspaceOverviewQueryKey });
    },
  });
}

export function useUpdateCalendarEvent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const workspaceApi = createWorkspaceApi(user);

  return useMutation({
    mutationFn: (params: { eventId: string; payload: UpdateCalendarEventInput }) =>
      workspaceApi.updateCalendarEvent(params.eventId, params.payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspaceOverviewQueryKey });
    },
  });
}
