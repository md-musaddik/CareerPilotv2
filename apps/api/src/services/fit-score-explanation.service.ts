import OpenAI from "openai";
import { config } from "../config/env.js";
import type { FitScore, JobWithFitScore } from "../types/jobs.js";

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

export async function explainFitScore(job: JobWithFitScore, fitScore: FitScore): Promise<string> {
  const response = await openai.chat.completions.create({
    model: config.openaiModel,
    messages: [
      {
        role: "system",
        content:
          "Explain a deterministic job fit score in plain language. Include both CV fit and how well the role matches the user's search intent. Do not change the score, matched skills, missing skills, or breakdown.",
      },
      {
        role: "user",
        content: JSON.stringify({
          job: {
            title: job.title,
            company: job.company,
            location: job.location,
          },
          searchMatch: job.searchMatch,
          fitScore,
        }),
      },
    ],
  });

  return response.choices[0]?.message.content?.trim() ?? "";
}
