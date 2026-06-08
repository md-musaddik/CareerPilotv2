import { Progress } from "@/components/ui/progress";
import type { FitScore } from "@/features/jobs/types";

function getScoreTone(score: number): string {
  if (score >= 80) {
    return "text-primary";
  }

  if (score >= 60) {
    return "text-accent-foreground";
  }

  return "text-destructive";
}

export function FitScoreVisualization({ fitScore }: { fitScore: FitScore }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Fit score</p>
          <p className={`text-4xl font-semibold ${getScoreTone(fitScore.score)}`}>{fitScore.score}</p>
        </div>
        <div className="h-20 w-20 rounded-full border-8 border-primary/20 p-2">
          <div className="flex size-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {fitScore.score}%
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {fitScore.scoreBreakdown.map((item) => (
          <div key={item.label} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">{item.label}</span>
              <span className="text-muted-foreground">
                {item.score}% · {item.weight}%
              </span>
            </div>
            <Progress value={item.score} />
            <p className="text-xs text-muted-foreground">{item.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

