import { Router } from "express";
import { copilotRouter } from "./copilot.routes.js";
import { healthRouter } from "./health.routes.js";
import { jobsRouter } from "./jobs.routes.js";
import { ragRouter } from "./rag.routes.js";
import { resumeRouter } from "./resume.routes.js";

export const v1Router = Router();

v1Router.get("/", (_request, response) => {
  response.status(200).json({
    name: "CareerPilot API",
    version: "v1",
  });
});

v1Router.use("/health", healthRouter);
v1Router.use("/copilot", copilotRouter);
v1Router.use("/jobs", jobsRouter);
v1Router.use("/rag", ragRouter);
v1Router.use("/resumes", resumeRouter);
