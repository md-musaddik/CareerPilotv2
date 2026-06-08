import type { LucideIcon } from "lucide-react";
import { Bot, BriefcaseBusiness, CalendarDays, CheckSquare, FileText, Settings2 } from "lucide-react";

export type WorkspaceTab = "resume" | "applications" | "goals" | "calendar" | "settings";
export type ApplicationStatus = "saved" | "applied" | "interviewing" | "offer" | "rejected";
export type GoalPriority = "high" | "medium" | "low";
export type CalendarEventType = "goal" | "task" | "deadline" | "interview" | "roadmap";

export type WorkspaceTabItem = {
  id: WorkspaceTab;
  label: string;
  description: string;
  icon: LucideIcon;
};

export type WorkspaceApplication = {
  id: string;
  company: string;
  role: string;
  location: string;
  fitScore: number;
  updatedLabel: string;
  notes: string;
  status: ApplicationStatus;
};

export type WorkspaceTask = {
  id: string;
  title: string;
  done: boolean;
};

export type WorkspaceGoal = {
  id: string;
  title: string;
  targetRole: string;
  progress: number;
  dueDate: string;
  priority: GoalPriority;
  summary: string;
  tasks: WorkspaceTask[];
};

export type WorkspaceCalendarEvent = {
  id: string;
  title: string;
  date: string;
  type: CalendarEventType;
  timeLabel: string;
  detail: string;
};

function createDateInCurrentMonth(day: number, hour: number, minute: number) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const safeDay = Math.min(Math.max(day, 1), daysInMonth);

  return new Date(year, month, safeDay, hour, minute, 0, 0).toISOString();
}

export const workspaceTabs: WorkspaceTabItem[] = [
  {
    id: "resume",
    label: "Resume",
    description: "Parsing, editing, and profile review.",
    icon: FileText,
  },
  {
    id: "applications",
    label: "Applications",
    description: "Move roles through your pipeline.",
    icon: BriefcaseBusiness,
  },
  {
    id: "goals",
    label: "Goals",
    description: "Track milestones, deadlines, and tasks.",
    icon: CheckSquare,
  },
  {
    id: "calendar",
    label: "Calendar",
    description: "See interviews, deadlines, and roadmap dates.",
    icon: CalendarDays,
  },
  {
    id: "settings",
    label: "Settings",
    description: "Tune workspace preferences and defaults.",
    icon: Settings2,
  },
];

export const workspaceApplications: WorkspaceApplication[] = [
  {
    id: "app-1",
    company: "Figma",
    role: "Product Designer",
    location: "Remote",
    fitScore: 88,
    updatedLabel: "Saved 2h ago",
    notes: "Strong design systems overlap. Waiting on portfolio refresh.",
    status: "saved",
  },
  {
    id: "app-2",
    company: "Stripe",
    role: "Frontend Engineer",
    location: "New York",
    fitScore: 82,
    updatedLabel: "Applied yesterday",
    notes: "Resume tailored for React architecture and tooling depth.",
    status: "applied",
  },
  {
    id: "app-3",
    company: "Notion",
    role: "Growth PM",
    location: "San Francisco",
    fitScore: 74,
    updatedLabel: "Interview packet due tomorrow",
    notes: "Need sharper metrics stories for activation experiments.",
    status: "interviewing",
  },
  {
    id: "app-4",
    company: "Canva",
    role: "UX Writer",
    location: "Remote",
    fitScore: 79,
    updatedLabel: "Panel booked Thu",
    notes: "Prepare accessibility and voice examples.",
    status: "interviewing",
  },
  {
    id: "app-5",
    company: "Shopify",
    role: "Staff Content Strategist",
    location: "Remote",
    fitScore: 90,
    updatedLabel: "Offer review",
    notes: "Compare scope, level, and mentorship support.",
    status: "offer",
  },
  {
    id: "app-6",
    company: "Asana",
    role: "Program Manager",
    location: "Chicago",
    fitScore: 67,
    updatedLabel: "Closed last week",
    notes: "Rejected after loop. Keep PM artifact examples for next cycle.",
    status: "rejected",
  },
];

