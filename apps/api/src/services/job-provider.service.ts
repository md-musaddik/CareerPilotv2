import { config } from "../config/env.js";
import type { NormalizedJob, ParsedJobSearchIntent } from "../types/jobs.js";
import { searchAdzunaJobs } from "./adzuna.service.js";
import { searchJoobleJobs } from "./jooble.service.js";

type ProviderSearchParams = {
  intent: ParsedJobSearchIntent;
  page: number;
  resultsPerPage: number;
};

type ExternalSearchResult = {
  count: number;
  jobs: NormalizedJob[];
};

const adzunaCountryAliases: Record<string, string[]> = {
  us: ["us", "usa", "united states", "america", "new york", "california", "texas", "seattle", "chicago"],
};

export async function searchAcrossJobProviders(params: ProviderSearchParams): Promise<ExternalSearchResult> {
  const providerCalls = [];

  if (shouldUseAdzuna(params.intent)) {
    providerCalls.push(
      searchAdzunaJobs({
        what: buildProviderKeywords(params.intent),
        where: buildProviderLocation(params.intent),
        page: params.page,
        resultsPerPage: params.resultsPerPage,
      }),
    );
  }

  providerCalls.push(
    searchJoobleJobs({
      intent: params.intent,
      page: params.page,
      resultsPerPage: params.resultsPerPage,
    }),
  );

  const providerResults = await Promise.all(providerCalls);
  const merged = dedupeJobs(providerResults.flatMap((result) => result.jobs));

  return {
    count: merged.length,
    jobs: merged,
  };
}

function shouldUseAdzuna(intent: ParsedJobSearchIntent): boolean {
  const configuredCountry = config.adzunaCountry.toLowerCase();
  if (!intent.locationText) {
    return configuredCountry === "us";
  }

  const aliases = adzunaCountryAliases[configuredCountry] ?? [configuredCountry];
  const normalizedLocation = intent.locationText.toLowerCase();
  return aliases.some((alias) => normalizedLocation.includes(alias) || alias.includes(normalizedLocation));
}

function buildProviderKeywords(intent: ParsedJobSearchIntent): string {
  const keywords = intent.roleTerms.length > 0 ? intent.roleTerms : intent.keywords;
  return keywords.join(" ").trim() || intent.rawQuery;
}

function buildProviderLocation(intent: ParsedJobSearchIntent): string | undefined {
  if (!intent.locationText || intent.locationText === "remote") {
    return undefined;
  }

  return intent.locationText;
}

function dedupeJobs(jobs: NormalizedJob[]): NormalizedJob[] {
  const seen = new Set<string>();
  const results: NormalizedJob[] = [];

  for (const job of jobs) {
    const dedupeKey = [
      normalizeValue(job.title),
      normalizeValue(job.company),
      normalizeValue(job.location),
      normalizeValue(job.url),
    ].join("|");

    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    results.push(job);
  }

  return results;
}

function normalizeValue(value: string | undefined): string {
  return (value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}
