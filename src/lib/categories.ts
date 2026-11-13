import { unstable_cache } from "next/cache";
import { connectDB } from "./db";
import { toBi } from "./bi";
import { seedCategories } from "./category-seed";
import { CategoryModel } from "./models/Category";
import type { CategoryDTO } from "./types";

/** All categories in display order. Cached; refreshed with revalidateTag("categories") when one is added. */
export const getCategories = unstable_cache(
  async (): Promise<CategoryDTO[]> => {
    await connectDB();
    let docs = await CategoryModel.find().sort({ order: 1, _id: 1 }).lean();
    if (docs.length === 0) {
      await seedCategories();
      docs = await CategoryModel.find().sort({ order: 1, _id: 1 }).lean();
    }
    return docs.map((d) => ({ slug: d.slug, name: toBi(d.name), builtin: Boolean(d.builtin) }));
  },
  ["categories"],
  { tags: ["categories"], revalidate: 3600 },
);