export const workspaceGoals: WorkspaceGoal[] = [
  {
    id: "goal-1",
    title: "Land a senior frontend role",
    targetRole: "Senior Frontend Engineer",
    progress: 68,
    dueDate: createDateInCurrentMonth(24, 17, 0),
    priority: "high",
    summary: "Sharpen portfolio stories, close system design gaps, and keep applications moving weekly.",
    tasks: [
      { id: "goal-1-task-1", title: "Refresh two case studies with measurable outcomes", done: true },
      { id: "goal-1-task-2", title: "Practice architecture interview prompts", done: false },
      { id: "goal-1-task-3", title: "Send three tailored applications this week", done: false },
    ],
  },
  {
    id: "goal-2",
    title: "Grow analytics depth",
    targetRole: "Product-minded IC",
    progress: 42,
    dueDate: createDateInCurrentMonth(18, 12, 0),
    priority: "medium",
    summary: "Build confidence with experimentation metrics and concise KPI storytelling.",
    tasks: [
      { id: "goal-2-task-1", title: "Complete retention metrics study notes", done: true },
      { id: "goal-2-task-2", title: "Draft one interview story using funnel metrics", done: false },
      { id: "goal-2-task-3", title: "Review one dashboard teardown from a target company", done: false },
    ],
  },
  {
    id: "goal-3",
    title: "Strengthen interview stamina",
    targetRole: "Cross-functional leader",
    progress: 83,
    dueDate: createDateInCurrentMonth(10, 9, 0),
    priority: "low",
    summary: "Keep a steady prep rhythm so loops feel familiar instead of draining.",
    tasks: [
      { id: "goal-3-task-1", title: "Run one mock interview with CareerPilot Copilot", done: true },
      { id: "goal-3-task-2", title: "Write down follow-up questions for recruiters", done: true },
      { id: "goal-3-task-3", title: "Block recovery time after interview days", done: false },
    ],
  },
];

export const workspaceCalendarEvents: WorkspaceCalendarEvent[] = [
  {
    id: "event-1",
    title: "Notion interview loop",
    date: createDateInCurrentMonth(12, 11, 0),
    type: "interview",
    timeLabel: "11:00",
    detail: "System design and collaboration panel.",
  },
  {
    id: "event-2",
    title: "Portfolio refresh deadline",
    date: createDateInCurrentMonth(14, 18, 0),
    type: "deadline",
    timeLabel: "18:00",
    detail: "Finalize case study metrics before recruiter follow-up.",
  },
  {
    id: "event-3",
    title: "Mock interview session",
    date: createDateInCurrentMonth(16, 9, 30),
    type: "task",
    timeLabel: "09:30",
    detail: "Behavioral loop practice in Copilot.",
  },
  {
    id: "event-4",
    title: "Skill gap checkpoint",
    date: createDateInCurrentMonth(18, 13, 0),
    type: "goal",
    timeLabel: "13:00",
    detail: "Review analytics progress against target roles.",
  },
  {
    id: "event-5",
    title: "Roadmap milestone: leadership stories",
    date: createDateInCurrentMonth(22, 10, 0),
    type: "roadmap",
    timeLabel: "10:00",
    detail: "Finish three STAR examples for interview loops.",
  },
  {
    id: "event-6",
    title: "Offer decision review",
    date: createDateInCurrentMonth(26, 15, 0),
    type: "deadline",
    timeLabel: "15:00",
    detail: "Compare compensation, scope, and growth support.",
  },
];

export const workspaceSettings = {
  profileHeadline: "Senior Frontend Engineer focused on product systems and UX clarity",
  targetLocation: "Remote or New York",
  targetCompensation: "$170k - $210k",
  defaultSearchKeywords: "frontend engineer, design systems, React, TypeScript",
  weeklyApplicationGoal: "5 tailored applications",
  coachingPreference: "Direct, action-oriented feedback with examples",
  notifications: [
    { id: "deadlines", label: "Deadline reminders", checked: true },
    { id: "interviews", label: "Interview prep nudges", checked: true },
    { id: "fit", label: "Fit score explanation summaries", checked: false },
  ],
  visibility: [
    { id: "resume", label: "Show resume status in dashboard", checked: true },
    { id: "calendar", label: "Pin upcoming events in workspace", checked: true },
    { id: "goals", label: "Highlight overdue goal tasks", checked: true },
  ],
};

export const workspaceInsights = [
  {
    label: "Open applications",
    value: "6",
    helper: "2 active interview tracks",
    icon: BriefcaseBusiness,
  },
  {
    label: "Goals on track",
    value: "2 / 3",
    helper: "One deadline needs attention",
    icon: CheckSquare,
  },
  {
    label: "Calendar load",
    value: "6",
    helper: "Events this month",
    icon: CalendarDays,
  },
  {
    label: "Copilot readiness",
    value: "High",
    helper: "Resume and context synced",
    icon: Bot,
  },
];
