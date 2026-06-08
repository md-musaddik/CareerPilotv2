import { Router } from "express";
import { createCopilotChatController, streamCopilotChatController } from "../controllers/copilot-controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import { copilotChatSchema } from "../schemas/copilot.schemas.js";
import { asyncHandler } from "../utils/async-handler.js";

export const copilotRouter = Router();

copilotRouter.use(requireAuth);
copilotRouter.post("/chat", validateRequest(copilotChatSchema), asyncHandler(createCopilotChatController));
copilotRouter.post("/chat/stream", validateRequest(copilotChatSchema), asyncHandler(streamCopilotChatController));

