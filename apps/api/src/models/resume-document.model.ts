import mongoose, { type InferSchemaType, type Model } from "mongoose";

const { model, models, Schema } = mongoose;

const resumeDocumentSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    storage: {
      provider: {
        type: String,
        enum: ["cloudinary", "firebase-storage"],
        required: false,
      },
      reference: { type: String, required: false, trim: true },
      publicId: { type: String, required: false, trim: true },
      resourceType: { type: String, required: false, trim: true },
      secureUrl: { type: String, required: false, trim: true },
    },
    storagePath: { type: String, required: false, trim: true },
    fileName: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true, trim: true },
    sizeBytes: { type: Number, required: true },
    status: {
      type: String,
      enum: ["uploaded", "parsing", "parsed", "failed"],
      default: "uploaded",
      required: true,
    },
    parsedResumeId: { type: Schema.Types.ObjectId, ref: "ParsedResume" },
    errorMessage: { type: String, trim: true },
  },
  {
    collection: "resumeDocuments",
    timestamps: true,
  },
);

resumeDocumentSchema.index({ userId: 1, createdAt: -1 });
resumeDocumentSchema.index({ userId: 1, status: 1 });

export type ResumeDocument = InferSchemaType<typeof resumeDocumentSchema>;

export const ResumeDocumentModel =
  (models.ResumeDocument as Model<ResumeDocument> | undefined) ??
  model<ResumeDocument>("ResumeDocument", resumeDocumentSchema);
