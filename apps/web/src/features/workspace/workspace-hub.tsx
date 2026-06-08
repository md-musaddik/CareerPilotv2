import { FormEvent, useMemo, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  Circle,
  Clock3,
  FileText,
  Plus,
  Sparkles,
  Target,
  UploadCloud,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ResumeWorkspace } from "@/features/resume/resume-workspace";
import {
  useCreateApplication,
  useCreateCalendarEvent,
  useCreateGoal,
  useCreateGoalTask,
  useUpdateApplication,
  useUpdateTask,
  useWorkspaceOverview,
} from "@/features/workspace/use-workspace";
import type {
  CalendarItemType,
  TrackerApplicationStatus,
  WorkspaceApplication,
  WorkspaceCalendarEvent,
  WorkspaceGoal,
  WorkspaceTask,
} from "@/features/workspace/types";
import { workspaceSettings, workspaceTabs, type WorkspaceTab } from "@/features/workspace/workspace-data";
import { cn } from "@/lib/utils";

const applicationStatuses: TrackerApplicationStatus[] = ["saved", "applied", "interviewing", "offer", "rejected"];

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(date);
}

function getDaysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getStartOffset(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

function toDateTimeInputValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function fromDateTimeInputValue(value: string): string | undefined {
  if (!value) {
    return undefined;
  }

  return new Date(value).toISOString();
}

function getStatusBadgeVariant(status: TrackerApplicationStatus): "secondary" | "warning" | "success" | "destructive" {
  switch (status) {
    case "offer":
      return "success";
    case "interviewing":
      return "warning";
    case "rejected":
      return "destructive";
    case "saved":
    case "applied":
    case "withdrawn":
    default:
      return "secondary";
  }
}

function getPriorityBadgeVariant(priority: WorkspaceGoal["priority"]): "success" | "warning" | "destructive" {
  switch (priority) {
    case "high":
      return "destructive";
    case "medium":
      return "warning";
    case "low":
    default:
      return "success";
  }
}

function getEventBadgeVariant(type: CalendarItemType): "secondary" | "warning" | "success" | "destructive" {
  switch (type) {
    case "interview":
      return "warning";
    case "goal":
    case "roadmap":
      return "success";
    case "deadline":
      return "destructive";
    case "task":
    case "application":
    case "reminder":
    case "other":
    default:
      return "secondary";
  }
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-24" />
      <Skeleton className="h-[40rem]" />
    </div>
  );
}

