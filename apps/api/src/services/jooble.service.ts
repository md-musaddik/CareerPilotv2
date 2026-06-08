import { config } from "../config/env.js";
import type { NormalizedJob, ParsedJobSearchIntent } from "../types/jobs.js";
import { HttpError } from "../utils/http-error.js";

type JoobleSearchParams = {
  intent: ParsedJobSearchIntent;
  page: number;
  resultsPerPage: number;
};

type JoobleJobResult = {
  id?: number | string;
  title?: string;
  location?: string;
  snippet?: string;
  salary?: string;
  source?: string;
  type?: string;
  link?: string;
  company?: string;
  updated?: string;
};

type JoobleSearchResponse = {
  totalCount?: number;
  jobs?: JoobleJobResult[];
};

export type ExternalJobSearchResult = {
  count: number;
  page: number;
  resultsPerPage: number;
  jobs: NormalizedJob[];
};

export async function searchJoobleJobs(params: JoobleSearchParams): Promise<ExternalJobSearchResult> {
  if (!config.joobleApiKey) {
    return {
      count: 0,
      page: params.page,
      resultsPerPage: params.resultsPerPage,
      jobs: [],
    };
  }

  const response = await fetch(`https://jooble.org/api/${encodeURIComponent(config.joobleApiKey)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      keywords: buildJoobleKeywords(params.intent),
      location: params.intent.locationText ?? "",
      page: String(params.page),
      ResultOnPage: String(params.resultsPerPage),
      companysearch: false,
    }),
  });

  if (!response.ok) {
    throw new HttpError(response.status, "JOOBLE_SEARCH_FAILED", "Unable to search jobs from Jooble.");
  }

  const payload = (await response.json()) as JoobleSearchResponse;

  return {
    count: payload.totalCount ?? 0,
    page: params.page,
    resultsPerPage: params.resultsPerPage,
    jobs: (payload.jobs ?? []).map(normalizeJoobleJob),
  };
}

function buildJoobleKeywords(intent: ParsedJobSearchIntent): string {
  const tokens = intent.roleTerms.length > 0 ? intent.roleTerms : intent.keywords;
  return tokens.join(" ").trim() || intent.rawQuery;
}

function normalizeJoobleJob(job: JoobleJobResult): NormalizedJob {
  return {
    id: String(job.id ?? job.link ?? job.title ?? ""),
    provider: "jooble",
    title: job.title ?? "Untitled role",
    company: job.company ?? job.source ?? "Unknown company",
    location: job.location ?? "",
    description: job.snippet ?? "",
    url: job.link ?? "",
    category: job.type,
    createdAt: job.updated,
    metadata: {
      source: job.source,
      updated: job.updated,
      type: job.type,
      salary: job.salary,
    },
  };
}
