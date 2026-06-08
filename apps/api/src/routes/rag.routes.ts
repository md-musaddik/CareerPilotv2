import { Router } from "express";
import { retrieveChunksController } from "../controllers/rag-controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import { retrieveChunksSchema } from "../schemas/rag.schemas.js";
import { asyncHandler } from "../utils/async-handler.js";

export const ragRouter = Router();

ragRouter.use(requireAuth);
ragRouter.post("/retrieve", validateRequest(retrieveChunksSchema), asyncHandler(retrieveChunksController));

