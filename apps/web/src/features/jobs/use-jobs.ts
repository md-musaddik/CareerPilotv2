import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/auth-context";
import { createJobsApi } from "@/features/jobs/jobs-api";
import type { JobSearchParams } from "@/features/jobs/types";

export function useSearchJobs() {
  const { user } = useAuth();
  const jobsApi = createJobsApi(user);

  return useMutation({
    mutationFn: (params: JobSearchParams) => jobsApi.searchJobs(params),
  });
}

