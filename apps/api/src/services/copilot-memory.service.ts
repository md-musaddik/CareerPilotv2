import { ApplicationModel } from "../models/application.model.js";
import { ChatMessageModel } from "../models/chat-message.model.js";
import { GoalModel } from "../models/goal.model.js";
import { ParsedResumeModel } from "../models/parsed-resume.model.js";
import { ResumeDocumentModel } from "../models/resume-document.model.js";
import type { CopilotMemoryContext } from "../types/copilot.js";
import { logger } from "../utils/logger.js";
import { retrieveRelevantResumeChunks } from "./rag.service.js";

export async function buildCopilotMemoryContext(params: {
  userId: string;
  message: string;
  sessionId?: string;
}): Promise<CopilotMemoryContext> {
  const [resumeSummary, goalsSummary, applicationsSummary, chatHistorySummary, relevantResumeChunks] =
    await Promise.all([
      buildResumeSummary(params.userId),
      buildGoalsSummary(params.userId),
      buildApplicationsSummary(params.userId),
      buildChatHistorySummary(params.userId, params.sessionId),
      getRelevantResumeChunkTexts(params.userId, params.message),
    ]);

  return {
    resumeSummary,
    goalsSummary,
    applicationsSummary,
    chatHistorySummary,
    relevantResumeChunks,
  };
}

function compactList(values: string[], maxItems = 8): string {
  const compactedValues = values.map((value) => value.trim()).filter(Boolean).slice(0, maxItems);
  return compactedValues.length > 0 ? compactedValues.map((value) => `- ${value}`).join("\n") : "None available.";
}

async function buildResumeSummary(userId: string): Promise<string> {
  const resumeDocument = await ResumeDocumentModel.findOne({
    userId,
    status: "parsed",
    parsedResumeId: { $exists: true },
  }).sort({ createdAt: -1 });

  if (!resumeDocument?.parsedResumeId) {
    return "No parsed resume is available yet.";
  }

  const parsedResume = await ParsedResumeModel.findOne({
    _id: resumeDocument.parsedResumeId,
    userId,
  }).lean();

  if (!parsedResume) {
    return "No parsed resume is available yet.";
  }

  const profile = parsedResume.editableProfile;

  return [
    `Headline: ${profile.headline || "Not provided."}`,
    `Summary: ${profile.summary || "Not provided."}`,
    `Skills:\n${compactList(profile.skills ?? [])}`,
    `Projects:\n${compactList(profile.projects ?? [], 5)}`,
    `Experience:\n${compactList(profile.experience ?? [], 5)}`,
    `Education:\n${compactList(profile.education ?? [], 5)}`,
  ].join("\n\n");
}

async function buildGoalsSummary(userId: string): Promise<string> {
  const goals = await GoalModel.find({ userId }).sort({ targetDate: 1, createdAt: -1 }).limit(8).lean();

  if (goals.length === 0) {
    return "No goals are available yet.";
  }

  return goals
    .map((goal) => `- ${goal.title} (${goal.status}, ${goal.priority})${goal.targetDate ? ` due ${goal.targetDate.toISOString()}` : ""}`)
    .join("\n");
}

async function buildApplicationsSummary(userId: string): Promise<string> {
  const applications = await ApplicationModel.find({ userId, deletedAt: { $exists: false } })
    .sort({ nextActionAt: 1, createdAt: -1 })
    .limit(8)
    .lean();

  if (applications.length === 0) {
    return "No tracked applications are available yet.";
  }

  return applications
    .map((application) => `- ${application.role} at ${application.company}: ${application.status}`)
    .join("\n");
}

async function buildChatHistorySummary(userId: string, sessionId?: string): Promise<string> {
  if (!sessionId) {
    return "No prior chat history for this session.";
  }

  const messages = await ChatMessageModel.find({ userId, chatSessionId: sessionId })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  if (messages.length === 0) {
    return "No prior chat history for this session.";
  }

  return messages
    .reverse()
    .map((message) => `${message.role}: ${message.content.slice(0, 700)}`)
    .join("\n");
}

async function getRelevantResumeChunkTexts(userId: string, message: string): Promise<string[]> {
  try {
    const chunks = await retrieveRelevantResumeChunks({
      userId,
      query: message,
      limit: 5,
    });

    return chunks.map((chunk) => `[${chunk.chunkType}] ${chunk.text}`);
  } catch (error) {
    logger.warn("Relevant resume chunk retrieval skipped.", {
      reason: error instanceof Error ? error.message : "Unknown retrieval error.",
    });
    return [];
  }
}

