import { JobSearchWorkspace } from "@/features/jobs/job-search-workspace";

export function JobsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Jobs</h1>
        <p className="mt-1 text-sm text-muted-foreground">Search jobs, inspect details, and compare deterministic fit scores.</p>
      </div>
      <JobSearchWorkspace />
    </div>
  );
}
