import mongoose, { type InferSchemaType, type Model } from "mongoose";

const { model, models, Schema } = mongoose;

const chatSessionSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["copilot", "interview_coach", "roadmap", "cover_letter"],
      default: "copilot",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
      required: true,
    },
    model: { type: String, trim: true },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    collection: "chatSessions",
    timestamps: true,
  },
);

chatSessionSchema.index({ userId: 1, createdAt: -1 });
chatSessionSchema.index({ userId: 1, status: 1 });

export type ChatSessionDocument = InferSchemaType<typeof chatSessionSchema>;

export const ChatSessionModel =
  (models.ChatSession as Model<ChatSessionDocument> | undefined) ??
  model<ChatSessionDocument>("ChatSession", chatSessionSchema);
