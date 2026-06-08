import { Link } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  FileCheck2,
  Sparkles,
  Target,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { calculateResumeStrength } from "@/features/resume/resume-strength";
import { useCurrentResume } from "@/features/resume/use-resume";
import { useWorkspaceOverview } from "@/features/workspace/use-workspace";

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
      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <Skeleton className="h-[24rem]" />
        <Skeleton className="h-[24rem]" />
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

export function DashboardOverview() {
  const currentResumeQuery = useCurrentResume();
  const workspaceOverviewQuery = useWorkspaceOverview();

  if (currentResumeQuery.isLoading || workspaceOverviewQuery.isLoading) {
    return <DashboardLoadingState />;
  }

  const resume = currentResumeQuery.data?.resume ?? null;
  const workspace = workspaceOverviewQuery.data ?? null;
  const stats = workspace?.stats;
  const resumeStrength = resume ? calculateResumeStrength(resume.parsedResume.editableProfile) : null;
  const activeApplications = workspace?.applications ?? [];
  const upcomingEvents = (workspace?.calendarEvents ?? [])
    .filter((event) => new Date(event.date).getTime() >= Date.now())
    .slice(0, 4);
  const activeGoals = workspace?.goals ?? [];
  const hasRealCareerData =
    Boolean(resume) ||
    Boolean(stats?.applicationCount) ||
    Boolean(stats?.goalCount) ||
    Boolean(stats?.todoCount) ||
    Boolean(stats?.upcomingEventCount);

  const completedTaskCount = stats?.completedTaskCount ?? 0;
  const totalTaskCount = (workspace?.tasks ?? []).length;
  const taskCompletion = totalTaskCount > 0 ? Math.round((completedTaskCount / totalTaskCount) * 100) : null;
  const averageFitScore =
    activeApplications.length > 0
      ? Math.round(
          activeApplications.reduce((sum, item) => sum + (item.fitScore ?? 0), 0) /
            Math.max(activeApplications.filter((item) => typeof item.fitScore === "number").length, 1),
        )
      : null;

  if (!hasRealCareerData) {
    return (
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Start with your resume so CareerPilot can ground jobs, guidance, goals, and progress in your actual profile.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/dashboard/workspace?tab=resume&focus=resume-upload">
                Upload CV
                <UploadCloud data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/dashboard/assistant">
                Open AI Assistant
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Nothing is being scored yet</CardTitle>
            <CardDescription>
              Upload a resume first. Once that is done, the dashboard will show real application, interview, goal, and task progress instead of placeholder metrics.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-md border bg-background p-4">
              <p className="text-sm font-medium">1. Upload your CV</p>
              <p className="mt-2 text-sm text-muted-foreground">Parse PDF or DOCX into structured skills, projects, experience, and education.</p>
            </div>
            <div className="rounded-md border bg-background p-4">
              <p className="text-sm font-medium">2. Search jobs</p>
              <p className="mt-2 text-sm text-muted-foreground">See fit scores ranked against your real profile.</p>
            </div>
            <div className="rounded-md border bg-background p-4">
              <p className="text-sm font-medium">3. Start tracking work</p>
              <p className="mt-2 text-sm text-muted-foreground">Applications, goals, tasks, and calendar events will appear here automatically.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const analyticsCards = [
    {
      label: "Resume Strength",
      value: resumeStrength ? `${resumeStrength.score}` : "--",
      helper: resumeStrength ? `Grade ${resumeStrength.grade}` : "Upload a resume to score it",
      icon: FileCheck2,
    },
    {
      label: "Average Fit Score",
      value: averageFitScore !== null ? `${averageFitScore}%` : "--",
      helper: averageFitScore !== null ? "Across tracked applications with fit data" : "Track jobs to see fit trends",
      icon: Sparkles,
    },
    {
      label: "Interview Tracks",
      value: `${stats?.interviewCount ?? 0}`,
      helper: stats?.interviewCount ? "Active interview loops need prep" : "No interviews scheduled yet",
      icon: BriefcaseBusiness,
    },
    {
      label: "Task Completion",
      value: taskCompletion !== null ? `${taskCompletion}%` : "--",
      helper: totalTaskCount > 0 ? `${completedTaskCount} of ${totalTaskCount} tasks complete` : "Create goals and tasks to track progress",
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A real-time read on resume readiness, tracked applications, goals, and upcoming deadlines.
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
            <Link to="/dashboard/assistant">
              Open AI Assistant
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </section>

      {currentResumeQuery.error || workspaceOverviewQuery.error ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CircleAlert className="text-destructive" />
              <CardTitle className="text-base">Dashboard data is partially unavailable</CardTitle>
            </div>
            <CardDescription>
              {currentResumeQuery.error ? getErrorMessage(currentResumeQuery.error) : getErrorMessage(workspaceOverviewQuery.error)}
            </CardDescription>
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

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Progress Snapshot</CardTitle>
            <CardDescription>Live data from your applications, goals, and tasks.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border bg-background p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Applications</p>
                <Badge variant="secondary">{stats?.applicationCount ?? 0}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {stats?.savedCount ?? 0} saved, {stats?.interviewCount ?? 0} interviewing, {stats?.offerCount ?? 0} offers.
              </p>
            </div>
            <div className="rounded-md border bg-background p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Goals</p>
                <Badge variant="secondary">{stats?.goalCount ?? 0}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {stats?.todoCount ?? 0} open tasks across your active goals.
              </p>
            </div>
            <div className="rounded-md border bg-background p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Resume readiness</p>
                <Badge variant={stats?.resumeReady ? "success" : "warning"}>{stats?.resumeReady ? "Ready" : "Needs upload"}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {resumeStrength
                  ? `Current score ${resumeStrength.score}. Improve weak sections before wider outreach.`
                  : "Upload a CV to ground the assistant, jobs, and fit score."}
              </p>
            </div>
            <div className="rounded-md border bg-background p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Upcoming events</p>
                <Badge variant="secondary">{stats?.upcomingEventCount ?? 0}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Calendar is tracking real deadlines, interviews, and to-do dates.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Agenda</CardTitle>
            <CardDescription>Stay ahead of interviews, deadlines, and task due dates.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {upcomingEvents.length === 0 ? (
              <div className="flex min-h-48 items-center justify-center rounded-md border border-dashed bg-muted/40 px-4 text-center text-sm text-muted-foreground">
                No upcoming events yet. Add goals, task due dates, or calendar items from Workspace.
              </div>
            ) : (
              upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-3 rounded-md border bg-background p-4">
                  <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <CalendarClock className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{event.title}</p>
                      <Badge
                        variant={
                          event.type === "interview"
                            ? "warning"
                            : event.type === "goal" || event.type === "roadmap"
                              ? "success"
                              : event.type === "deadline"
                                ? "destructive"
                                : "secondary"
                        }
                      >
                        {event.type}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatShortDate(event.date)} - {event.timeLabel}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">{event.detail}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Application Board Snapshot</CardTitle>
            <CardDescription>Where tracked roles are currently sitting.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {[
              { label: "Saved", count: stats?.savedCount ?? 0 },
              { label: "Interviewing", count: stats?.interviewCount ?? 0 },
              { label: "Offer", count: stats?.offerCount ?? 0 },
              { label: "Rejected", count: stats?.rejectedCount ?? 0 },
            ].map((item) => {
              const percentage = Math.round((item.count / Math.max(stats?.applicationCount ?? 0, 1)) * 100);
              return (
                <div key={item.label} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-muted-foreground">
                      {item.count} roles - {percentage}%
                    </span>
                  </div>
                  <Progress value={percentage} />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Goal Progress</CardTitle>
            <CardDescription>Real goal progress driven by linked tasks.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {activeGoals.length === 0 ? (
              <div className="flex min-h-48 items-center justify-center rounded-md border border-dashed bg-muted/40 px-4 text-center text-sm text-muted-foreground">
                No goals yet. Create one in Workspace to start tracking deadlines and to-dos.
              </div>
            ) : (
              activeGoals.slice(0, 4).map((goal) => (
                <div key={goal.id} className="rounded-md border bg-background p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{goal.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {goal.targetDate ? `Due ${formatShortDate(goal.targetDate)}` : "No target date set"}
                      </p>
                    </div>
                    <Badge variant={goal.progress >= 70 ? "success" : goal.progress >= 40 ? "warning" : "secondary"}>
                      {goal.progress}%
                    </Badge>
                  </div>
                  <Progress className="mt-3" value={goal.progress} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
