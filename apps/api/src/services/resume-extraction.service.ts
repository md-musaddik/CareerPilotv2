import mammoth from "mammoth";
import pdfParse from "pdf-parse";
import { HttpError } from "../utils/http-error.js";

const pdfMimeType = "application/pdf";
const docxMimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export async function extractResumeText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === pdfMimeType) {
    const result = await pdfParse(buffer);
    return normalizeExtractedText(result.text);
  }

  if (mimeType === docxMimeType) {
    const result = await mammoth.extractRawText({ buffer });
    return normalizeExtractedText(result.value);
  }

  throw new HttpError(400, "UNSUPPORTED_RESUME_TYPE", "Resume must be a PDF or DOCX file.");
}

function normalizeExtractedText(text: string): string {
  return text.replace(/\r/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

