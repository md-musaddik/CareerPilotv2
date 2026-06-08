import mongoose, { type InferSchemaType, type Model } from "mongoose";

const { model, models, Schema } = mongoose;

const chatMessageSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    chatSessionId: { type: Schema.Types.ObjectId, ref: "ChatSession", required: true, index: true },
    role: {
      type: String,
      enum: ["system", "user", "assistant"],
      required: true,
    },
    content: { type: String, required: true },
    model: { type: String, trim: true },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    collection: "chatMessages",
    timestamps: true,
  },
);

chatMessageSchema.index({ userId: 1, chatSessionId: 1, createdAt: 1 });
chatMessageSchema.index({ userId: 1, createdAt: -1 });

export type ChatMessageDocument = InferSchemaType<typeof chatMessageSchema>;

export const ChatMessageModel =
  (models.ChatMessage as Model<ChatMessageDocument> | undefined) ??
  model<ChatMessageDocument>("ChatMessage", chatMessageSchema);
