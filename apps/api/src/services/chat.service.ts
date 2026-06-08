import OpenAI from "openai";
import mongoose from "mongoose";
import { config } from "../config/env.js";
import { ChatMessageModel } from "../models/chat-message.model.js";
import { ChatSessionModel } from "../models/chat-session.model.js";
import type { CopilotActionType, CopilotMemoryContext, CopilotRequest } from "../types/copilot.js";
import { HttpError } from "../utils/http-error.js";
import { getCoverLetterInstruction } from "./cover-letter.service.js";
import { getInterviewCoachInstruction } from "./interview-coach.service.js";
import { buildCopilotMemoryContext } from "./copilot-memory.service.js";
import { getRoadmapInstruction } from "./roadmap.service.js";

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

const { Types } = mongoose;

type ChatCompletionMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type CopilotCompletionResult = {
  sessionId: string;
  message: {
    role: "assistant";
    content: string;
  };
};

type StreamDeltaHandler = (delta: string) => void;

export async function createCopilotCompletion(params: {
  userId: string;
  request: CopilotRequest;
}): Promise<CopilotCompletionResult> {
  const session = await getOrCreateChatSession(params.userId, params.request);
  const memoryContext = await buildCopilotMemoryContext({
    userId: params.userId,
    message: params.request.message,
    sessionId: session._id.toString(),
  });
  const messages = buildMessages(params.request.actionType, params.request.message, memoryContext);

  await ChatMessageModel.create({
    userId: params.userId,
    chatSessionId: session._id,
    role: "user",
    content: params.request.message,
    model: config.openaiModel,
  });

  const response = await openai.chat.completions.create({
    model: config.openaiModel,
    messages,
  });
  const content = response.choices[0]?.message.content?.trim() ?? "";

  await ChatMessageModel.create({
    userId: params.userId,
    chatSessionId: session._id,
    role: "assistant",
    content,
    model: config.openaiModel,
    metadata: {
      actionType: params.request.actionType,
    },
  });

  return {
    sessionId: session._id.toString(),
    message: {
      role: "assistant",
      content,
    },
  };
}

export async function streamCopilotCompletion(params: {
  userId: string;
  request: CopilotRequest;
  onDelta: StreamDeltaHandler;
}): Promise<CopilotCompletionResult> {
  const session = await getOrCreateChatSession(params.userId, params.request);
  const memoryContext = await buildCopilotMemoryContext({
    userId: params.userId,
    message: params.request.message,
    sessionId: session._id.toString(),
  });
  const messages = buildMessages(params.request.actionType, params.request.message, memoryContext);

  await ChatMessageModel.create({
    userId: params.userId,
    chatSessionId: session._id,
    role: "user",
    content: params.request.message,
    model: config.openaiModel,
  });

  const stream = await openai.chat.completions.create({
    model: config.openaiModel,
    messages,
    //temperature: 0.4,
    stream: true,
  });

  let content = "";

  for await (const event of stream) {
    const delta = event.choices[0]?.delta.content ?? "";

    if (!delta) {
      continue;
    }

    content += delta;
    params.onDelta(delta);
  }

  await ChatMessageModel.create({
    userId: params.userId,
    chatSessionId: session._id,
    role: "assistant",
    content,
    model: config.openaiModel,
    metadata: {
      actionType: params.request.actionType,
    },
  });

  return {
    sessionId: session._id.toString(),
    message: {
      role: "assistant",
      content,
    },
  };
}

async function getOrCreateChatSession(userId: string, request: CopilotRequest) {
  if (request.sessionId) {
    if (!Types.ObjectId.isValid(request.sessionId)) {
      throw new HttpError(400, "INVALID_SESSION_ID", "Chat session ID is invalid.");
    }

    const existingSession = await ChatSessionModel.findOne({
      _id: request.sessionId,
      userId,
    });

    if (!existingSession) {
      throw new HttpError(404, "CHAT_SESSION_NOT_FOUND", "Chat session not found.");
    }

    return existingSession;
  }

  return ChatSessionModel.create({
    userId,
    title: createSessionTitle(request.actionType, request.message),
    type: mapActionToSessionType(request.actionType),
    status: "active",
    model: config.openaiModel,
    metadata: {
      actionType: request.actionType,
    },
  });
}

function buildMessages(
  actionType: CopilotActionType,
  userMessage: string,
  memoryContext: CopilotMemoryContext,
): ChatCompletionMessage[] {
  return [
    {
      role: "system",
      content: buildSystemPrompt(actionType, memoryContext),
    },
    {
      role: "user",
      content: userMessage,
    },
  ];
}

function buildSystemPrompt(actionType: CopilotActionType, memoryContext: CopilotMemoryContext): string {
  return [
    "You are CareerPilot's AI Assistant. Give practical, specific career guidance.",
    "Use the provided memory context. If critical details are missing, ask concise follow-up questions.",
    "Do not claim that an application was submitted or an external action was completed.",
    "Keep responses structured, skimmable, and actionable.",
    getActionInstruction(actionType),
    "",
    "MEMORY CONTEXT",
    `Resume:\n${memoryContext.resumeSummary}`,
    `Goals:\n${memoryContext.goalsSummary}`,
    `Applications:\n${memoryContext.applicationsSummary}`,
    `Chat history:\n${memoryContext.chatHistorySummary}`,
    `Relevant resume chunks:\n${memoryContext.relevantResumeChunks.length > 0 ? memoryContext.relevantResumeChunks.join("\n\n") : "None available."}`,
  ].join("\n\n");
}

function getActionInstruction(actionType: CopilotActionType): string {
  switch (actionType) {
    case "resume_review":
      return "Review the resume for clarity, impact, gaps, and recruiter readability. Provide prioritized fixes.";
    case "skill_gap_analysis":
      return "Analyze skill gaps against the user's target direction. Separate must-have skills from nice-to-have skills.";
    case "career_roadmap":
      return getRoadmapInstruction();
    case "cover_letter":
      return getCoverLetterInstruction();
    case "interview_coach":
      return getInterviewCoachInstruction();
    case "career_chat":
    default:
      return "Answer as a general career copilot using the user's context.";
  }
}

function createSessionTitle(actionType: CopilotActionType, message: string): string {
  const titlePrefix = actionType
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return `${titlePrefix}: ${message.slice(0, 48)}`;
}

function mapActionToSessionType(actionType: CopilotActionType): "copilot" | "interview_coach" | "roadmap" | "cover_letter" {
  if (actionType === "interview_coach") {
    return "interview_coach";
  }

  if (actionType === "career_roadmap") {
    return "roadmap";
  }

  if (actionType === "cover_letter") {
    return "cover_letter";
  }

  return "copilot";
}
