import mongoose, { type InferSchemaType, type Model } from "mongoose";

const { model, models, Schema } = mongoose;

const structuredResumeDataSchema = new Schema(
  {
    skills: [{ type: String, trim: true }],
    projects: [{ type: String, trim: true }],
    experience: [{ type: String, trim: true }],
    education: [{ type: String, trim: true }],
  },
  { _id: false },
);

const editableProfileSchema = new Schema(
  {
    headline: { type: String, trim: true },
    summary: { type: String, trim: true },
    skills: [{ type: String, trim: true }],
    projects: [{ type: String, trim: true }],
    experience: [{ type: String, trim: true }],
    education: [{ type: String, trim: true }],
  },
  { _id: false },
);

const parsedResumeSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    resumeDocumentId: { type: Schema.Types.ObjectId, ref: "ResumeDocument", required: true, index: true },
    rawText: { type: String, required: true },
    structuredData: { type: structuredResumeDataSchema, required: true },
    editableProfile: { type: editableProfileSchema, required: true },
  },
  {
    collection: "parsedResumes",
    timestamps: true,
  },
);

parsedResumeSchema.index({ userId: 1, resumeDocumentId: 1 });
parsedResumeSchema.index({ userId: 1, createdAt: -1 });

export type ParsedResumeDocument = InferSchemaType<typeof parsedResumeSchema>;

export const ParsedResumeModel =
  (models.ParsedResume as Model<ParsedResumeDocument> | undefined) ??
  model<ParsedResumeDocument>("ParsedResume", parsedResumeSchema);
