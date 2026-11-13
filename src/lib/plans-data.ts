import { unstable_cache } from "next/cache";
import { connectDB } from "./db";
import { Guest } from "./models/Guest";
import { Plan } from "./models/Plan";
import type { Counts, GuestCounts } from "./calc";
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
      listBasis: p.listBasis === "all" ? "all" : "confirmed",
      extraAdults: p.extraAdults ?? 0,
      extraKids: p.extraKids ?? 0,
      selections: (p.selections ?? []).map((s) => ({ vendor: String(s.vendor), optionId: String(s.optionId) })),
      isFinal: p.isFinal ?? false,
      createdAt: new Date((p as unknown as { createdAt?: Date }).createdAt ?? 0).toISOString(),
    }));
  },
  ["plans-all"],
  { tags: ["plans"], revalidate: 120 },
);

/** Total adults + kids on the guest list, split by RSVP status. Cached with tag "guests". */
export const getGuestCounts = unstable_cache(
  async (): Promise<GuestCounts> => {
    await connectDB();
    const rows = await Guest.aggregate<{ _id: string; adults: number; kids: number }>([
      { $group: { _id: "$rsvp", adults: { $sum: "$adults" }, kids: { $sum: "$kids" } } },
    ]);
    const pick = (rsvp: string): Counts => {
      const r = rows.find((x) => x._id === rsvp);
      return { adults: r?.adults ?? 0, kids: r?.kids ?? 0 };
    };
    return { confirmed: pick("confirmed"), maybe: pick("maybe"), pending: pick("pending"), declined: pick("declined") };
  },
  ["guest-counts"],
  { tags: ["guests"], revalidate: 120 },
);
