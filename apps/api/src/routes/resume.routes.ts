import { Router } from "express";
import {
  getCurrentResumeController,
  updateResumeController,
  uploadResume,
} from "../controllers/resume-controller.js";
import { resumeUploadMiddleware } from "../middleware/file-upload.middleware.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import { updateResumeSchema } from "../schemas/resume.schemas.js";
import { asyncHandler } from "../utils/async-handler.js";

export const resumeRouter = Router();

resumeRouter.use(requireAuth);

resumeRouter.get("/current", asyncHandler(getCurrentResumeController));
resumeRouter.post("/upload", resumeUploadMiddleware.single("resume"), asyncHandler(uploadResume));
resumeRouter.patch(
  "/:resumeId",
  validateRequest(updateResumeSchema),
  asyncHandler(updateResumeController),
);

