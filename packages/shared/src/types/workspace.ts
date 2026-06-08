export type TrackerApplicationStatus =
  | "saved"
  | "applied"
  | "interviewing"
  | "offer"
  | "rejected"
  | "withdrawn";

export type GoalStatus = "not_started" | "in_progress" | "completed" | "paused";

export type GoalPriority = "low" | "medium" | "high";

export type TaskStatus = "todo" | "in_progress" | "completed" | "cancelled";

export type CalendarItemType =
  | "application"
  | "interview"
  | "goal"
  | "task"
  | "deadline"
  | "roadmap"
  | "reminder"
  | "other";

export type WorkspaceApplication = {
  id: string;
  company: string;
  role: string;
  location?: string;
  fitScore?: number;
  status: TrackerApplicationStatus;
  notes?: string;
  source?: string;
  appliedAt?: string;
  nextActionAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type WorkspaceTask = {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: GoalPriority;
  dueAt?: string;
  completedAt?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  relatedGoalId?: string;
  relatedGoalTitle?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type WorkspaceGoal = {
  id: string;
  title: string;
  description?: string;
  status: GoalStatus;
  priority: GoalPriority;
  targetDate?: string;
  progress: number;
  tasks: WorkspaceTask[];
  createdAt?: string;
  updatedAt?: string;
};

export type WorkspaceCalendarEvent = {
  id: string;
  title: string;
  date: string;
  type: CalendarItemType;
  timeLabel: string;
  detail: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  source: "calendar" | "goal" | "task" | "application";
};

export type WorkspaceStats = {
  applicationCount: number;
  interviewCount: number;
  savedCount: number;
  offerCount: number;
  rejectedCount: number;
  goalCount: number;
  todoCount: number;
  completedTaskCount: number;
  resumeReady: boolean;
  upcomingEventCount: number;
};

export type WorkspaceOverviewResponse = {
  applications: WorkspaceApplication[];
  goals: WorkspaceGoal[];
  tasks: WorkspaceTask[];
  calendarEvents: WorkspaceCalendarEvent[];
  stats: WorkspaceStats;
};

export type CreateApplicationInput = {
  company: string;
  role: string;
  location?: string;
  fitScore?: number;
  status?: TrackerApplicationStatus;
  notes?: string;
  source?: string;
  appliedAt?: string;
  nextActionAt?: string;
};

export type UpdateApplicationInput = Partial<CreateApplicationInput> & {
  status?: TrackerApplicationStatus;
};

export type CreateGoalInput = {
  title: string;
  description?: string;
  priority?: GoalPriority;
  status?: GoalStatus;
  targetDate?: string;
};

export type UpdateGoalInput = Partial<CreateGoalInput> & {
  status?: GoalStatus;
};

export type CreateTaskInput = {
  title: string;
  description?: string;
  priority?: GoalPriority;
  dueAt?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
};

export type UpdateTaskInput = Partial<CreateTaskInput> & {
  status?: TaskStatus;
};

export type CreateCalendarEventInput = {
  title: string;
  type?: CalendarItemType;
  startsAt: string;
  endsAt?: string;
  notes?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
};

export type UpdateCalendarEventInput = Partial<CreateCalendarEventInput>;
