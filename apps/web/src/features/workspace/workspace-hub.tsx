import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronRight,
  Circle,
  Clock3,
  Flag,
  MapPin,
  Sparkles,
  Target,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ResumeWorkspace } from "@/features/resume/resume-workspace";
import {
  type ApplicationStatus,
  type CalendarEventType,
  type WorkspaceApplication,
  type WorkspaceGoal,
  type WorkspaceTab,
  workspaceApplications,
  workspaceCalendarEvents,
  workspaceGoals,
  workspaceInsights,
  workspaceSettings,
  workspaceTabs,
} from "@/features/workspace/workspace-data";
import { cn } from "@/lib/utils";

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

function getStatusBadgeVariant(status: ApplicationStatus): "secondary" | "warning" | "success" | "destructive" {
  switch (status) {
    case "offer":
      return "success";
    case "interviewing":
      return "warning";
    case "rejected":
      return "destructive";
    case "saved":
    case "applied":
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

function getEventBadgeVariant(type: CalendarEventType): "secondary" | "warning" | "success" | "destructive" {
  switch (type) {
    case "deadline":
      return "destructive";
    case "interview":
      return "warning";
    case "goal":
    case "roadmap":
      return "success";
    case "task":
    default:
      return "secondary";
  }
}

function getEventLabel(type: CalendarEventType) {
  switch (type) {
    case "deadline":
      return "Deadline";
    case "interview":
      return "Interview";
    case "goal":
      return "Goal";
    case "roadmap":
      return "Roadmap";
    case "task":
    default:
      return "Task";
  }
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
          <p className="text-sm text-muted-foreground">Move between active career workstreams without losing context.</p>
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

function WorkspaceInsightsRow() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {workspaceInsights.map((item) => {
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

function ApplicationsPanel() {
  const columns: Array<{ status: ApplicationStatus; label: string }> = [
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
        <p className="text-sm text-muted-foreground">Keep every role in view, from quick saves to final decision points.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-5">
        {columns.map((column) => {
          const items = workspaceApplications.filter((application) => application.status === column.status);

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
                  items.map((application) => <ApplicationItem key={application.id} application={application} />)
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function ApplicationItem({ application }: { application: WorkspaceApplication }) {
  return (
    <div className="flex flex-col gap-3 rounded-md border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{application.role}</p>
          <p className="truncate text-sm text-muted-foreground">{application.company}</p>
        </div>
        <Badge variant={getStatusBadgeVariant(application.status)}>{application.fitScore}%</Badge>
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <MapPin className="size-3.5" />
          {application.location}
        </span>
        <span className="flex items-center gap-1">
          <Clock3 className="size-3.5" />
          {application.updatedLabel}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{application.notes}</p>
    </div>
  );
}

function GoalsPanel() {
  const overdueGoals = workspaceGoals.filter((goal) => new Date(goal.dueDate).getTime() < Date.now() && goal.progress < 100);
  const upcomingTasks = workspaceGoals.flatMap((goal) =>
    goal.tasks
      .filter((task) => !task.done)
      .map((task) => ({
        goalTitle: goal.title,
        taskTitle: task.title,
        dueDate: goal.dueDate,
      })),
  );

  return (
    <section className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Goals in Motion</h2>
          <p className="text-sm text-muted-foreground">Track momentum, task completion, and deadline pressure in one place.</p>
        </div>
        {workspaceGoals.map((goal) => (
          <Card key={goal.id}>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{goal.title}</CardTitle>
                    <Badge variant={getPriorityBadgeVariant(goal.priority)}>{goal.priority} priority</Badge>
                  </div>
                  <CardDescription>{goal.targetRole}</CardDescription>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Flag className="size-4" />
                  Due {formatShortDate(goal.dueDate)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">Progress</span>
                <span className="text-muted-foreground">{goal.progress}%</span>
              </div>
              <Progress value={goal.progress} />
              <p className="text-sm text-muted-foreground">{goal.summary}</p>
              <Separator />
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium">Task list</p>
                {goal.tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 rounded-md border bg-background px-3 py-2">
                    <div
                      className={cn(
                        "flex size-5 items-center justify-center rounded-full border",
                        task.done ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground",
                      )}
                    >
                      {task.done ? <Check className="size-3" /> : <Circle className="size-3" />}
                    </div>
                    <span className={cn("text-sm", task.done && "text-muted-foreground line-through")}>{task.title}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Deadline Watch</CardTitle>
            <CardDescription>Spot goals that need attention before they slip.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {overdueGoals.length === 0 ? (
              <div className="rounded-md border border-dashed bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
                No overdue goals right now. The board is holding together nicely.
              </div>
            ) : (
              overdueGoals.map((goal) => (
                <div key={goal.id} className="rounded-md border bg-background p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{goal.title}</p>
                    <Badge variant="destructive">Needs attention</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Due {formatShortDate(goal.dueDate)} with {goal.progress}% complete.</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Next Actions</CardTitle>
            <CardDescription>Unfinished tasks sorted for the next focused session.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {upcomingTasks.map((task) => (
              <div key={`${task.goalTitle}-${task.taskTitle}`} className="flex items-start gap-3 rounded-md border bg-background p-4">
                <Target className="mt-0.5 size-4 text-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{task.taskTitle}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {task.goalTitle} - Due {formatShortDate(task.dueDate)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function CalendarPanel() {
  const currentMonth = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }, []);
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
    const events = workspaceCalendarEvents.filter((event) => {
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

  const upcomingEvents = [...workspaceCalendarEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <section className="grid gap-5 xl:grid-cols-[1.35fr_0.75fr]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">{formatMonthLabel(currentMonth)}</h2>
            <p className="text-sm text-muted-foreground">Goals, deadlines, interviews, tasks, and roadmap checkpoints in one month view.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["goal", "task", "deadline", "interview", "roadmap"] as CalendarEventType[]).map((type) => (
              <Badge key={type} variant={getEventBadgeVariant(type)}>
                {getEventLabel(type)}
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
                        event.type === "goal" && "bg-primary/10 text-primary",
                        event.type === "roadmap" && "bg-primary/10 text-primary",
                        event.type === "task" && "bg-secondary text-secondary-foreground",
                      )}
                    >
                      <p className="truncate">{event.timeLabel} - {event.title}</p>
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
            <CardTitle className="text-base">Upcoming Agenda</CardTitle>
            <CardDescription>Use this to prep the week before it crowds you.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-3 rounded-md border bg-background p-4">
                <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <CalendarDays className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{event.title}</p>
                    <Badge variant={getEventBadgeVariant(event.type)}>{getEventLabel(event.type)}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatShortDate(event.date)} - {event.timeLabel}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{event.detail}</p>
                </div>
              </div>
            ))}
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
          <CardDescription>Keep your workspace defaults aligned with the roles you are actually targeting.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="settings-headline">Profile headline</FieldLabel>
              <Input id="settings-headline" defaultValue={workspaceSettings.profileHeadline} />
            </Field>
            <Field>
              <FieldLabel htmlFor="settings-location">Target location</FieldLabel>
              <Input id="settings-location" defaultValue={workspaceSettings.targetLocation} />
            </Field>
            <Field>
              <FieldLabel htmlFor="settings-compensation">Target compensation</FieldLabel>
              <Input id="settings-compensation" defaultValue={workspaceSettings.targetCompensation} />
            </Field>
            <Field>
              <FieldLabel htmlFor="settings-keywords">Default search keywords</FieldLabel>
              <Textarea id="settings-keywords" defaultValue={workspaceSettings.defaultSearchKeywords} />
              <FieldDescription>Used to seed job search and fit score review flows.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="settings-goal">Weekly application goal</FieldLabel>
              <Input id="settings-goal" defaultValue={workspaceSettings.weeklyApplicationGoal} />
            </Field>
            <Field>
              <FieldLabel htmlFor="settings-coaching">Coaching preference</FieldLabel>
              <Textarea id="settings-coaching" defaultValue={workspaceSettings.coachingPreference} />
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-between gap-3">
          <p className="text-sm text-muted-foreground">Placeholder settings surface for future persistence.</p>
          <Button>
            Save preferences
            <ArrowUpRight data-icon="inline-end" />
          </Button>
        </CardFooter>
      </Card>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notifications</CardTitle>
            <CardDescription>Choose which prompts should stay loud enough to help.</CardDescription>
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
            <CardDescription>Choose what stays pinned in your daily command center.</CardDescription>
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
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("resume");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Workspace</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Run resume prep, application tracking, planning, and scheduling from one focused control surface.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1 rounded-md bg-secondary px-3 py-2 text-secondary-foreground">
            <Sparkles className="size-4" />
            Copilot-ready context
          </span>
          <span className="flex items-center gap-1 rounded-md bg-secondary px-3 py-2 text-secondary-foreground">
            <Target className="size-4" />
            Active planning lanes
          </span>
        </div>
      </div>

      <WorkspaceInsightsRow />
      <WorkspaceTabStrip activeTab={activeTab} onChange={setActiveTab} />

      <div aria-labelledby={`workspace-tab-${activeTab}`} id={`workspace-panel-${activeTab}`} role="tabpanel">
        {activeTab === "resume" ? <ResumeWorkspace /> : null}
        {activeTab === "applications" ? <ApplicationsPanel /> : null}
        {activeTab === "goals" ? <GoalsPanel /> : null}
        {activeTab === "calendar" ? <CalendarPanel /> : null}
        {activeTab === "settings" ? <SettingsPanel /> : null}
      </div>

      <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 text-sm shadow-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <BriefcaseBusiness className="size-4" />
          Next suggested flow: update resume wins, then move straight into jobs and fit score review.
        </div>
        <Link className="flex items-center gap-1 font-medium text-primary" to="/dashboard/jobs">
          Open jobs
          <ChevronRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
