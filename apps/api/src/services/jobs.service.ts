import { ProfileModel } from "../models/profile.model.js";
import { SavedJobModel } from "../models/saved-job.model.js";
import type { JobWithFitScore, NormalizedJob } from "../types/jobs.js";
import { searchAdzunaJobs, type JobSearchResult } from "./adzuna.service.js";
import { explainFitScore } from "./fit-score-explanation.service.js";
import { calculateFitScore } from "./fit-score.service.js";

type SearchJobsParams = {
  userId: string;
  what: string;
  where?: string;
  page: number;
  resultsPerPage: number;
  includeExplanation: boolean;
};

export type JobSearchWithFitScores = Omit<JobSearchResult, "jobs"> & {
  jobs: JobWithFitScore[];
};

export async function searchJobsWithFitScores(params: SearchJobsParams): Promise<JobSearchWithFitScores> {
  const [profile, searchResults] = await Promise.all([
    ProfileModel.findOne({ userId: params.userId }).lean(),
    searchAdzunaJobs({
      what: params.what,
      where: params.where,
      page: params.page,
      resultsPerPage: params.resultsPerPage,
    }),
  ]);

  const jobs = searchResults.jobs.map((job) => ({
    ...job,
    fitScore: calculateFitScore(job, profile),
  }))
    .sort((left, right) => right.fitScore.score - left.fitScore.score);

  if (params.includeExplanation) {
    for (const job of jobs) {
      job.fitScore.explanation = await explainFitScore(job, job.fitScore);
    }
  }

  await upsertSavedJobs(params.userId, jobs);

  return {
    count: searchResults.count,
    page: searchResults.page,
    resultsPerPage: searchResults.resultsPerPage,
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
