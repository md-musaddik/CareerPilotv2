import mongoose from "mongoose";
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
} from "@careerpilot/shared/types/workspace";
import { ApplicationModel } from "../models/application.model.js";
import { CalendarEventModel } from "../models/calendar-event.model.js";
import { GoalModel } from "../models/goal.model.js";
import { ParsedResumeModel } from "../models/parsed-resume.model.js";
import { ResumeDocumentModel } from "../models/resume-document.model.js";
import { TaskModel } from "../models/task.model.js";
import { HttpError } from "../utils/http-error.js";

const { Types } = mongoose;

function toIso(value?: Date | null): string | undefined {
  return value ? value.toISOString() : undefined;
}

function formatTimeLabel(value?: Date | null): string {
  if (!value) {
    return "All day";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(value);
}

function buildGoalProgress(tasks: WorkspaceTask[], status: WorkspaceGoal["status"]): number {
  if (tasks.length === 0) {
    return status === "completed" ? 100 : status === "in_progress" ? 40 : 0;
  }

  const completedCount = tasks.filter((task) => task.status === "completed").length;
  return Math.round((completedCount / tasks.length) * 100);
}

async function getResumeReady(userId: string): Promise<boolean> {
  const resumeDocument = await ResumeDocumentModel.findOne({
    userId,
    status: "parsed",
    parsedResumeId: { $exists: true },
  })
    .select("_id parsedResumeId")
    .lean();

  if (!resumeDocument?.parsedResumeId) {
    return false;
  }

  const parsedResume = await ParsedResumeModel.findOne({
    _id: resumeDocument.parsedResumeId,
    userId,
  })
    .select("_id")
    .lean();

  return Boolean(parsedResume);
}

export async function getWorkspaceOverview(userId: string): Promise<WorkspaceOverviewResponse> {
  const [applications, goals, tasks, manualCalendarEvents, resumeReady] = await Promise.all([
    ApplicationModel.find({ userId, deletedAt: { $exists: false } }).sort({ updatedAt: -1, createdAt: -1 }).lean(),
    GoalModel.find({ userId }).sort({ targetDate: 1, createdAt: -1 }).lean(),
    TaskModel.find({ userId }).sort({ dueAt: 1, createdAt: -1 }).lean(),
    CalendarEventModel.find({ userId }).sort({ startsAt: 1, createdAt: -1 }).lean(),
    getResumeReady(userId),
  ]);

  const workspaceTasks: WorkspaceTask[] = tasks.map((task) => ({
    id: task._id.toString(),
    title: task.title,
    description: task.description ?? undefined,
    status: task.status,
    priority: task.priority,
    dueAt: toIso(task.dueAt),
    completedAt: toIso(task.completedAt),
    relatedEntityType: task.relatedEntityType ?? undefined,
    relatedEntityId: task.relatedEntityId ?? undefined,
    relatedGoalId: task.relatedEntityType === "goal" ? task.relatedEntityId ?? undefined : undefined,
    createdAt: toIso(task.createdAt),
    updatedAt: toIso(task.updatedAt),
  }));

  const goalTitleById = new Map(goals.map((goal) => [goal._id.toString(), goal.title]));
  const tasksByGoalId = new Map<string, WorkspaceTask[]>();

  for (const task of workspaceTasks) {
    if (!task.relatedGoalId) {
      continue;
    }

    task.relatedGoalTitle = goalTitleById.get(task.relatedGoalId);
    const existingTasks = tasksByGoalId.get(task.relatedGoalId) ?? [];
    existingTasks.push(task);
    tasksByGoalId.set(task.relatedGoalId, existingTasks);
  }

  const workspaceGoals: WorkspaceGoal[] = goals.map((goal) => {
    const goalTasks = tasksByGoalId.get(goal._id.toString()) ?? [];
    return {
      id: goal._id.toString(),
      title: goal.title,
      description: goal.description ?? undefined,
      status: goal.status,
      priority: goal.priority,
      targetDate: toIso(goal.targetDate),
      progress: buildGoalProgress(goalTasks, goal.status),
      tasks: goalTasks,
      createdAt: toIso(goal.createdAt),
      updatedAt: toIso(goal.updatedAt),
    };
  });

  const workspaceApplications: WorkspaceApplication[] = applications.map((application) => ({
    id: application._id.toString(),
    company: application.company,
    role: application.role,
    location: application.location ?? undefined,
    fitScore: application.fitScore ?? undefined,
    status: application.status,
    notes: application.notes ?? undefined,
    source: application.source ?? undefined,
    appliedAt: toIso(application.appliedAt),
    nextActionAt: toIso(application.nextActionAt),
    createdAt: toIso(application.createdAt),
    updatedAt: toIso(application.updatedAt),
  }));

  const derivedGoalEvents: WorkspaceCalendarEvent[] = workspaceGoals
    .filter((goal) => goal.targetDate)
    .map((goal) => ({
      id: `goal-${goal.id}`,
      title: goal.title,
      date: goal.targetDate!,
      type: "goal",
      timeLabel: formatTimeLabel(new Date(goal.targetDate!)),
      detail: goal.description || `${goal.priority} priority goal`,
      relatedEntityType: "goal",
      relatedEntityId: goal.id,
      source: "goal",
    }));

  const derivedTaskEvents: WorkspaceCalendarEvent[] = workspaceTasks
    .filter((task) => task.dueAt)
    .map((task) => ({
      id: `task-${task.id}`,
      title: task.title,
      date: task.dueAt!,
      type: "task",
      timeLabel: formatTimeLabel(new Date(task.dueAt!)),
      detail: task.relatedGoalTitle ? `Task for ${task.relatedGoalTitle}` : task.description || "Task due",
      relatedEntityType: task.relatedEntityType,
      relatedEntityId: task.relatedEntityId,
      source: "task",
    }));

  const applicationEvents: WorkspaceCalendarEvent[] = workspaceApplications
    .filter((application) => application.nextActionAt)
    .map((application) => ({
      id: `application-${application.id}`,
      title: `${application.role} - ${application.company}`,
      date: application.nextActionAt!,
      type: application.status === "interviewing" ? "interview" : "application",
      timeLabel: formatTimeLabel(new Date(application.nextActionAt!)),
      detail: application.notes || `Status: ${application.status}`,
      relatedEntityType: "application",
      relatedEntityId: application.id,
      source: "application",
    }));

  const persistedCalendarEvents: WorkspaceCalendarEvent[] = manualCalendarEvents.map((event) => ({
    id: event._id.toString(),
    title: event.title,
    date: event.startsAt.toISOString(),
    type: event.type as WorkspaceCalendarEvent["type"],
    timeLabel: formatTimeLabel(event.startsAt),
    detail: event.notes || "Calendar event",
    relatedEntityType: event.relatedEntityType ?? undefined,
    relatedEntityId: event.relatedEntityId ?? undefined,
    source: "calendar",
  }));

  const calendarEvents = [...persistedCalendarEvents, ...derivedGoalEvents, ...derivedTaskEvents, ...applicationEvents]
    .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime());

  const completedTaskCount = workspaceTasks.filter((task) => task.status === "completed").length;

  return {
    applications: workspaceApplications,
    goals: workspaceGoals,
    tasks: workspaceTasks,
    calendarEvents,
    stats: {
      applicationCount: workspaceApplications.length,
      interviewCount: workspaceApplications.filter((application) => application.status === "interviewing").length,
      savedCount: workspaceApplications.filter((application) => application.status === "saved").length,
      offerCount: workspaceApplications.filter((application) => application.status === "offer").length,
      rejectedCount: workspaceApplications.filter((application) => application.status === "rejected").length,
      goalCount: workspaceGoals.length,
      todoCount: workspaceTasks.filter((task) => task.status !== "completed" && task.status !== "cancelled").length,
      completedTaskCount,
      resumeReady,
      upcomingEventCount: calendarEvents.filter((event) => new Date(event.date).getTime() >= Date.now()).length,
    },
  };
}

