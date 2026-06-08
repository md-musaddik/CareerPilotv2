import mongoose, { type HydratedDocument } from "mongoose";
import type { ResumeStorageReference, ResumeWorkflow } from "@careerpilot/shared/types/resume";
import { ParsedResumeModel, type ParsedResumeDocument } from "../models/parsed-resume.model.js";
import { ProfileModel } from "../models/profile.model.js";
import { ResumeDocumentModel, type ResumeDocument } from "../models/resume-document.model.js";
import type { EditableResumeProfile, StructuredResumeData } from "../types/resume.js";
import { HttpError } from "../utils/http-error.js";
import { extractResumeText } from "./resume-extraction.service.js";
import { parseResumeText } from "./resume-parser.service.js";
import { uploadOriginalResume } from "./resume-storage.service.js";
import { indexParsedResumeForRetrieval } from "./rag.service.js";

const { Types } = mongoose;

type UploadedResumeFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

export async function uploadAndParseResume(userId: string, file: UploadedResumeFile): Promise<ResumeWorkflow> {
  const storedResume = await uploadOriginalResume({
    userId,
    fileName: file.originalname,
    mimeType: file.mimetype,
    buffer: file.buffer,
  });

  const resumeDocument = await ResumeDocumentModel.create({
    userId,
    storage: storedResume.storage,
    fileName: file.originalname,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    status: "parsing",
  });

  try {
    const rawText = await extractResumeText(file.buffer, file.mimetype);

    if (!rawText) {
      throw new HttpError(400, "RESUME_TEXT_EMPTY", "No readable text could be extracted from this resume.");
    }

    const parsed = parseResumeText(rawText);
    const parsedResume = await ParsedResumeModel.create({
      userId,
      resumeDocumentId: resumeDocument._id,
      rawText,
      structuredData: parsed.structuredData,
      editableProfile: parsed.editableProfile,
    });

    resumeDocument.status = "parsed";
    resumeDocument.parsedResumeId = parsedResume._id;
    await resumeDocument.save();

    await upsertEditableProfile(userId, parsed.editableProfile);
    await indexParsedResumeForRetrieval({
      userId,
      resumeDocumentId: resumeDocument._id.toString(),
      parsedResumeId: parsedResume._id.toString(),
      structuredData: parsed.structuredData,
    });

    return toResumeResponse(resumeDocument, parsedResume);
  } catch (error) {
    resumeDocument.status = "failed";
    resumeDocument.errorMessage = error instanceof Error ? error.message : "Resume parsing failed.";
    await resumeDocument.save();
    throw error;
  }
}

export async function getCurrentResume(userId: string): Promise<ResumeWorkflow | null> {
  const resumeDocument = await ResumeDocumentModel.findOne({
    userId,
    status: "parsed",
    parsedResumeId: { $exists: true },
  }).sort({ createdAt: -1 });

  if (!resumeDocument || !resumeDocument.parsedResumeId) {
    return null;
  }

  const parsedResume = await ParsedResumeModel.findOne({
    _id: resumeDocument.parsedResumeId,
    userId,
  });

  if (!parsedResume) {
    return null;
  }

  return toResumeResponse(resumeDocument, parsedResume);
}

export async function updateParsedResume(params: {
  userId: string;
  resumeId: string;
  structuredData: StructuredResumeData;
  editableProfile: EditableResumeProfile;
}): Promise<ResumeWorkflow> {
  if (!Types.ObjectId.isValid(params.resumeId)) {
    throw new HttpError(400, "INVALID_RESUME_ID", "Resume ID is invalid.");
  }

  const parsedResume = await ParsedResumeModel.findOne({
    _id: params.resumeId,
    userId: params.userId,
  });

  if (!parsedResume) {
    throw new HttpError(404, "RESUME_NOT_FOUND", "Resume not found.");
  }

  parsedResume.structuredData = params.structuredData;
  parsedResume.editableProfile = params.editableProfile;
  await parsedResume.save();

  await upsertEditableProfile(params.userId, params.editableProfile);

  const resumeDocument = await ResumeDocumentModel.findOne({
    _id: parsedResume.resumeDocumentId,
    userId: params.userId,
  });

  if (!resumeDocument) {
    throw new HttpError(404, "RESUME_DOCUMENT_NOT_FOUND", "Resume metadata not found.");
  }

  await indexParsedResumeForRetrieval({
    userId: params.userId,
    resumeDocumentId: resumeDocument._id.toString(),
    parsedResumeId: parsedResume._id.toString(),
    structuredData: params.structuredData,
  });

  return toResumeResponse(resumeDocument, parsedResume);
}

async function upsertEditableProfile(userId: string, editableProfile: EditableResumeProfile): Promise<void> {
  await ProfileModel.updateOne(
    { userId },
    {
      $set: {
        headline: editableProfile.headline,
        summary: editableProfile.summary,
        skills: editableProfile.skills,
        projects: editableProfile.projects,
        experience: editableProfile.experience,
        education: editableProfile.education,
      },
    },
    { upsert: true },
  );
}

function toResumeResponse(
  resumeDocument: HydratedDocument<ResumeDocument>,
  parsedResume: HydratedDocument<ParsedResumeDocument>,
): ResumeWorkflow {
  return {
    resumeDocument: {
      id: resumeDocument._id.toString(),
      fileName: resumeDocument.fileName,
      mimeType: resumeDocument.mimeType,
      sizeBytes: resumeDocument.sizeBytes,
      storage: normalizeStorageReference(resumeDocument),
      status: resumeDocument.status,
      createdAt: resumeDocument.createdAt?.toISOString(),
      updatedAt: resumeDocument.updatedAt?.toISOString(),
    },
    parsedResume: {
      id: parsedResume._id.toString(),
      rawText: parsedResume.rawText,
      structuredData: {
        skills: parsedResume.structuredData.skills ?? [],
        projects: parsedResume.structuredData.projects ?? [],
        experience: parsedResume.structuredData.experience ?? [],
        education: parsedResume.structuredData.education ?? [],
      },
      editableProfile: {
        headline: parsedResume.editableProfile.headline ?? "",
        summary: parsedResume.editableProfile.summary ?? "",
        skills: parsedResume.editableProfile.skills ?? [],
        projects: parsedResume.editableProfile.projects ?? [],
        experience: parsedResume.editableProfile.experience ?? [],
        education: parsedResume.editableProfile.education ?? [],
      },
      createdAt: parsedResume.createdAt?.toISOString(),
      updatedAt: parsedResume.updatedAt?.toISOString(),
    },
  };
}

function normalizeStorageReference(resumeDocument: HydratedDocument<ResumeDocument>): ResumeStorageReference {
  if (resumeDocument.storage?.provider && resumeDocument.storage.reference) {
    return {
      provider: resumeDocument.storage.provider,
      reference: resumeDocument.storage.reference,
      publicId: resumeDocument.storage.publicId ?? undefined,
      resourceType: resumeDocument.storage.resourceType ?? undefined,
      secureUrl: resumeDocument.storage.secureUrl ?? undefined,
    };
  }

  if (resumeDocument.storagePath) {
    return {
      provider: "firebase-storage",
      reference: resumeDocument.storagePath,
    };
  }

  throw new HttpError(500, "RESUME_STORAGE_MISSING", "Resume storage metadata is missing.");
}
