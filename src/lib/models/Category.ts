import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const categorySchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, maxlength: 40 },
    name: {
      en: { type: String, default: "", maxlength: 80 },
      si: { type: String, default: "", maxlength: 80 },
    },
    order: { type: Number, default: 100 },
    builtin: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type CategoryDoc = InferSchemaType<typeof categorySchema>;
export const CategoryModel: Model<CategoryDoc> =
  (mongoose.models.Category as Model<CategoryDoc>) || mongoose.model<CategoryDoc>("Category", categorySchema);
