import { z } from "zod";

export const searchJobsSchema = {
  query: z.object({
    what: z.string().trim().min(2).max(120),
    where: z.string().trim().max(120).optional(),
    page: z.coerce.number().int().min(1).max(20).default(1),
    resultsPerPage: z.coerce.number().int().min(1).max(20).default(10),
    explain: z.enum(["true", "false"]).optional(),
  }),
};
