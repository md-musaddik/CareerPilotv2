import type { Request, Response } from "express";
import { createCopilotCompletion, streamCopilotCompletion } from "../services/chat.service.js";
import { HttpError } from "../utils/http-error.js";

export async function createCopilotChatController(request: Request, response: Response): Promise<void> {
  if (!request.auth) {
    throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required.");
  }

  const result = await createCopilotCompletion({
    userId: request.auth.userId,
    request: request.body,
  });

  response.status(200).json(result);
}

export async function streamCopilotChatController(request: Request, response: Response): Promise<void> {
  if (!request.auth) {
    throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required.");
  }

  response.writeHead(200, {
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "Content-Type": "text/event-stream",
  });

  function sendEvent(type: string, payload: unknown): void {
    response.write(`event: ${type}\n`);
    response.write(`data: ${JSON.stringify(payload)}\n\n`);
  }

  try {
    const result = await streamCopilotCompletion({
      userId: request.auth.userId,
      request: request.body,
      onDelta: (delta) => sendEvent("delta", { delta }),
    });

    sendEvent("done", result);
    response.end();
  } catch (error) {
    sendEvent("error", {
      message: error instanceof Error ? error.message : "Copilot response failed.",
    });
    response.end();
  }
}

