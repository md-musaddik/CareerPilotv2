import { z } from "zod";

const actionTypeSchema = z.enum([
  "career_chat",
  "resume_review",
  "skill_gap_analysis",
  "career_roadmap",
  "cover_letter",
  "interview_coach",
]);

export const copilotChatSchema = {
  body: z.object({
    message: z.string().trim().min(2).max(4000),
    actionType: actionTypeSchema.default("career_chat"),
    sessionId: z.string().trim().optional(),
  }),
};

