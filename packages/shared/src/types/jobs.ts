export type NormalizedJob = {
  id: string;
  provider: "adzuna" | "jooble";
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  category?: string;
  createdAt?: string;
  metadata?: unknown;
};

export type ParsedJobSearchIntent = {
  rawQuery: string;
  normalizedQuery: string;
  keywords: string[];
  roleTerms: string[];
  locationText?: string;
  locationParts: string[];
  jobType?: "internship" | "full-time" | "part-time" | "contract" | "remote";
  dateWindow?: "today" | "this_week" | "this_month";
  remoteOnly: boolean;
};

export type SearchMatchInsight = {
  matchedQueryTerms: string[];
  missingQueryTerms: string[];
  matchedFilters: string[];
  warnings: string[];
  score: number;
};

export type ScoreBreakdownItem = {
  label: "Skill Match" | "Experience Match" | "Education Match" | "Project Relevance" | "Location Match";
  score: number;
  weight: number;
  reason: string;
};

export type FitScore = {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  scoreBreakdown: ScoreBreakdownItem[];
  explanation?: string;
};

export type JobWithFitScore = NormalizedJob & {
  fitScore: FitScore;
  searchMatch: SearchMatchInsight;
};

export type JobSearchResponse = {
  count: number;
  page: number;
  resultsPerPage: number;
  intent: ParsedJobSearchIntent;
  warning?: string;
  jobs: JobWithFitScore[];
};

export type JobSearchParams = {
  what: string;
  where?: string;
  page?: number;
  resultsPerPage?: number;
  explain?: boolean;
};