export async function createApplication(userId: string, input: CreateApplicationInput): Promise<WorkspaceApplication> {
  const application = await ApplicationModel.create({
    userId,
    company: input.company,
    role: input.role,
    location: input.location,
    fitScore: input.fitScore,
    status: input.status ?? "saved",
    notes: input.notes,
    source: input.source,
    appliedAt: input.appliedAt ? new Date(input.appliedAt) : undefined,
    nextActionAt: input.nextActionAt ? new Date(input.nextActionAt) : undefined,
  });

  return {
    id: application._id.toString(),
    company: application.company,
    role: application.role,
    location: application.location ?? undefined,
    fitScore: application.fitScore ?? undefined,
    status: application.status,
    notes: application.notes ?? undefined,
    source: application.source ?? undefined,
    appliedAt: toIso(application.appliedAt),
    nextActionAt: toIso(application.nextActionAt),
    createdAt: toIso(application.createdAt),
    updatedAt: toIso(application.updatedAt),
  };
}

export async function updateApplication(
  userId: string,
  applicationId: string,
  input: UpdateApplicationInput,
): Promise<WorkspaceApplication> {
  if (!Types.ObjectId.isValid(applicationId)) {
    throw new HttpError(400, "INVALID_APPLICATION_ID", "Application ID is invalid.");
  }

  const application = await ApplicationModel.findOne({
    _id: applicationId,
    userId,
    deletedAt: { $exists: false },
  });

  if (!application) {
    throw new HttpError(404, "APPLICATION_NOT_FOUND", "Application not found.");
  }

  if (input.company !== undefined) application.company = input.company;
  if (input.role !== undefined) application.role = input.role;
  if (input.location !== undefined) application.location = input.location;
  if (input.fitScore !== undefined) application.fitScore = input.fitScore;
  if (input.status !== undefined) application.status = input.status;
  if (input.notes !== undefined) application.notes = input.notes;
  if (input.source !== undefined) application.source = input.source;
  if (input.appliedAt !== undefined) application.appliedAt = input.appliedAt ? new Date(input.appliedAt) : undefined;
  if (input.nextActionAt !== undefined) {
    application.nextActionAt = input.nextActionAt ? new Date(input.nextActionAt) : undefined;
  }

  await application.save();

  return {
    id: application._id.toString(),
    company: application.company,
    role: application.role,
    location: application.location ?? undefined,
    fitScore: application.fitScore ?? undefined,
    status: application.status,
    notes: application.notes ?? undefined,
    source: application.source ?? undefined,
    appliedAt: toIso(application.appliedAt),
    nextActionAt: toIso(application.nextActionAt),
    createdAt: toIso(application.createdAt),
    updatedAt: toIso(application.updatedAt),
  };
}

