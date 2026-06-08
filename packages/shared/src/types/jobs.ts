export type NormalizedJob = {
  id: string;
  provider: "adzuna";
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
};

export type JobSearchResponse = {
  count: number;
  page: number;
  resultsPerPage: number;
  jobs: JobWithFitScore[];
};

export type JobSearchParams = {
  what: string;
  where?: string;
  page?: number;
  resultsPerPage?: number;
  explain?: boolean;
};
