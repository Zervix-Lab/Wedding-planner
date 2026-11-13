import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { PRICE_TYPES } from "../types";

// Every piece of text a visitor reads is stored in both languages: { en, si }.
const bi = (max: number) => ({
  en: { type: String, default: "", maxlength: max },
  si: { type: String, default: "", maxlength: max },
});

const optionSchema = new Schema({
  name: bi(100),
  priceType: { type: String, enum: PRICE_TYPES, default: "fixed" },
  price: { type: Number, required: true, min: 0, max: 1e9 },
  kidsPrice: { type: Number, min: 0, max: 1e9, default: null },
  inclusions: { type: [new Schema(bi(120), { _id: false })], default: [] },
});

const vendorSchema = new Schema(
  {
    name: bi(100),
    category: { type: String, required: true, index: true, maxlength: 40 }, // category slug
    images: { type: [String], default: [], validate: (v: string[]) => v.length <= 3 },
    contact: { type: String, trim: true, default: "", maxlength: 120 },
    serviceCharge: { type: Number, min: 0, max: 100, default: 0 },
    minPlates: { type: Number, min: 0, max: 100000, default: 0 },
    options: { type: [optionSchema], default: [] },
    // Who added this vendor. Only this person (or an admin) may edit or delete it. Older vendors have none -> admin only.
    addedBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
  },
  { timestamps: true },
);

export type VendorDoc = InferSchemaType<typeof vendorSchema>;
export const Vendor: Model<VendorDoc> =
  (mongoose.models.Vendor as Model<VendorDoc>) || mongoose.model<VendorDoc>("Vendor", vendorSchema);
