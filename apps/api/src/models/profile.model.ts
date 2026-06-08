import mongoose, { type InferSchemaType, type Model } from "mongoose";

const { model, models, Schema } = mongoose;

const profileLinkSchema = new Schema(
  {
    label: { type: String, trim: true },
    url: { type: String, trim: true },
  },
  { _id: false },
);

const profileSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    headline: { type: String, trim: true },
    summary: { type: String, trim: true },
    location: { type: String, trim: true },
    targetRoles: [{ type: String, trim: true }],
    skills: [{ type: String, trim: true }],
    projects: [{ type: String, trim: true }],
    experience: [{ type: String, trim: true }],
    education: [{ type: String, trim: true }],
    links: [profileLinkSchema],
    preferences: {
      remotePreference: { type: String, enum: ["remote", "hybrid", "onsite", "flexible"], default: "flexible" },
      salaryExpectation: { type: Number },
      industries: [{ type: String, trim: true }],
    },
  },
  {
    collection: "profiles",
    timestamps: true,
  },
);

export type ProfileDocument = InferSchemaType<typeof profileSchema>;

export const ProfileModel =
  (models.Profile as Model<ProfileDocument> | undefined) ?? model<ProfileDocument>("Profile", profileSchema);
