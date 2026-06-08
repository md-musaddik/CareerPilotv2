import { ProfileModel } from "../models/profile.model.js";
import { SavedJobModel } from "../models/saved-job.model.js";
import type { JobWithFitScore, NormalizedJob } from "../types/jobs.js";
import { explainFitScore } from "./fit-score-explanation.service.js";
import { calculateFitScore } from "./fit-score.service.js";
import { filterAndAnnotateJobsByIntent } from "./job-search-filter.service.js";
import { parseJobSearchIntent } from "./job-search-intent.service.js";
import { searchAcrossJobProviders } from "./job-provider.service.js";

type SearchJobsParams = {
  userId: string;
  what: string;
  where?: string;
  page: number;
  resultsPerPage: number;
  includeExplanation: boolean;
};

export type JobSearchWithFitScores = {
  count: number;
  page: number;
  resultsPerPage: number;
  intent: ReturnType<typeof parseJobSearchIntent>;
  warning?: string;
  jobs: JobWithFitScore[];
};

export async function searchJobsWithFitScores(params: SearchJobsParams): Promise<JobSearchWithFitScores> {
  const intent = parseJobSearchIntent(params.what, params.where);

  const [profile, searchResults] = await Promise.all([
    ProfileModel.findOne({ userId: params.userId }).lean(),
    searchAcrossJobProviders({
      intent,
      page: params.page,
      resultsPerPage: params.resultsPerPage,
    }),
  ]);

  const filteredJobs = filterAndAnnotateJobsByIntent(searchResults.jobs, intent);
  let effectiveJobs = filteredJobs;
  let warning: string | undefined;

  if (filteredJobs.length === 0 && intent.locationText && !intent.remoteOnly) {
    const remoteFallbackIntent = {
      ...intent,
      locationText: "remote",
      locationParts: ["remote"],
      remoteOnly: true,
    };
    const remoteFallbackJobs = filterAndAnnotateJobsByIntent(searchResults.jobs, remoteFallbackIntent);

    if (remoteFallbackJobs.length > 0) {
      effectiveJobs = remoteFallbackJobs;
      warning = `We couldn't find matching jobs in ${intent.locationText}, so we are showing remote jobs instead.`;
    }
  }

  const jobs = effectiveJobs
    .map((job) => ({
      ...job,
      fitScore: calculateFitScore(job, profile),
    }))
    .sort((left, right) => {
      if (right.fitScore.score !== left.fitScore.score) {
        return right.fitScore.score - left.fitScore.score;
      }
      return right.searchMatch.score - left.searchMatch.score;
    });

  if (params.includeExplanation) {
    for (const job of jobs) {
      job.fitScore.explanation = await explainFitScore(job, job.fitScore);
    }
  }

  await upsertSavedJobs(params.userId, jobs);

  return {
    count: jobs.length,
    page: params.page,
    resultsPerPage: params.resultsPerPage,
    intent,
    warning,
    jobs,
  };
}

async function upsertSavedJobs(userId: string, jobs: NormalizedJob[]): Promise<void> {
  if (jobs.length === 0) {
    return;
  }

  await SavedJobModel.bulkWrite(
    jobs.map((job) => ({
      updateOne: {
        filter: {
          userId,
          provider: job.provider,
          providerJobId: job.id,
        },
        update: {
          $set: {
            title: job.title,
            company: job.company,
            location: job.location,
            description: job.description,
            url: job.url,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            currency: job.currency,
            metadata: job.metadata,
          },
        },
        upsert: true,
      },
    })),
  );
}
