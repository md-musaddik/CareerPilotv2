import type { User } from "firebase/auth";
import { apiConfig } from "@/config/api";
import type { CopilotStreamRequest } from "@/features/copilot/types";

type StreamHandlers = {
  onDelta: (delta: string) => void;
  onDone: (sessionId: string, content: string) => void;
};

type StreamEventPayload = {
  delta?: string;
  sessionId?: string;
  message?: {
    content?: string;
  };
};

export async function streamCopilotResponse(
  user: User | null,
  request: CopilotStreamRequest,
  handlers: StreamHandlers,
): Promise<void> {
  if (!user) {
    throw new Error("You must be signed in to use the AI Assistant.");
  }

  const token = await user.getIdToken();
  const response = await fetch(`${apiConfig.baseUrl}/copilot/chat/stream`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok || !response.body) {
    throw new Error(`AI Assistant request failed with status ${response.status}.`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      handleSseEvent(event, handlers);
    }
  }

  if (buffer) {
    handleSseEvent(buffer, handlers);
  }
}

function handleSseEvent(eventText: string, handlers: StreamHandlers): void {
  const eventType = eventText
    .split("\n")
    .find((line) => line.startsWith("event: "))
    ?.replace("event: ", "")
    .trim();
  const dataLine = eventText
    .split("\n")
    .find((line) => line.startsWith("data: "));

  if (!eventType || !dataLine) {
    return;
  }

  const payload = JSON.parse(dataLine.replace("data: ", "")) as StreamEventPayload;

  if (eventType === "delta" && payload.delta) {
    handlers.onDelta(payload.delta);
  }

  if (eventType === "done") {
    handlers.onDone(payload.sessionId ?? "", payload.message?.content ?? "");
  }

  if (eventType === "error") {
    throw new Error(typeof payload.message === "string" ? payload.message : "AI Assistant response failed.");
  }
}
