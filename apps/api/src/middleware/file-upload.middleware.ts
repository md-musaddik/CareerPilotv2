import multer from "multer";
import { HttpError } from "../utils/http-error.js";

const allowedResumeMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const resumeUploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_request, file, callback) => {
    if (!allowedResumeMimeTypes.has(file.mimetype)) {
      callback(new HttpError(400, "UNSUPPORTED_RESUME_TYPE", "Resume must be a PDF or DOCX file."));
      return;
    }

    callback(null, true);
  },
});

