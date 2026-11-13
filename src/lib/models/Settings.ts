import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

// Single-document collection (key = "main") holding the couple's public details.
const settingsSchema = new Schema({
  key: { type: String, default: "main", unique: true },
  brideName: { type: String, trim: true, default: "", maxlength: 60 },
  groomName: { type: String, trim: true, default: "", maxlength: 60 },
  weddingDate: { type: Date, default: null },
  message: { type: String, trim: true, default: "", maxlength: 400 },
  weddingTime: { type: String, default: "", maxlength: 5 },
  weddingVenue: { type: String, trim: true, default: "", maxlength: 200 },
  weddingMap: { type: String, trim: true, default: "", maxlength: 300 },
});

export type SettingsDoc = InferSchemaType<typeof settingsSchema>;
export const Settings: Model<SettingsDoc> =
  (mongoose.models.Settings as Model<SettingsDoc>) || mongoose.model<SettingsDoc>("Settings", settingsSchema);
