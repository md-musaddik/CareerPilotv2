import type { User } from "firebase/auth";
import { createApiClient } from "@/services/api-client";
import type { JobSearchParams, JobSearchResponse } from "./types";

export function createJobsApi(user: User | null) {
  const client = createApiClient({ user });

  return {
    searchJobs: (params: JobSearchParams) => {
      const searchParams = new URLSearchParams({
        what: params.what,
        page: String(params.page ?? 1),
        resultsPerPage: String(params.resultsPerPage ?? 10),
      });

      if (params.explain) {
        searchParams.set("explain", "true");
      }

      return client.get<JobSearchResponse>(`/jobs/search?${searchParams.toString()}`);
    },
  };
}
