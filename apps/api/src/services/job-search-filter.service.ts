import type { NormalizedJob, ParsedJobSearchIntent, SearchMatchInsight } from "../types/jobs.js";

type JobWithSearchMatch = NormalizedJob & {
  searchMatch: SearchMatchInsight;
};

export function filterAndAnnotateJobsByIntent(jobs: NormalizedJob[], intent: ParsedJobSearchIntent): JobWithSearchMatch[] {
  return jobs
    .map((job) => ({
      ...job,
      searchMatch: buildSearchMatchInsight(job, intent),
    }))
    .filter((job) => shouldIncludeJob(job.searchMatch, intent))
    .sort((left, right) => right.searchMatch.score - left.searchMatch.score);
}

function buildSearchMatchInsight(job: NormalizedJob, intent: ParsedJobSearchIntent): SearchMatchInsight {
  const haystack = normalize(`${job.title} ${job.description} ${job.location} ${job.category ?? ""}`);
  const matchedQueryTerms = intent.keywords.filter((term) => containsToken(haystack, normalize(term)));
  const missingQueryTerms = intent.keywords.filter((term) => !containsToken(haystack, normalize(term)));
  const matchedFilters: string[] = [];
  const warnings: string[] = [];
  let score = intent.keywords.length > 0 ? Math.round((matchedQueryTerms.length / intent.keywords.length) * 65) : 45;

  if (intent.locationText) {
    if (matchesLocation(job.location, intent)) {
      matchedFilters.push(`Location: ${intent.locationText}`);
      score += 20;
    } else {
      warnings.push(`Location mismatch for ${intent.locationText}`);
      score -= 20;
    }
  }

  if (intent.jobType) {
    if (matchesJobType(job, intent.jobType)) {
      matchedFilters.push(`Job type: ${intent.jobType}`);
      score += 10;
    } else {
      warnings.push(`Job type does not clearly look like ${intent.jobType}`);
      score -= 10;
    }
  }

  if (intent.dateWindow) {
    if (matchesDateWindow(job.createdAt, intent.dateWindow)) {
      matchedFilters.push(`Posted: ${formatDateWindow(intent.dateWindow)}`);
      score += 10;
    } else {
      warnings.push(`Posting date is not clearly within ${formatDateWindow(intent.dateWindow)}`);
      score -= 8;
    }
  }

  return {
    matchedQueryTerms,
    missingQueryTerms,
    matchedFilters,
    warnings,
    score: clamp(score, 0, 100),
  };
}

function shouldIncludeJob(searchMatch: SearchMatchInsight, intent: ParsedJobSearchIntent): boolean {
  if (intent.keywords.length <= 1) {
    return searchMatch.score >= 20;
  }

  return searchMatch.score >= 30 || searchMatch.matchedQueryTerms.length >= Math.ceil(intent.keywords.length / 2);
}

function matchesLocation(jobLocation: string, intent: ParsedJobSearchIntent): boolean {
  if (intent.remoteOnly) {
    return /remote|anywhere|work from home/i.test(jobLocation);
  }

  const normalizedLocation = normalize(jobLocation);
  if (!normalizedLocation) {
    return false;
  }

  return intent.locationParts.some((part) => containsToken(normalizedLocation, normalize(part)));
}

function matchesJobType(job: NormalizedJob, jobType: NonNullable<ParsedJobSearchIntent["jobType"]>): boolean {
  const text = normalize(`${job.title} ${job.description} ${job.category ?? ""}`);

  switch (jobType) {
    case "internship":
      return /\bintern(ship)?\b|\btrainee\b/.test(text);
    case "part-time":
      return /\bpart[- ]?time\b/.test(text);
    case "contract":
      return /\bcontract\b|\bfreelance\b/.test(text);
    case "full-time":
      return /\bfull[- ]?time\b/.test(text);
    case "remote":
      return /\bremote\b|\bwork from home\b/.test(text);
    default:
      return true;
  }
}

function matchesDateWindow(createdAt: string | undefined, dateWindow: NonNullable<ParsedJobSearchIntent["dateWindow"]>): boolean {
  if (!createdAt) {
    return false;
  }

  const timestamp = new Date(createdAt).getTime();
  if (Number.isNaN(timestamp)) {
    return false;
  }

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  switch (dateWindow) {
    case "today":
      return now - timestamp <= oneDay;
    case "this_week":
      return now - timestamp <= 7 * oneDay;
    case "this_month":
      return now - timestamp <= 31 * oneDay;
    default:
      return true;
  }
}

function formatDateWindow(dateWindow: NonNullable<ParsedJobSearchIntent["dateWindow"]>): string {
  switch (dateWindow) {
    case "today":
      return "today";
    case "this_week":
      return "this week";
    case "this_month":
      return "this month";
    default:
      return dateWindow;
  }
}

function containsToken(text: string, token: string): boolean {
  if (!token) {
    return false;
  }

  const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|\\W)${escapedToken}(\\W|$)`, "i").test(text);
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^\w\s/-]/g, " ").replace(/\s+/g, " ").trim();
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
