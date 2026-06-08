import { z } from "zod";

const nonEmptyStringArraySchema = z.array(z.string().trim()).default([]);

export const updateResumeSchema = {
  body: z.object({
    editableProfile: z.object({
      headline: z.string().trim().default(""),
      summary: z.string().trim().default(""),
      skills: nonEmptyStringArraySchema,
      projects: nonEmptyStringArraySchema,
      experience: nonEmptyStringArraySchema,
      education: nonEmptyStringArraySchema,
    }),
    structuredData: z.object({
      skills: nonEmptyStringArraySchema,
      projects: nonEmptyStringArraySchema,
      experience: nonEmptyStringArraySchema,
      education: nonEmptyStringArraySchema,
    }),
  }),
  params: z.object({
    resumeId: z.string().trim().min(1),
  }),
};