function WorkspaceTabStrip({
  activeTab,
  onChange,
}: {
  activeTab: WorkspaceTab;
  onChange: (tab: WorkspaceTab) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Workspace Areas</h2>
          <p className="text-sm text-muted-foreground">Resume, applications, goals, calendar, and settings now share the same live data flow.</p>
        </div>
      </div>
      <div aria-label="Workspace tabs" className="flex gap-2 overflow-x-auto pb-1" role="tablist">
        {workspaceTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              aria-controls={`workspace-panel-${tab.id}`}
              aria-selected={isActive}
              className={cn(
                "flex min-w-[13rem] shrink-0 flex-col items-start gap-2 rounded-lg border bg-card px-4 py-3 text-left text-card-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive && "border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              )}
              id={`workspace-tab-${tab.id}`}
              role="tab"
              tabIndex={isActive ? 0 : -1}
              type="button"
              onClick={() => onChange(tab.id)}
            >
              <div className="flex items-center gap-2">
                <Icon />
                <span className="text-sm font-semibold">{tab.label}</span>
              </div>
              <p className={cn("text-xs text-muted-foreground", isActive && "text-primary-foreground/80")}>{tab.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WorkspaceInsightsRow({
  applications,
  goals,
  stats,
}: {
  applications: WorkspaceApplication[];
  goals: WorkspaceGoal[];
  stats: {
    applicationCount: number;
    interviewCount: number;
    goalCount: number;
    todoCount: number;
    resumeReady: boolean;
    upcomingEventCount: number;
  };
}) {
  const items = [
    {
      label: "Tracked applications",
      value: String(stats.applicationCount),
      helper: `${stats.interviewCount} interview track${stats.interviewCount === 1 ? "" : "s"} active`,
      icon: BriefcaseBusiness,
    },
    {
      label: "Goals in motion",
      value: String(stats.goalCount),
      helper: goals.length > 0 ? `${goals.filter((goal) => goal.progress >= 60).length} goals moving well` : "Create your first goal",
      icon: Target,
    },
    {
      label: "Upcoming events",
      value: String(stats.upcomingEventCount),
      helper: `${stats.todoCount} open to-dos linked to goals and deadlines`,
      icon: CalendarDays,
    },
    {
      label: "Resume readiness",
      value: stats.resumeReady ? "Ready" : "Pending",
      helper: stats.resumeReady ? "AI Assistant and fit score grounded in your CV" : "Upload a CV to unlock grounded guidance",
      icon: FileText,
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label}>
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <CardDescription>{item.label}</CardDescription>
                <CardTitle className="text-2xl">{item.value}</CardTitle>
              </div>
              <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.helper}</p>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}

function ApplicationCard({
  application,
  isUpdating,
  onMove,
}: {
  application: WorkspaceApplication;
  isUpdating: boolean;
  onMove: (status: TrackerApplicationStatus) => void;
}) {
  const currentIndex = applicationStatuses.indexOf(application.status);

  return (
    <div className="flex flex-col gap-3 rounded-md border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{application.role}</p>
          <p className="truncate text-sm text-muted-foreground">{application.company}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {typeof application.fitScore === "number" ? <Badge variant="success">{application.fitScore}% fit</Badge> : null}
          <Badge variant={getStatusBadgeVariant(application.status)}>{application.status}</Badge>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {application.location ? (
          <span className="flex items-center gap-1">
            <BriefcaseBusiness className="size-3.5" />
            {application.location}
          </span>
        ) : null}
        {application.nextActionAt ? (
          <span className="flex items-center gap-1">
            <Clock3 className="size-3.5" />
            Next action {formatShortDate(application.nextActionAt)}
          </span>
        ) : null}
      </div>
      <p className="text-sm text-muted-foreground">{application.notes || "No notes yet."}</p>
      <div className="flex flex-wrap gap-2">
        {applicationStatuses.map((status, index) => (
          <Button
            key={status}
            disabled={isUpdating || index === currentIndex}
            size="sm"
            type="button"
            variant={index === currentIndex ? "default" : "outline"}
            onClick={() => onMove(status)}
          >
            {status}
          </Button>
        ))}
      </div>
    </div>
  );
}

function ApplicationsPanel({
  applications,
  isUpdating,
  onMove,
}: {
  applications: WorkspaceApplication[];
  isUpdating: boolean;
  onMove: (applicationId: string, status: TrackerApplicationStatus) => void;
}) {
  const columns: Array<{ status: TrackerApplicationStatus; label: string }> = [
    { status: "saved", label: "Saved" },
    { status: "applied", label: "Applied" },
    { status: "interviewing", label: "Interviewing" },
    { status: "offer", label: "Offer" },
    { status: "rejected", label: "Rejected" },
  ];

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Application Board</h2>
        <p className="text-sm text-muted-foreground">
          This kanban is now live. Track roles from Saved through Offer by updating status directly on the cards.
        </p>
      </div>
      <div className="grid gap-4 xl:grid-cols-5">
        {columns.map((column) => {
          const items = applications.filter((application) => application.status === column.status);

          return (
            <Card key={column.status} className="min-h-[28rem]">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{column.label}</CardTitle>
                    <CardDescription>{items.length} roles</CardDescription>
                  </div>
                  <Badge variant={getStatusBadgeVariant(column.status)}>{items.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {items.length === 0 ? (
                  <div className="flex min-h-32 items-center justify-center rounded-md border border-dashed bg-muted/40 px-4 text-center text-sm text-muted-foreground">
                    No roles in this lane yet.
                  </div>
                ) : (
                  items.map((application) => (
                    <ApplicationCard
                      key={application.id}
                      application={application}
                      isUpdating={isUpdating}
                      onMove={(status) => onMove(application.id, status)}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function GoalsPanel({
  goals,
  tasks,
  isCreatingGoal,
  isCreatingTask,
  isUpdatingTask,
  onCreateGoal,
  onCreateTask,
  onToggleTask,
}: {
  goals: WorkspaceGoal[];
  tasks: WorkspaceTask[];
  isCreatingGoal: boolean;
  isCreatingTask: boolean;
  isUpdatingTask: boolean;
  onCreateGoal: (payload: { title: string; description: string; targetDate: string; priority: WorkspaceGoal["priority"] }) => Promise<void>;
  onCreateTask: (goalId: string, payload: { title: string; dueAt?: string }) => Promise<void>;
  onToggleTask: (task: WorkspaceTask) => Promise<void>;
}) {
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [goalTargetDate, setGoalTargetDate] = useState(toDateTimeInputValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)));
  const [goalPriority, setGoalPriority] = useState<WorkspaceGoal["priority"]>("medium");
  const [taskDrafts, setTaskDrafts] = useState<Record<string, string>>({});

  const openTasks = tasks.filter((task) => task.status !== "completed" && task.status !== "cancelled");

  async function handleGoalSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!goalTitle.trim()) {
      return;
    }

    await onCreateGoal({
      title: goalTitle.trim(),
      description: goalDescription.trim(),
      targetDate: fromDateTimeInputValue(goalTargetDate) ?? "",
      priority: goalPriority,
    });

    setGoalTitle("");
    setGoalDescription("");
  }

  async function handleTaskSubmit(event: FormEvent<HTMLFormElement>, goalId: string) {
    event.preventDefault();
    const title = taskDrafts[goalId]?.trim();
    if (!title) {
      return;
    }

    await onCreateTask(goalId, { title });
    setTaskDrafts((current) => ({ ...current, [goalId]: "" }));
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Goals and To-Do</h2>
          <p className="text-sm text-muted-foreground">Goals now compute progress from real linked tasks, and the to-do list is actionable.</p>
        </div>
        {goals.length === 0 ? (
          <Card>
            <CardContent className="flex min-h-56 items-center justify-center rounded-md text-center text-sm text-muted-foreground">
              Create your first goal to start tracking progress, deadlines, and tasks.
            </CardContent>
          </Card>
        ) : (
          goals.map((goal) => (
            <Card key={goal.id}>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{goal.title}</CardTitle>
                      <Badge variant={getPriorityBadgeVariant(goal.priority)}>{goal.priority} priority</Badge>
                    </div>
                    <CardDescription>{goal.description || "No goal description yet."}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Target className="size-4" />
                    {goal.targetDate ? `Due ${formatShortDate(goal.targetDate)}` : "No deadline"}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium">Progress</span>
                  <span className="text-muted-foreground">{goal.progress}%</span>
                </div>
                <Progress value={goal.progress} />
                <Separator />
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-medium">Tasks</p>
                  {goal.tasks.length === 0 ? (
                    <div className="rounded-md border border-dashed bg-muted/40 px-4 py-4 text-sm text-muted-foreground">
                      No tasks yet. Add the next action below.
                    </div>
                  ) : (
                    goal.tasks.map((task) => (
                      <button
                        key={task.id}
                        className="flex items-center gap-3 rounded-md border bg-background px-3 py-2 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
                        disabled={isUpdatingTask}
                        type="button"
                        onClick={() => onToggleTask(task)}
                      >
                        <div
                          className={cn(
                            "flex size-5 items-center justify-center rounded-full border",
                            task.status === "completed"
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border text-muted-foreground",
                          )}
                        >
                          {task.status === "completed" ? <Check className="size-3" /> : <Circle className="size-3" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className={cn("text-sm", task.status === "completed" && "text-muted-foreground line-through")}>
                            {task.title}
                          </span>
                          {task.dueAt ? <p className="mt-1 text-xs text-muted-foreground">Due {formatShortDate(task.dueAt)}</p> : null}
                        </div>
                      </button>
                    ))
                  )}
                </div>
                <form className="flex gap-2" onSubmit={(event) => void handleTaskSubmit(event, goal.id)}>
                  <Input
                    placeholder="Add a task for this goal"
                    value={taskDrafts[goal.id] ?? ""}
                    onChange={(event) => setTaskDrafts((current) => ({ ...current, [goal.id]: event.target.value }))}
                  />
                  <Button disabled={isCreatingTask || !(taskDrafts[goal.id] ?? "").trim()} type="submit" variant="outline">
                    <Plus />
                    Add
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create Goal</CardTitle>
            <CardDescription>Add a goal with a deadline and start building tasks against it.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-3" onSubmit={(event) => void handleGoalSubmit(event)}>
              <Input placeholder="Goal title" value={goalTitle} onChange={(event) => setGoalTitle(event.target.value)} />
              <Textarea
                placeholder="What does success look like?"
                value={goalDescription}
                onChange={(event) => setGoalDescription(event.target.value)}
              />
              <Input type="datetime-local" value={goalTargetDate} onChange={(event) => setGoalTargetDate(event.target.value)} />
              <div className="flex flex-wrap gap-2">
                {(["low", "medium", "high"] as const).map((priority) => (
                  <Button
                    key={priority}
                    size="sm"
                    type="button"
                    variant={goalPriority === priority ? "default" : "outline"}
                    onClick={() => setGoalPriority(priority)}
                  >
                    {priority}
                  </Button>
                ))}
              </div>
              <Button disabled={isCreatingGoal || goalTitle.trim().length < 2} type="submit">
                <Plus />
                Create goal
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Open To-Do</CardTitle>
            <CardDescription>Every incomplete task tied to your goals, in one place.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {openTasks.length === 0 ? (
              <div className="rounded-md border border-dashed bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
                No open tasks right now. Add a goal or mark the next task to keep momentum.
              </div>
            ) : (
              openTasks.map((task) => (
                <div key={task.id} className="rounded-md border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {task.relatedGoalTitle ?? "Standalone task"}
                        {task.dueAt ? ` - Due ${formatShortDate(task.dueAt)}` : ""}
                      </p>
                    </div>
                    <Badge variant={task.priority === "high" ? "destructive" : task.priority === "medium" ? "warning" : "secondary"}>
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function CalendarPanel({
  calendarEvents,
  isCreatingEvent,
  isCreatingGoal,
  onCreateEvent,
  onCreateGoalFromCalendar,
}: {
  calendarEvents: WorkspaceCalendarEvent[];
  isCreatingEvent: boolean;
  isCreatingGoal: boolean;
  onCreateEvent: (payload: { title: string; type: CalendarItemType; startsAt: string; notes: string }) => Promise<void>;
  onCreateGoalFromCalendar: (payload: { title: string; targetDate: string }) => Promise<void>;
}) {
  const currentMonth = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }, []);

  const [eventTitle, setEventTitle] = useState("");
  const [eventNotes, setEventNotes] = useState("");
  const [eventType, setEventType] = useState<CalendarItemType>("other");
  const [eventStartsAt, setEventStartsAt] = useState(toDateTimeInputValue(new Date()));
  const [calendarGoalTitle, setCalendarGoalTitle] = useState("");
  const [calendarGoalDate, setCalendarGoalDate] = useState(toDateTimeInputValue(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)));

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const totalDays = getDaysInMonth(currentMonth);
  const startOffset = getStartOffset(currentMonth);
  const cells = Array.from({ length: 42 }, (_, index) => {
    const dayNumber = index - startOffset + 1;
    if (dayNumber < 1 || dayNumber > totalDays) {
      return null;
    }

    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNumber);
    const iso = date.toISOString();
    const events = calendarEvents.filter((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });

    return {
      dayNumber,
      iso,
      events,
    };
  });

  const upcomingEvents = calendarEvents
    .filter((event) => new Date(event.date).getTime() >= Date.now())
    .slice(0, 8);

  async function handleEventSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!eventTitle.trim()) {
      return;
    }

    await onCreateEvent({
      title: eventTitle.trim(),
      type: eventType,
      startsAt: fromDateTimeInputValue(eventStartsAt) ?? new Date().toISOString(),
      notes: eventNotes.trim(),
    });

    setEventTitle("");
    setEventNotes("");
  }

  async function handleCalendarGoalSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!calendarGoalTitle.trim()) {
      return;
    }

    await onCreateGoalFromCalendar({
      title: calendarGoalTitle.trim(),
      targetDate: fromDateTimeInputValue(calendarGoalDate) ?? new Date().toISOString(),
    });

    setCalendarGoalTitle("");
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[1.35fr_0.75fr]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">{formatMonthLabel(currentMonth)}</h2>
            <p className="text-sm text-muted-foreground">Real goals, tasks, deadlines, interviews, and calendar events all appear together here.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["goal", "task", "deadline", "interview", "roadmap"] as CalendarItemType[]).map((type) => (
              <Badge key={type} variant={getEventBadgeVariant(type)}>
                {type}
              </Badge>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2 text-xs font-medium text-muted-foreground">
          {dayLabels.map((label) => (
            <div key={label} className="px-2 py-1">
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {cells.map((cell, index) =>
            cell ? (
              <div key={cell.iso} className="flex min-h-[8.5rem] flex-col gap-2 rounded-lg border bg-card p-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{cell.dayNumber}</span>
                  {cell.events.length > 0 ? <Badge variant="secondary">{cell.events.length}</Badge> : null}
                </div>
                <div className="flex flex-col gap-1.5">
                  {cell.events.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        "rounded-md px-2 py-1 text-[11px] font-medium",
                        event.type === "deadline" && "bg-destructive/10 text-destructive",
                        event.type === "interview" && "bg-accent/20 text-accent-foreground",
                        (event.type === "goal" || event.type === "roadmap") && "bg-primary/10 text-primary",
                        event.type === "task" && "bg-secondary text-secondary-foreground",
                      )}
                    >
                      <p className="truncate">
                        {event.timeLabel} - {event.title}
                      </p>
                    </div>
                  ))}
                  {cell.events.length > 2 ? <p className="text-[11px] text-muted-foreground">+{cell.events.length - 2} more</p> : null}
                </div>
              </div>
            ) : (
              <div key={`empty-${index}`} className="min-h-[8.5rem] rounded-lg border border-dashed bg-muted/20" />
            ),
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add Calendar Item</CardTitle>
            <CardDescription>Create a manual event that should appear alongside goals and tasks.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-3" onSubmit={(event) => void handleEventSubmit(event)}>
              <Input placeholder="Event title" value={eventTitle} onChange={(event) => setEventTitle(event.target.value)} />
              <Input type="datetime-local" value={eventStartsAt} onChange={(event) => setEventStartsAt(event.target.value)} />
              <div className="flex flex-wrap gap-2">
                {(["other", "interview", "deadline", "roadmap"] as CalendarItemType[]).map((type) => (
                  <Button
                    key={type}
                    size="sm"
                    type="button"
                    variant={eventType === type ? "default" : "outline"}
                    onClick={() => setEventType(type)}
                  >
                    {type}
                  </Button>
                ))}
              </div>
              <Textarea placeholder="Notes or context" value={eventNotes} onChange={(event) => setEventNotes(event.target.value)} />
              <Button disabled={isCreatingEvent || eventTitle.trim().length < 2} type="submit">
                <Plus />
                Add event
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Set Goal From Calendar</CardTitle>
            <CardDescription>Create a goal with a real deadline directly from the calendar surface.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-3" onSubmit={(event) => void handleCalendarGoalSubmit(event)}>
              <Input placeholder="Goal title" value={calendarGoalTitle} onChange={(event) => setCalendarGoalTitle(event.target.value)} />
              <Input type="datetime-local" value={calendarGoalDate} onChange={(event) => setCalendarGoalDate(event.target.value)} />
              <Button disabled={isCreatingGoal || calendarGoalTitle.trim().length < 2} type="submit" variant="outline">
                <Target />
                Create goal
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming Agenda</CardTitle>
            <CardDescription>Use this list to prep the week before it gets crowded.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {upcomingEvents.length === 0 ? (
              <div className="rounded-md border border-dashed bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
                No upcoming events yet.
              </div>
            ) : (
              upcomingEvents.map((event) => (
                <div key={event.id} className="rounded-md border bg-background p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{event.title}</p>
                    <Badge variant={getEventBadgeVariant(event.type)}>{event.type}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatShortDate(event.date)} - {event.timeLabel}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{event.detail}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function SettingsPanel() {
  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Career Preferences</CardTitle>
          <CardDescription>Placeholder preferences surface. This can be persisted in a later pass without touching the live tracker data.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="settings-headline">Profile headline</FieldLabel>
              <Input defaultValue={workspaceSettings.profileHeadline} id="settings-headline" />
            </Field>
            <Field>
              <FieldLabel htmlFor="settings-location">Target location</FieldLabel>
              <Input defaultValue={workspaceSettings.targetLocation} id="settings-location" />
            </Field>
            <Field>
              <FieldLabel htmlFor="settings-compensation">Target compensation</FieldLabel>
              <Input defaultValue={workspaceSettings.targetCompensation} id="settings-compensation" />
            </Field>
            <Field>
              <FieldLabel htmlFor="settings-keywords">Default search keywords</FieldLabel>
              <Textarea defaultValue={workspaceSettings.defaultSearchKeywords} id="settings-keywords" />
              <FieldDescription>Used to seed job search and fit review.</FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notifications</CardTitle>
            <CardDescription>Keep the guidance loud enough to help without adding clutter.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {workspaceSettings.notifications.map((item) => (
              <label key={item.id} className="flex items-start gap-3 rounded-md border bg-background p-4">
                <input className="mt-1 size-4 accent-[hsl(var(--primary))]" defaultChecked={item.checked} type="checkbox" />
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Placeholder preference toggle.</p>
                </div>
              </label>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workspace Visibility</CardTitle>
            <CardDescription>Control what stays surfaced in your command center.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {workspaceSettings.visibility.map((item) => (
              <label key={item.id} className="flex items-start gap-3 rounded-md border bg-background p-4">
                <input className="mt-1 size-4 accent-[hsl(var(--primary))]" defaultChecked={item.checked} type="checkbox" />
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Placeholder layout preference.</p>
                </div>
              </label>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export function WorkspaceHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = (searchParams.get("tab") as WorkspaceTab | null) ?? "resume";
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(defaultTab);
  const focusArea = searchParams.get("focus");
  const workspaceOverviewQuery = useWorkspaceOverview();
  const createGoal = useCreateGoal();
  const createGoalTask = useCreateGoalTask();
  const updateTask = useUpdateTask();
  const updateApplication = useUpdateApplication();
  const createCalendarEvent = useCreateCalendarEvent();

  const overview = workspaceOverviewQuery.data;
  const applications = overview?.applications ?? [];
  const goals = overview?.goals ?? [];
  const tasks = overview?.tasks ?? [];
  const calendarEvents = overview?.calendarEvents ?? [];
  const stats = overview?.stats ?? {
    applicationCount: 0,
    interviewCount: 0,
    savedCount: 0,
    offerCount: 0,
    rejectedCount: 0,
    goalCount: 0,
    todoCount: 0,
    completedTaskCount: 0,
    resumeReady: false,
    upcomingEventCount: 0,
  };

  function handleTabChange(tab: WorkspaceTab) {
    setActiveTab(tab);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", tab);
    if (tab !== "resume" && nextParams.get("focus") === "resume-upload") {
      nextParams.delete("focus");
    }
    setSearchParams(nextParams);
  }

  if (workspaceOverviewQuery.isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Workspace</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track resume readiness, applications, goals, tasks, and deadlines from one live operational surface.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => {
              const nextParams = new URLSearchParams(searchParams);
              nextParams.set("tab", "resume");
              nextParams.set("focus", "resume-upload");
              setSearchParams(nextParams);
              setActiveTab("resume");
            }}
          >
            <UploadCloud data-icon="inline-start" />
            Upload CV
          </Button>
          <Button asChild variant="outline">
            <Link to="/dashboard/jobs">
              Open jobs
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/dashboard/assistant">
              Ask AI Assistant
              <Sparkles data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </div>

      {workspaceOverviewQuery.error ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workspace data is unavailable</CardTitle>
            <CardDescription>{getErrorMessage(workspaceOverviewQuery.error)}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <WorkspaceInsightsRow applications={applications} goals={goals} stats={stats} />
      <WorkspaceTabStrip activeTab={activeTab} onChange={handleTabChange} />

      <div aria-labelledby={`workspace-tab-${activeTab}`} id={`workspace-panel-${activeTab}`} role="tabpanel">
        {activeTab === "resume" ? <ResumeWorkspace highlightUpload={focusArea === "resume-upload"} /> : null}
        {activeTab === "applications" ? (
          <ApplicationsPanel
            applications={applications}
            isUpdating={updateApplication.isPending}
            onMove={(applicationId, status) => {
              void updateApplication.mutateAsync({ applicationId, payload: { status } });
            }}
          />
        ) : null}
        {activeTab === "goals" ? (
          <GoalsPanel
            goals={goals}
            tasks={tasks}
            isCreatingGoal={createGoal.isPending}
            isCreatingTask={createGoalTask.isPending}
            isUpdatingTask={updateTask.isPending}
            onCreateGoal={async (payload) => {
              await createGoal.mutateAsync({
                title: payload.title,
                description: payload.description,
                priority: payload.priority,
                targetDate: payload.targetDate || undefined,
                status: "in_progress",
              });
            }}
            onCreateTask={async (goalId, payload) => {
              await createGoalTask.mutateAsync({
                goalId,
                payload: {
                  title: payload.title,
                  dueAt: payload.dueAt,
                },
              });
            }}
            onToggleTask={async (task) => {
              await updateTask.mutateAsync({
                taskId: task.id,
                payload: {
                  status: task.status === "completed" ? "todo" : "completed",
                },
              });
            }}
          />
        ) : null}
        {activeTab === "calendar" ? (
          <CalendarPanel
            calendarEvents={calendarEvents}
            isCreatingEvent={createCalendarEvent.isPending}
            isCreatingGoal={createGoal.isPending}
            onCreateEvent={async (payload) => {
              await createCalendarEvent.mutateAsync(payload);
            }}
            onCreateGoalFromCalendar={async (payload) => {
              await createGoal.mutateAsync({
                title: payload.title,
                priority: "medium",
                status: "in_progress",
                targetDate: payload.targetDate,
              });
            }}
          />
        ) : null}
        {activeTab === "settings" ? <SettingsPanel /> : null}
      </div>
    </div>
  );
}
