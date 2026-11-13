import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { EVENTS, GROUPS, INVITATIONS, RSVPS, SIDES } from "../types";

const guestSchema = new Schema(
  {
    name: {
      en: { type: String, default: "", maxlength: 100 },
      si: { type: String, default: "", maxlength: 100 },
    },
    phone: { type: String, trim: true, default: "", maxlength: 30 },
    side: { type: String, enum: SIDES, required: true, index: true },
    group: { type: String, enum: GROUPS, default: "family" },
    adults: { type: Number, min: 0, max: 100, default: 1 },
    kids: { type: Number, min: 0, max: 100, default: 0 },
    events: { type: [{ type: String, enum: EVENTS }], default: ["wedding", "homecoming"] },
    invitation: { type: String, enum: INVITATIONS, default: "not_sent" },
    rsvp: { type: String, enum: RSVPS, default: "pending", index: true },
    notes: { type: String, default: "", maxlength: 500 },
    addedBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
  },
  { timestamps: true },
);

export type GuestDoc = InferSchemaType<typeof guestSchema>;
export const Guest: Model<GuestDoc> =
  (mongoose.models.Guest as Model<GuestDoc>) || mongoose.model<GuestDoc>("Guest", guestSchema);
