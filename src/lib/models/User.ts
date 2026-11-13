import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { SIDES } from "../types";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 120 },
    passwordHash: { type: String, required: true },
    // "member" is the old name for "editor"; it is still accepted when reading and migrated by `npm run seed`.
    role: { type: String, enum: ["admin", "editor", "member"], default: "editor" },
    side: { type: String, enum: SIDES, default: "bride" },
    // Admins can always manage vendors. This flag lets the admin allow one specific editor to do it too.
    canManageVendors: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User: Model<UserDoc> = (mongoose.models.User as Model<UserDoc>) || mongoose.model<UserDoc>("User", userSchema);
