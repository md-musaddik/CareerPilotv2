import mongoose, { type InferSchemaType, type Model } from "mongoose";

const { model, models, Schema } = mongoose;

const savedJobSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    provider: { type: String, required: true, trim: true },
    providerJobId: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    description: { type: String },
    url: { type: String, trim: true },
    salaryMin: { type: Number },
    salaryMax: { type: Number },
    currency: { type: String, trim: true },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    collection: "savedJobs",
    timestamps: true,
  },
);

savedJobSchema.index({ userId: 1, createdAt: -1 });
savedJobSchema.index({ userId: 1, provider: 1, providerJobId: 1 }, { unique: true });

export type SavedJobDocument = InferSchemaType<typeof savedJobSchema>;

export const SavedJobModel =
  (models.SavedJob as Model<SavedJobDocument> | undefined) ??
  model<SavedJobDocument>("SavedJob", savedJobSchema);
