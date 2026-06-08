import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileCheck2,
  Sparkles,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentResume } from "@/features/resume/use-resume";
import { calculateResumeStrength } from "@/features/resume/resume-strength";
import {
  workspaceApplications,
  workspaceCalendarEvents,
  workspaceGoals,
} from "@/features/workspace/workspace-data";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to load dashboard context.";
}

function DashboardLoadingState() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Skeleton className="h-[28rem]" />
        <Skeleton className="h-[28rem]" />
      </div>
    </div>
  );
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function averageFitScore() {
  if (workspaceApplications.length === 0) {
    return 0;
  }

  return Math.round(
    workspaceApplications.reduce((sum, item) => sum + item.fitScore, 0) / workspaceApplications.length,
  );
}

function createInsights(resumeScore: number | null) {
  const interviewingCount = workspaceApplications.filter((item) => item.status === "interviewing").length;
  const savedCount = workspaceApplications.filter((item) => item.status === "saved").length;
  const upcomingInterview = workspaceCalendarEvents.find((event) => event.type === "interview");
  const lowestGoal = [...workspaceGoals].sort((left, right) => left.progress - right.progress)[0];

  return [
    {
      title: "Resume Signal",
      icon: FileCheck2,
      tone: resumeScore !== null && resumeScore >= 75 ? "success" : "warning",
      summary:
        resumeScore !== null && resumeScore >= 75
          ? `Your resume strength score is ${resumeScore}. The profile is solid enough to support targeted applications.`
          : `Your resume strength score is ${resumeScore ?? 0}. Add more quantified evidence before wider outreach.`,
      actionLabel: "Open resume workspace",
      href: "/dashboard/workspace",
    },
    {
      title: "Interview Readiness",
      icon: Bot,
      tone: interviewingCount > 0 ? "warning" : "secondary",
      summary: upcomingInterview
        ? `${interviewingCount} interview track${interviewingCount > 1 ? "s" : ""} active. Next milestone: ${upcomingInterview.title} on ${formatShortDate(upcomingInterview.date)}.`
        : "No interview events on the calendar yet. Use Copilot to rehearse before they appear.",
      actionLabel: "Open interview coach",
      href: "/dashboard/copilot",
    },
    {
      title: "Pipeline Momentum",
      icon: BriefcaseBusiness,
      tone: savedCount > 1 ? "warning" : "success",
      summary:
        savedCount > 1
          ? `${savedCount} roles are still sitting in Saved. Move one or two forward while the fit is fresh.`
          : "Your pipeline is moving. Most active roles have already crossed into applied or interview stages.",
      actionLabel: "Review applications",
      href: "/dashboard/workspace",
    },
    {
      title: "Goal Pressure",
      icon: Target,
      tone: lowestGoal.progress < 50 ? "warning" : "success",
      summary:
        lowestGoal.progress < 50
          ? `${lowestGoal.title} is only ${lowestGoal.progress}% complete. Tighten the next tasks before the deadline catches up.`
          : "Goal progress looks steady. Keep the current cadence and protect the calendar blocks already in place.",
      actionLabel: "Review goals",
      href: "/dashboard/workspace",
    },
  ] as const;
}

