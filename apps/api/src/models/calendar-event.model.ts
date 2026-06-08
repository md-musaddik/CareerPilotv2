import mongoose, { type InferSchemaType, type Model } from "mongoose";

const { model, models, Schema } = mongoose;

const calendarEventSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["application", "interview", "goal", "task", "reminder", "other"],
      default: "other",
      required: true,
    },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date },
    relatedEntityType: { type: String, trim: true },
    relatedEntityId: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  {
    collection: "calendarEvents",
    timestamps: true,
  },
);

calendarEventSchema.index({ userId: 1, startsAt: 1 });
calendarEventSchema.index({ userId: 1, relatedEntityType: 1, relatedEntityId: 1 });

export type CalendarEventDocument = InferSchemaType<typeof calendarEventSchema>;

export const CalendarEventModel =
  (models.CalendarEvent as Model<CalendarEventDocument> | undefined) ??
  model<CalendarEventDocument>("CalendarEvent", calendarEventSchema);
