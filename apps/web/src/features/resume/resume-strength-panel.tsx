import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { ResumeStrengthResult } from "@/features/resume/resume-strength";

function getScoreVariant(score: number): "success" | "warning" | "destructive" {
  if (score >= 80) {
    return "success";
  }

  if (score >= 60) {
    return "warning";
  }

  return "destructive";
}

export function ResumeStrengthPanel({ result }: { result: ResumeStrengthResult }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Resume strength</p>
          <div className="mt-2 flex items-end gap-3">
            <p className="text-4xl font-semibold">{result.score}</p>
            <Badge variant={getScoreVariant(result.score)}>Grade {result.grade}</Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Deterministic score based on clarity, coverage, and evidence in your editable resume profile.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:w-[24rem]">
          <div className="rounded-md border bg-background p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Strongest signals</p>
            <ul className="mt-2 flex list-disc flex-col gap-1 pl-4 text-sm text-muted-foreground">
              {result.highlights.length > 0 ? result.highlights.map((item) => <li key={item}>{item}</li>) : <li>Add more resume content to surface strengths.</li>}
            </ul>
          </div>
          <div className="rounded-md border bg-background p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Best next fixes</p>
            <ul className="mt-2 flex list-disc flex-col gap-1 pl-4 text-sm text-muted-foreground">
              {result.opportunities.length > 0 ? result.opportunities.map((item) => <li key={item}>{item}</li>) : <li>Your core sections already look well-covered.</li>}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {result.pillars.map((pillar) => (
          <div key={pillar.label} className="flex flex-col gap-2 rounded-md border bg-background p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">{pillar.label}</p>
              <span className="text-sm text-muted-foreground">{pillar.score}%</span>
            </div>
            <Progress value={pillar.score} />
            <p className="text-xs text-muted-foreground">{pillar.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