export function DashboardOverview() {
  const currentResumeQuery = useCurrentResume();

  if (currentResumeQuery.isLoading) {
    return <DashboardLoadingState />;
  }

  const resume = currentResumeQuery.data?.resume ?? null;
  const resumeStrength = resume ? calculateResumeStrength(resume.parsedResume.editableProfile) : null;
  const interviewTracks = workspaceApplications.filter((item) => item.status === "interviewing").length;
  const completedTasks = workspaceGoals.reduce(
    (sum, goal) => sum + goal.tasks.filter((task) => task.done).length,
    0,
  );
  const totalTasks = workspaceGoals.reduce((sum, goal) => sum + goal.tasks.length, 0);
  const insights = createInsights(resumeStrength?.score ?? null);
  const applicationStatusCounts = [
    { label: "Saved", count: workspaceApplications.filter((item) => item.status === "saved").length },
    { label: "Applied", count: workspaceApplications.filter((item) => item.status === "applied").length },
    { label: "Interviewing", count: workspaceApplications.filter((item) => item.status === "interviewing").length },
    { label: "Offer", count: workspaceApplications.filter((item) => item.status === "offer").length },
    { label: "Rejected", count: workspaceApplications.filter((item) => item.status === "rejected").length },
  ];

  const analyticsCards = [
    {
      label: "Resume Strength",
      value: resumeStrength ? `${resumeStrength.score}` : "--",
      helper: resumeStrength ? `Grade ${resumeStrength.grade}` : "Upload a resume to score it",
      icon: FileCheck2,
    },
    {
      label: "Average Fit Score",
      value: `${averageFitScore()}%`,
      helper: "Across active application samples",
      icon: Sparkles,
    },
    {
      label: "Interview Tracks",
      value: `${interviewTracks}`,
      helper: interviewTracks > 0 ? "Live practice pressure is real" : "No live loops yet",
      icon: Bot,
    },
    {
      label: "Task Completion",
      value: `${Math.round((completedTasks / Math.max(totalTasks, 1)) * 100)}%`,
      helper: `${completedTasks} of ${totalTasks} goal tasks done`,
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A fast read on resume quality, pipeline health, upcoming interviews, and the next best move.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/dashboard/workspace">
              Open workspace
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
          <Button asChild>
            <Link to="/dashboard/copilot">
              Open Copilot
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </section>

      {currentResumeQuery.error ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CircleAlert className="text-destructive" />
              <CardTitle className="text-base">Resume context unavailable</CardTitle>
            </div>
            <CardDescription>{getErrorMessage(currentResumeQuery.error)}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Dashboard analytics">
        {analyticsCards.map((item) => {
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

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>AI Insight Cards</CardTitle>
            <CardDescription>Deterministic product signals that make the Copilot and workflow feel grounded.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {insights.map((insight) => {
              const Icon = insight.icon;
              const variant =
                insight.tone === "success" ? "success" : insight.tone === "warning" ? "warning" : "secondary";

              return (
                <div key={insight.title} className="flex flex-col gap-3 rounded-md border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Icon />
                      </div>
                      <p className="text-sm font-semibold">{insight.title}</p>
                    </div>
                    <Badge variant={variant}>{insight.tone}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{insight.summary}</p>
                  <Link className="text-sm font-medium text-primary" to={insight.href}>
                    {insight.actionLabel}
                  </Link>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application Analytics</CardTitle>
            <CardDescription>Track how much of the pipeline is moving versus waiting for a push.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {applicationStatusCounts.map((item) => {
              const percentage = Math.round((item.count / Math.max(workspaceApplications.length, 1)) * 100);

              return (
                <div key={item.label} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-muted-foreground">
                      {item.count} roles · {percentage}%
                    </span>
                  </div>
                  <Progress value={percentage} />
                </div>
              );
            })}
            <div className="rounded-md border bg-background p-4 text-sm text-muted-foreground">
              Average fit score is {averageFitScore()}%. The strongest return will usually come from pushing the highest-fit saved roles into tailored applications.
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Agenda</CardTitle>
            <CardDescription>Stay ahead of deadlines, interviews, and prep blocks.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {workspaceCalendarEvents
              .slice()
              .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime())
              .slice(0, 4)
              .map((event) => (
                <div key={event.id} className="flex items-start gap-3 rounded-md border bg-background p-4">
                  <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <CalendarClock className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{event.title}</p>
                      <Badge variant={event.type === "deadline" ? "destructive" : event.type === "interview" ? "warning" : "secondary"}>
                        {event.type}
                      </Badge>
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

        <Card>
          <CardHeader>
            <CardTitle>Goal Momentum</CardTitle>
            <CardDescription>See where consistency is compounding and where attention is slipping.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {workspaceGoals.map((goal) => (
              <div key={goal.id} className="rounded-md border bg-background p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold">{goal.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{goal.targetRole}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock3 className="size-4" />
                    Due {formatShortDate(goal.dueDate)}
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">Progress</span>
                    <span className="text-muted-foreground">{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