export async function createGoal(userId: string, input: CreateGoalInput): Promise<WorkspaceGoal> {
  const goal = await GoalModel.create({
    userId,
    title: input.title,
    description: input.description,
    priority: input.priority ?? "medium",
    status: input.status ?? "not_started",
    targetDate: input.targetDate ? new Date(input.targetDate) : undefined,
  });

  return {
    id: goal._id.toString(),
    title: goal.title,
    description: goal.description ?? undefined,
    status: goal.status,
    priority: goal.priority,
    targetDate: toIso(goal.targetDate),
    progress: buildGoalProgress([], goal.status),
    tasks: [],
    createdAt: toIso(goal.createdAt),
    updatedAt: toIso(goal.updatedAt),
  };
}

export async function updateGoal(userId: string, goalId: string, input: UpdateGoalInput): Promise<WorkspaceGoal> {
  if (!Types.ObjectId.isValid(goalId)) {
    throw new HttpError(400, "INVALID_GOAL_ID", "Goal ID is invalid.");
  }

  const goal = await GoalModel.findOne({ _id: goalId, userId });

  if (!goal) {
    throw new HttpError(404, "GOAL_NOT_FOUND", "Goal not found.");
  }

  if (input.title !== undefined) goal.title = input.title;
  if (input.description !== undefined) goal.description = input.description;
  if (input.priority !== undefined) goal.priority = input.priority;
  if (input.status !== undefined) goal.status = input.status;
  if (input.targetDate !== undefined) goal.targetDate = input.targetDate ? new Date(input.targetDate) : undefined;

  await goal.save();

  const goalTasks = await TaskModel.find({
    userId,
    relatedEntityType: "goal",
    relatedEntityId: goal._id.toString(),
  }).lean();

  const workspaceTasks = goalTasks.map((task) => ({
    id: task._id.toString(),
    title: task.title,
    description: task.description ?? undefined,
    status: task.status,
    priority: task.priority,
    dueAt: toIso(task.dueAt),
    completedAt: toIso(task.completedAt),
    relatedEntityType: task.relatedEntityType ?? undefined,
    relatedEntityId: task.relatedEntityId ?? undefined,
    relatedGoalId: goal._id.toString(),
    relatedGoalTitle: goal.title,
    createdAt: toIso(task.createdAt),
    updatedAt: toIso(task.updatedAt),
  }));

  return {
    id: goal._id.toString(),
    title: goal.title,
    description: goal.description ?? undefined,
    status: goal.status,
    priority: goal.priority,
    targetDate: toIso(goal.targetDate),
    progress: buildGoalProgress(workspaceTasks, goal.status),
    tasks: workspaceTasks,
    createdAt: toIso(goal.createdAt),
    updatedAt: toIso(goal.updatedAt),
  };
}

export async function createTask(userId: string, input: CreateTaskInput): Promise<WorkspaceTask> {
  const task = await TaskModel.create({
    userId,
    title: input.title,
    description: input.description,
    priority: input.priority ?? "medium",
    dueAt: input.dueAt ? new Date(input.dueAt) : undefined,
    relatedEntityType: input.relatedEntityType,
    relatedEntityId: input.relatedEntityId,
  });

  const relatedGoalTitle =
    task.relatedEntityType === "goal" && task.relatedEntityId
      ? (await GoalModel.findOne({ _id: task.relatedEntityId, userId }).select("title").lean())?.title
      : undefined;

  return {
    id: task._id.toString(),
    title: task.title,
    description: task.description ?? undefined,
    status: task.status,
    priority: task.priority,
    dueAt: toIso(task.dueAt),
    completedAt: toIso(task.completedAt),
    relatedEntityType: task.relatedEntityType ?? undefined,
    relatedEntityId: task.relatedEntityId ?? undefined,
    relatedGoalId: task.relatedEntityType === "goal" ? task.relatedEntityId ?? undefined : undefined,
    relatedGoalTitle,
    createdAt: toIso(task.createdAt),
    updatedAt: toIso(task.updatedAt),
  };
}

