// No Next.js imports here so `npm run seed` (plain Node) can use it too.
import { connectDB } from "./db";
import { DEFAULT_CATEGORIES } from "./default-categories";
import { CategoryModel } from "./models/Category";

/** Idempotent: inserts any missing built-in category, never touches existing ones. Safe to run concurrently. */
export async function seedCategories(): Promise<void> {
  await connectDB();
  await CategoryModel.bulkWrite(
    DEFAULT_CATEGORIES.map((c, i) => ({
      updateOne: {
        filter: { slug: c.slug },
        update: { $setOnInsert: { slug: c.slug, name: c.name, order: (i + 1) * 10, builtin: true } },
        upsert: true,
      },
    })),
  );
}
