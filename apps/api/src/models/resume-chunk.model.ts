import mongoose, { type InferSchemaType, type Model } from "mongoose";

const { model, models, Schema } = mongoose;

const resumeChunkSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    resumeDocumentId: { type: String, required: true, trim: true },
    parsedResumeId: { type: String, required: true, trim: true, index: true },
    sourceId: { type: String, trim: true },
    chunkType: {
      type: String,
      enum: ["skills", "projects", "experience", "education"],
      required: true,
      index: true,
    },
    chunkIndex: { type: Number, required: true },
    text: { type: String, required: true },
    contentHash: { type: String, trim: true },
    embeddingModel: { type: String, trim: true },
    embedding: [{ type: Number }],
    metadata: { type: Schema.Types.Mixed },
  },
  {
    collection: "resumeChunks",
    timestamps: true,
  },
);

resumeChunkSchema.index({ userId: 1, resumeDocumentId: 1, chunkIndex: 1 }, { unique: true });
resumeChunkSchema.index({ userId: 1, parsedResumeId: 1 });
resumeChunkSchema.index({ userId: 1, chunkType: 1 });
resumeChunkSchema.index({ userId: 1, createdAt: -1 });

export type ResumeChunkDocument = InferSchemaType<typeof resumeChunkSchema>;

export const ResumeChunkModel =
  (models.ResumeChunk as Model<ResumeChunkDocument> | undefined) ??
  model<ResumeChunkDocument>("ResumeChunk", resumeChunkSchema);