export async function updateTask(userId: string, taskId: string, input: UpdateTaskInput): Promise<WorkspaceTask> {
  if (!Types.ObjectId.isValid(taskId)) {
    throw new HttpError(400, "INVALID_TASK_ID", "Task ID is invalid.");
  }

  const task = await TaskModel.findOne({ _id: taskId, userId });

  if (!task) {
    throw new HttpError(404, "TASK_NOT_FOUND", "Task not found.");
  }

  if (input.title !== undefined) task.title = input.title;
  if (input.description !== undefined) task.description = input.description;
  if (input.priority !== undefined) task.priority = input.priority;
  if (input.dueAt !== undefined) task.dueAt = input.dueAt ? new Date(input.dueAt) : undefined;
  if (input.status !== undefined) {
    task.status = input.status;
    task.completedAt = input.status === "completed" ? new Date() : undefined;
  }

  await task.save();

  const relatedGoalTitle =
    task.relatedEntityType === "goal" && task.relatedEntityId
      ? (await GoalModel.findOne({ _id: task.relatedEntityId, userId }).select("title").lean())?.title
      : undefined;

  return {
    id: task._id.toString(),
    title: task.title,
    description: task.description ?? undefined,
    status: task.status,
    priority: task.priority,
    dueAt: toIso(task.dueAt),
    completedAt: toIso(task.completedAt),
    relatedEntityType: task.relatedEntityType ?? undefined,
    relatedEntityId: task.relatedEntityId ?? undefined,
    relatedGoalId: task.relatedEntityType === "goal" ? task.relatedEntityId ?? undefined : undefined,
    relatedGoalTitle,
    createdAt: toIso(task.createdAt),
    updatedAt: toIso(task.updatedAt),
  };
}

export async function createCalendarEvent(userId: string, input: CreateCalendarEventInput): Promise<WorkspaceCalendarEvent> {
  const event = await CalendarEventModel.create({
    userId,
    title: input.title,
    type: input.type ?? "other",
    startsAt: new Date(input.startsAt),
    endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
    notes: input.notes,
    relatedEntityType: input.relatedEntityType,
    relatedEntityId: input.relatedEntityId,
  });

  return {
    id: event._id.toString(),
    title: event.title,
    date: event.startsAt.toISOString(),
    type: event.type as WorkspaceCalendarEvent["type"],
    timeLabel: formatTimeLabel(event.startsAt),
    detail: event.notes || "Calendar event",
    relatedEntityType: event.relatedEntityType ?? undefined,
    relatedEntityId: event.relatedEntityId ?? undefined,
    source: "calendar",
  };
}

export async function updateCalendarEvent(
  userId: string,
  eventId: string,
  input: UpdateCalendarEventInput,
): Promise<WorkspaceCalendarEvent> {
  if (!Types.ObjectId.isValid(eventId)) {
    throw new HttpError(400, "INVALID_EVENT_ID", "Calendar event ID is invalid.");
  }

  const event = await CalendarEventModel.findOne({ _id: eventId, userId });

  if (!event) {
    throw new HttpError(404, "CALENDAR_EVENT_NOT_FOUND", "Calendar event not found.");
  }

  if (input.title !== undefined) event.title = input.title;
  if (input.type !== undefined) event.type = input.type;
  if (input.startsAt !== undefined) event.startsAt = new Date(input.startsAt);
  if (input.endsAt !== undefined) event.endsAt = input.endsAt ? new Date(input.endsAt) : undefined;
  if (input.notes !== undefined) event.notes = input.notes;
  if (input.relatedEntityType !== undefined) event.relatedEntityType = input.relatedEntityType;
  if (input.relatedEntityId !== undefined) event.relatedEntityId = input.relatedEntityId;

  await event.save();

  return {
    id: event._id.toString(),
    title: event.title,
    date: event.startsAt.toISOString(),
    type: event.type as WorkspaceCalendarEvent["type"],
    timeLabel: formatTimeLabel(event.startsAt),
    detail: event.notes || "Calendar event",
    relatedEntityType: event.relatedEntityType ?? undefined,
    relatedEntityId: event.relatedEntityId ?? undefined,
    source: "calendar",
  };
}
