import { z } from "zod";

const objectIdSchema = z.string().trim().min(1);
const isoDateSchema = z.string().datetime().optional();

export const createApplicationSchema = {
  body: z.object({
    company: z.string().trim().min(1).max(160),
    role: z.string().trim().min(1).max(160),
    location: z.string().trim().max(160).optional(),
    fitScore: z.number().min(0).max(100).optional(),
    status: z.enum(["saved", "applied", "interviewing", "offer", "rejected", "withdrawn"]).optional(),
    notes: z.string().trim().max(2000).optional(),
    source: z.string().trim().max(120).optional(),
    appliedAt: isoDateSchema,
    nextActionAt: isoDateSchema,
  }),
};

export const updateApplicationSchema = {
  params: z.object({
    applicationId: objectIdSchema,
  }),
  body: z.object({
    company: z.string().trim().min(1).max(160).optional(),
    role: z.string().trim().min(1).max(160).optional(),
    location: z.string().trim().max(160).optional(),
    fitScore: z.number().min(0).max(100).optional(),
    status: z.enum(["saved", "applied", "interviewing", "offer", "rejected", "withdrawn"]).optional(),
    notes: z.string().trim().max(2000).optional(),
    source: z.string().trim().max(120).optional(),
    appliedAt: isoDateSchema,
    nextActionAt: isoDateSchema,
  }),
};

export const createGoalSchema = {
  body: z.object({
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().max(2000).optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    status: z.enum(["not_started", "in_progress", "completed", "paused"]).optional(),
    targetDate: isoDateSchema,
  }),
};

export const updateGoalSchema = {
  params: z.object({
    goalId: objectIdSchema,
  }),
  body: z.object({
    title: z.string().trim().min(1).max(160).optional(),
    description: z.string().trim().max(2000).optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    status: z.enum(["not_started", "in_progress", "completed", "paused"]).optional(),
    targetDate: isoDateSchema,
  }),
};

export const createTaskSchema = {
  body: z.object({
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().max(2000).optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    dueAt: isoDateSchema,
    relatedEntityType: z.string().trim().max(80).optional(),
    relatedEntityId: z.string().trim().max(80).optional(),
  }),
};

export const createGoalTaskSchema = {
  params: z.object({
    goalId: objectIdSchema,
  }),
  body: z.object({
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().max(2000).optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    dueAt: isoDateSchema,
  }),
};

export const updateTaskSchema = {
  params: z.object({
    taskId: objectIdSchema,
  }),
  body: z.object({
    title: z.string().trim().min(1).max(160).optional(),
    description: z.string().trim().max(2000).optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    dueAt: isoDateSchema,
    status: z.enum(["todo", "in_progress", "completed", "cancelled"]).optional(),
  }),
};

export const createCalendarEventSchema = {
  body: z.object({
    title: z.string().trim().min(1).max(160),
    type: z.enum(["application", "interview", "goal", "task", "deadline", "roadmap", "reminder", "other"]).optional(),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime().optional(),
    notes: z.string().trim().max(2000).optional(),
    relatedEntityType: z.string().trim().max(80).optional(),
    relatedEntityId: z.string().trim().max(80).optional(),
  }),
};

export const updateCalendarEventSchema = {
  params: z.object({
    eventId: objectIdSchema,
  }),
  body: z.object({
    title: z.string().trim().min(1).max(160).optional(),
    type: z.enum(["application", "interview", "goal", "task", "deadline", "roadmap", "reminder", "other"]).optional(),
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().optional(),
    notes: z.string().trim().max(2000).optional(),
    relatedEntityType: z.string().trim().max(80).optional(),
    relatedEntityId: z.string().trim().max(80).optional(),
  }),
};
