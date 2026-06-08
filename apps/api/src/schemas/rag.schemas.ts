import { z } from "zod";

export const retrieveChunksSchema = {
  body: z.object({
    query: z.string().trim().min(2).max(1000),
    limit: z.number().int().min(1).max(20).default(5),
    chunkTypes: z
      .array(z.enum(["skills", "projects", "experience", "education"]))
      .optional(),
  }),
};

