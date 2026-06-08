import mongoose, { type InferSchemaType, type Model } from "mongoose";

const { model, models, Schema } = mongoose;

const taskSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: ["todo", "in_progress", "completed", "cancelled"],
      default: "todo",
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      required: true,
    },
    dueAt: { type: Date },
    completedAt: { type: Date },
    relatedEntityType: { type: String, trim: true },
    relatedEntityId: { type: String, trim: true },
  },
  {
    collection: "tasks",
    timestamps: true,
  },
);

taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ userId: 1, dueAt: 1 });
taskSchema.index({ userId: 1, createdAt: -1 });

export type TaskDocument = InferSchemaType<typeof taskSchema>;

export const TaskModel =
  (models.Task as Model<TaskDocument> | undefined) ?? model<TaskDocument>("Task", taskSchema);
