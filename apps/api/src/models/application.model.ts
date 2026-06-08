import mongoose, { type InferSchemaType, type Model } from "mongoose";

const { model, models, Schema } = mongoose;

const applicationSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    jobId: { type: String, trim: true },
    savedJobId: { type: Schema.Types.ObjectId, ref: "SavedJob" },
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    fitScore: { type: Number, min: 0, max: 100 },
    status: {
      type: String,
      enum: ["saved", "applied", "interviewing", "offer", "rejected", "withdrawn"],
      default: "saved",
      required: true,
    },
    source: { type: String, trim: true },
    appliedAt: { type: Date },
    nextActionAt: { type: Date },
    notes: { type: String, trim: true },
    deletedAt: { type: Date },
  },
  {
    collection: "applications",
    timestamps: true,
  },
);

applicationSchema.index({ userId: 1, status: 1 });
applicationSchema.index({ userId: 1, nextActionAt: 1 });
applicationSchema.index({ userId: 1, createdAt: -1 });

export type ApplicationDocument = InferSchemaType<typeof applicationSchema>;

export const ApplicationModel =
  (models.Application as Model<ApplicationDocument> | undefined) ??
  model<ApplicationDocument>("Application", applicationSchema);
