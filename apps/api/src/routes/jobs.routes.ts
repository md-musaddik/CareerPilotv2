import { Router } from "express";
import { searchJobsController } from "../controllers/jobs-controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import { searchJobsSchema } from "../schemas/jobs.schemas.js";
import { asyncHandler } from "../utils/async-handler.js";

export const jobsRouter = Router();

jobsRouter.use(requireAuth);
jobsRouter.get("/search", validateRequest(searchJobsSchema), asyncHandler(searchJobsController));

