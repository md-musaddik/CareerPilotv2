import { config } from "../config/env.js";
import type { NormalizedJob } from "../types/jobs.js";
import { HttpError } from "../utils/http-error.js";

type AdzunaSearchParams = {
  what: string;
  where?: string;
  page: number;
  resultsPerPage: number;
};

type AdzunaJobResult = {
  id?: string;
  title?: string;
  description?: string;
  redirect_url?: string;
  created?: string;
  salary_min?: number;
  salary_max?: number;
  category?: {
    label?: string;
    tag?: string;
  };
  company?: {
    display_name?: string;
  };
  location?: {
    display_name?: string;
  };
};

type AdzunaSearchResponse = {
  count?: number;
  results?: AdzunaJobResult[];
};

export type JobSearchResult = {
  count: number;
  page: number;
  resultsPerPage: number;
  jobs: NormalizedJob[];
};

export async function searchAdzunaJobs(params: AdzunaSearchParams): Promise<JobSearchResult> {
  const url = new URL(
    `https://api.adzuna.com/v1/api/jobs/${encodeURIComponent(config.adzunaCountry)}/search/${params.page}`,
  );

  url.searchParams.set("app_id", config.adzunaAppId);
  url.searchParams.set("app_key", config.adzunaAppKey);
  url.searchParams.set("results_per_page", String(params.resultsPerPage));
  url.searchParams.set("content-type", "application/json");
  url.searchParams.set("what", params.what);

  if (params.where) {
    url.searchParams.set("where", params.where);
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new HttpError(response.status, "ADZUNA_SEARCH_FAILED", "Unable to search jobs from Adzuna.");
  }

  const payload = (await response.json()) as AdzunaSearchResponse;

  return {
    count: payload.count ?? 0,
    page: params.page,
    resultsPerPage: params.resultsPerPage,
    jobs: (payload.results ?? []).map(normalizeAdzunaJob),
  };
}

function normalizeAdzunaJob(job: AdzunaJobResult): NormalizedJob {
  return {
    id: job.id ?? "",
    provider: "adzuna",
    title: job.title ?? "Untitled role",
    company: job.company?.display_name ?? "Unknown company",
    location: job.location?.display_name ?? "",
    description: job.description ?? "",
    url: job.redirect_url ?? "",
    salaryMin: job.salary_min,
    salaryMax: job.salary_max,
    category: job.category?.label ?? job.category?.tag,
    createdAt: job.created,
    metadata: {
      category: job.category,
    },
  };
}

