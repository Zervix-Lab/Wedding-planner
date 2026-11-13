import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

// NOTE: totals are never stored. They are always recalculated from current vendor prices.
const planSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    adults: { type: Number, min: 0, max: 100000, default: 1 },
    kids: { type: Number, min: 0, max: 100000, default: 0 },
    useGuestList: { type: Boolean, default: false },
    // Only used when useGuestList is true: which guests to count, plus extra people on top of the list.
    listBasis: { type: String, enum: ["confirmed", "all"], default: "confirmed" },
    extraAdults: { type: Number, min: 0, max: 100000, default: 0 },
    extraKids: { type: Number, min: 0, max: 100000, default: 0 },
    selections: {
      type: [
        new Schema(
          {
            vendor: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
            optionId: { type: Schema.Types.ObjectId, required: true },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    isFinal: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export type PlanDoc = InferSchemaType<typeof planSchema>;
export const Plan: Model<PlanDoc> = (mongoose.models.Plan as Model<PlanDoc>) || mongoose.model<PlanDoc>("Plan", planSchema);
