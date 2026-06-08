export type CopilotActionType =
  | "career_chat"
  | "resume_review"
  | "skill_gap_analysis"
  | "career_roadmap"
  | "cover_letter"
  | "interview_coach";

export type CopilotRequest = {
  message: string;
  actionType: CopilotActionType;
  sessionId?: string;
};

export type CopilotStreamRequest = CopilotRequest;

export type CopilotMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  actionType?: CopilotActionType;
};

export type CopilotMemoryContext = {
  resumeSummary: string;
  goalsSummary: string;
  applicationsSummary: string;
  chatHistorySummary: string;
  relevantResumeChunks: string[];
};
