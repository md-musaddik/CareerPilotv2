import mongoose, { type InferSchemaType, type Model } from "mongoose";

const { model, models, Schema } = mongoose;

const milestoneSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["not_started", "in_progress", "completed", "paused"],
      default: "not_started",
      required: true,
    },
    dueAt: { type: Date },
    completedAt: { type: Date },
  },
  { _id: true },
);

const goalSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: ["not_started", "in_progress", "completed", "paused"],
      default: "not_started",
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      required: true,
    },
    targetDate: { type: Date },
    milestones: [milestoneSchema],
  },
  {
    collection: "goals",
    timestamps: true,
  },
);

goalSchema.index({ userId: 1, status: 1 });
goalSchema.index({ userId: 1, targetDate: 1 });
goalSchema.index({ userId: 1, createdAt: -1 });

export type GoalDocument = InferSchemaType<typeof goalSchema>;

export const GoalModel =
  (models.Goal as Model<GoalDocument> | undefined) ?? model<GoalDocument>("Goal", goalSchema);
