import { FormEvent, useMemo, useState } from "react";
import { BriefcaseBusiness, ExternalLink, Loader2, MapPin, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { FitScoreVisualization } from "@/features/jobs/fit-score-visualization";
import type { JobWithFitScore } from "@/features/jobs/types";
import { useSearchJobs } from "@/features/jobs/use-jobs";
import { cn } from "@/lib/utils";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to search jobs. Please try again.";
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function formatSalary(job: JobWithFitScore): string {
  if (!job.salaryMin && !job.salaryMax) {
    return "Salary not listed";
  }

  const formatter = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
    style: "currency",
    currency: job.currency || "USD",
  });

  if (job.salaryMin && job.salaryMax) {
    return `${formatter.format(job.salaryMin)} - ${formatter.format(job.salaryMax)}`;
  }

  return formatter.format(job.salaryMin ?? job.salaryMax ?? 0);
}

function ScorePills({ values }: { values: string[] }) {
  if (values.length === 0) {
    return <p className="text-sm text-muted-foreground">None detected.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {values.slice(0, 10).map((value) => (
        <Badge key={value} variant="secondary">
          {value}
        </Badge>
      ))}
    </div>
  );
}

function JobCard({
  isSelected,
  job,
  onSelect,
}: {
  isSelected: boolean;
  job: JobWithFitScore;
  onSelect: () => void;
}) {
  return (
    <button
      aria-pressed={isSelected}
      className={cn(
        "w-full rounded-lg border bg-card p-4 text-left text-card-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground",
        isSelected && "border-primary bg-accent text-accent-foreground",
      )}
      type="button"
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">{job.title}</h3>
          <p className="mt-1 truncate text-sm text-muted-foreground">{job.company}</p>
        </div>
        <div className="flex size-14 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
          {job.fitScore.score}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <MapPin />
          {job.location || "Location not listed"}
        </span>
        <span>{formatSalary(job)}</span>
      </div>
      <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{stripHtml(job.description)}</p>
    </button>
  );
}

function LoadingCards() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-40" />
      <Skeleton className="h-40" />
      <Skeleton className="h-40" />
    </div>
  );
}

export function JobSearchWorkspace() {
  const searchJobs = useSearchJobs();
  const [what, setWhat] = useState("frontend developer");
  const [where, setWhere] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const jobs = searchJobs.data?.jobs ?? [];
  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) ?? jobs[0] ?? null,
    [jobs, selectedJobId],
  );

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const result = await searchJobs.mutateAsync({
        what,
        where,
        resultsPerPage: 10,
        page: 1,
      });
      setSelectedJobId(result.jobs[0]?.id ?? null);
    } catch {
      return;
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle>Job Search</CardTitle>
          <CardDescription>Search Adzuna jobs and score each role against your saved resume profile.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSearch}>
          <CardContent>
            <FieldGroup className="grid gap-4 md:grid-cols-[1fr_16rem]">
              <Field>
                <FieldLabel htmlFor="what">Role or keywords</FieldLabel>
                <Input aria-invalid={Boolean(searchJobs.error)} id="what" value={what} onChange={(event) => setWhat(event.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="where">Location</FieldLabel>
                <Input aria-invalid={Boolean(searchJobs.error)} id="where" placeholder="Remote, New York, London" value={where} onChange={(event) => setWhere(event.target.value)} />
              </Field>
            </FieldGroup>
            {searchJobs.error ? (
              <Field className="mt-4" data-invalid="true">
                <FieldError role="alert">{getErrorMessage(searchJobs.error)}</FieldError>
              </Field>
            ) : null}
          </CardContent>
          <CardFooter>
            <Button disabled={searchJobs.isPending || what.trim().length < 2} type="submit">
              {searchJobs.isPending ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Search data-icon="inline-start" />}
              Search jobs
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[26rem_1fr]">
        <section aria-labelledby="job-results-heading" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 id="job-results-heading" className="text-base font-semibold">Results</h2>
            {searchJobs.data ? <p className="text-sm text-muted-foreground">{searchJobs.data.count} found</p> : null}
          </div>
          {searchJobs.isPending ? <LoadingCards /> : null}
          {!searchJobs.isPending && jobs.length === 0 ? (
            <Card>
              <CardContent className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
                Search for a role to see scored job cards.
              </CardContent>
            </Card>
          ) : null}
          {!searchJobs.isPending &&
            jobs.map((job) => (
              <JobCard
                key={job.id}
                isSelected={selectedJob?.id === job.id}
                job={job}
                onSelect={() => setSelectedJobId(job.id)}
              />
            ))}
        </section>

        <section aria-labelledby="job-details-heading">
          {!selectedJob ? (
            <Card>
              <CardContent className="flex min-h-96 items-center justify-center text-sm text-muted-foreground">
                Select a job to review details and fit score.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle id="job-details-heading">{selectedJob.title}</CardTitle>
                      <CardDescription>{selectedJob.company}</CardDescription>
                    </div>
                    <BriefcaseBusiness />
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  <div className="grid gap-3 text-sm md:grid-cols-2">
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="mt-1 text-muted-foreground">{selectedJob.location || "Location not listed"}</p>
                    </div>
                    <div>
                      <p className="font-medium">Salary</p>
                      <p className="mt-1 text-muted-foreground">{formatSalary(selectedJob)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Matched skills</p>
                    <div className="mt-2">
                      <ScorePills values={selectedJob.fitScore.matchedSkills} />
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Missing skills</p>
                    <div className="mt-2">
                      <ScorePills values={selectedJob.fitScore.missingSkills} />
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Description</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                      {stripHtml(selectedJob.description)}
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline">
                    <a href={selectedJob.url} rel="noreferrer" target="_blank">
                      View on Adzuna
                      <ExternalLink data-icon="inline-end" />
                    </a>
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Fit Score</CardTitle>
                  <CardDescription>Deterministic score from your resume profile.</CardDescription>
                </CardHeader>
                <CardContent>
                  <FitScoreVisualization fitScore={selectedJob.fitScore} />
                </CardContent>
              </Card>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
