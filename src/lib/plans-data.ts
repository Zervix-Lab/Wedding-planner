import { unstable_cache } from "next/cache";
import { connectDB } from "./db";
import { Guest } from "./models/Guest";
import { Plan } from "./models/Plan";
import type { Counts } from "./calc";
import type { PlanDTO } from "./types";

/** Saved plans. Cached with tag "plans"; refreshed whenever a plan changes. */
export const getPlans = unstable_cache(
  async (): Promise<PlanDTO[]> => {
    await connectDB();
    const docs = await Plan.find().sort({ createdAt: 1 }).lean();
    return docs.map((p) => ({
      _id: String(p._id),
      name: p.name,
      adults: p.adults ?? 1,
      kids: p.kids ?? 0,
      useGuestList: p.useGuestList ?? false,
      selections: (p.selections ?? []).map((s) => ({ vendor: String(s.vendor), optionId: String(s.optionId) })),
      isFinal: p.isFinal ?? false,
      createdAt: new Date((p as unknown as { createdAt?: Date }).createdAt ?? 0).toISOString(),
    }));
  },
  ["plans-all"],
  { tags: ["plans"], revalidate: 120 },
);

/** Total adults + kids across guests who said they are coming. Cached with tag "guests". */
export const getConfirmedCounts = unstable_cache(
  async (): Promise<Counts> => {
    await connectDB();
    const [r] = await Guest.aggregate<{ adults: number; kids: number }>([
      { $match: { rsvp: "confirmed" } },
      { $group: { _id: null, adults: { $sum: "$adults" }, kids: { $sum: "$kids" } } },
    ]);
    return { adults: r?.adults ?? 0, kids: r?.kids ?? 0 };
  },
  ["confirmed-counts"],
  { tags: ["guests"], revalidate: 120 },
);
