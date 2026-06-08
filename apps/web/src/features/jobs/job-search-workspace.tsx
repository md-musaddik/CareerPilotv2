import { FormEvent, useMemo, useState } from "react";
import { ArrowUpRight, BriefcaseBusiness, ExternalLink, Loader2, MapPin, Search, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { FitScoreVisualization } from "@/features/jobs/fit-score-visualization";
import type { JobWithFitScore } from "@/features/jobs/types";
import { useSearchJobs } from "@/features/jobs/use-jobs";
import { useCreateApplication } from "@/features/workspace/use-workspace";
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

function getScoreTone(score: number) {
  if (score >= 80) {
    return "success";
  }

  if (score >= 60) {
    return "warning";
  }

  return "secondary";
}

function buildWhyMatch(job: JobWithFitScore): { matchSummary: string; gapSummary: string } {
  const topBreakdown = [...job.fitScore.scoreBreakdown].sort((left, right) => right.score - left.score);
  const strongest = topBreakdown[0];
  const weakest = [...job.fitScore.scoreBreakdown].sort((left, right) => left.score - right.score)[0];
  const matchedSkillText =
    job.fitScore.matchedSkills.length > 0
      ? `${job.fitScore.matchedSkills.slice(0, 3).join(", ")}`
      : "No explicit skill overlap detected yet";
  const missingSkillText =
    job.fitScore.missingSkills.length > 0 ? job.fitScore.missingSkills.slice(0, 3).join(", ") : "No major skill gaps surfaced";

  return {
    matchSummary: strongest ? `${strongest.label}: ${matchedSkillText}` : matchedSkillText,
    gapSummary: weakest ? `${weakest.label}: ${missingSkillText}` : missingSkillText,
  };
}

function ScorePills({ values, variant }: { values: string[]; variant: "secondary" | "destructive" }) {
  if (values.length === 0) {
    return <p className="text-sm text-muted-foreground">None detected.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {values.slice(0, 10).map((value) => (
        <Badge key={value} variant={variant}>
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
  const why = buildWhyMatch(job);

  return (
    <button
      aria-pressed={isSelected}
      className={cn(
        "w-full rounded-lg border bg-card p-4 text-left text-card-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-accent/30",
        isSelected && "border-primary bg-accent/40",
      )}
      type="button"
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold">{job.title}</h3>
            <Badge variant={getScoreTone(job.fitScore.score)}>{job.fitScore.score}% match</Badge>
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">{job.company}</p>
        </div>
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          #{job.fitScore.score}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <MapPin className="size-3.5" />
          {job.location || "Location not listed"}
        </span>
        <span>{formatSalary(job)}</span>
      </div>
      <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{stripHtml(job.description)}</p>
      <div className="mt-4 grid gap-2">
        <div className="rounded-md bg-background px-3 py-2 text-xs">
          <p className="font-medium text-foreground">Why it matches</p>
          <p className="mt-1 text-muted-foreground">{why.matchSummary}</p>
        </div>
        <div className="rounded-md bg-background px-3 py-2 text-xs">
          <p className="font-medium text-foreground">Watch-outs</p>
          <p className="mt-1 text-muted-foreground">{why.gapSummary}</p>
        </div>
      </div>
    </button>
  );
}

function LoadingCards() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-56" />
      <Skeleton className="h-56" />
      <Skeleton className="h-56" />
    </div>
  );
}

export function JobSearchWorkspace() {
  const searchJobs = useSearchJobs();
  const createApplication = useCreateApplication();
  const [what, setWhat] = useState("frontend developer");
  const [where, setWhere] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const jobs = useMemo(
    () => [...(searchJobs.data?.jobs ?? [])].sort((left, right) => right.fitScore.score - left.fitScore.score),
    [searchJobs.data?.jobs],
  );
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

  async function handleTrackJob(job: JobWithFitScore) {
    try {
      await createApplication.mutateAsync({
        company: job.company,
        role: job.title,
        location: job.location,
        fitScore: job.fitScore.score,
        status: "saved",
        notes:
          job.fitScore.matchedSkills.length > 0
            ? `Strong overlap: ${job.fitScore.matchedSkills.slice(0, 5).join(", ")}`
            : "Tracked from job search results.",
        source: "Adzuna",
      });
    } catch {
      return;
    }
  }

  const selectedWhy = selectedJob ? buildWhyMatch(selectedJob) : null;

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle>Job Search</CardTitle>
          <CardDescription>Live Adzuna search ranked by fit score against your saved career profile.</CardDescription>
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
                <Input
                  aria-invalid={Boolean(searchJobs.error)}
                  id="where"
                  placeholder="Remote, New York, London"
                  value={where}
                  onChange={(event) => setWhere(event.target.value)}
                />
              </Field>
            </FieldGroup>
            {searchJobs.error ? (
              <Field className="mt-4" data-invalid="true">
                <FieldError role="alert">{getErrorMessage(searchJobs.error)}</FieldError>
              </Field>
            ) : null}
          </CardContent>
          <CardFooter className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Results are ranked by deterministic fit score, not by vague AI preference.</p>
            <Button disabled={searchJobs.isPending || what.trim().length < 2} type="submit">
              {searchJobs.isPending ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Search data-icon="inline-start" />}
              Search jobs
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[27rem_1fr]">
        <section aria-labelledby="job-results-heading" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="job-results-heading" className="text-base font-semibold">
                Ranked Results
              </h2>
              <p className="text-sm text-muted-foreground">Highest-fit roles surface first based on CV-grounded scoring.</p>
            </div>
            {searchJobs.data ? <p className="text-sm text-muted-foreground">{jobs.length} shown</p> : null}
          </div>
          {searchJobs.isPending ? <LoadingCards /> : null}
          {!searchJobs.isPending && jobs.length === 0 ? (
            <Card>
              <CardContent className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
                Search for a role to see ranked job cards and grounded fit explanations.
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
                Select a job to review details, fit logic, and tracking actions.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[1fr_23rem]">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle id="job-details-heading">{selectedJob.title}</CardTitle>
                        <Badge variant={getScoreTone(selectedJob.fitScore.score)}>{selectedJob.fitScore.score}% match</Badge>
                      </div>
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

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border bg-background p-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="size-4 text-primary" />
                        <p className="text-sm font-medium">Why this matches</p>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{selectedWhy?.matchSummary}</p>
                    </div>
                    <div className="rounded-lg border bg-background p-4">
                      <div className="flex items-center gap-2">
                        <ArrowUpRight className="size-4 text-destructive" />
                        <p className="text-sm font-medium">Why this may fall short</p>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{selectedWhy?.gapSummary}</p>
                    </div>
                  </div>

                  <div>
                    <p className="font-medium">Matched skills</p>
                    <div className="mt-2">
                      <ScorePills values={selectedJob.fitScore.matchedSkills} variant="secondary" />
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Missing skills</p>
                    <div className="mt-2">
                      <ScorePills values={selectedJob.fitScore.missingSkills} variant="destructive" />
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Description</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                      {stripHtml(selectedJob.description)}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-wrap justify-between gap-3">
                  <Button
                    disabled={createApplication.isPending}
                    type="button"
                    onClick={() => void handleTrackJob(selectedJob)}
                  >
                    {createApplication.isPending ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Sparkles data-icon="inline-start" />}
                    Track in workspace
                  </Button>
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
                  <CardDescription>Programmatic score with grounded reasoning by category.</CardDescription>
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
