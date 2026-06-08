import OpenAI from "openai";
import { config } from "../config/env.js";
import type { FitScore, NormalizedJob } from "../types/jobs.js";

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

export async function explainFitScore(job: NormalizedJob, fitScore: FitScore): Promise<string> {
  const response = await openai.chat.completions.create({
    model: config.openaiModel,
    messages: [
      {
        role: "system",
        content:
          "Explain a deterministic job fit score in plain language. Do not change the score, matched skills, missing skills, or breakdown.",
      },
      {
        role: "user",
        content: JSON.stringify({
          job: {
            title: job.title,
            company: job.company,
            location: job.location,
          },
          fitScore,
        }),
      },
    ],
    temperature: 0.2,
  });

  return response.choices[0]?.message.content?.trim() ?? "";
}

