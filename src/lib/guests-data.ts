// Cached read helpers for guest data. Cached on the server with the tag "guests"; every guest change calls
// revalidateTag("guests"), so screens are instant when nothing changed and always correct right after a change.
import { unstable_cache } from "next/cache";
import { toBi } from "./bi";
import { connectDB } from "./db";
import { buildGuestFilter } from "./guest-query";
import { Guest } from "./models/Guest";
import type { Bi, Group, GuestDTO, Rsvp, Side } from "./types";

export const GUEST_PAGE_SIZE = 50;

interface Facet {
  _id: string;
  count: number;
  people: number;
}

export interface GuestStats {
  side: Facet[];
  rsvp: Facet[];
  inv: Facet[];
  latest: { id: string; name: Bi; side: Side; addedByName: string }[];
}

/** Everything the dashboard needs about guests, in one cached read. */
export const getGuestStats = unstable_cache(
  async (): Promise<GuestStats> => {
    await connectDB();
    const [facets, latest] = await Promise.all([
      Guest.aggregate<{ side: Facet[]; rsvp: Facet[]; inv: Facet[] }>([
        {
          $facet: {
            side: [{ $group: { _id: "$side", count: { $sum: 1 }, people: { $sum: { $add: ["$adults", "$kids"] } } } }],
            rsvp: [{ $group: { _id: "$rsvp", count: { $sum: 1 }, people: { $sum: { $add: ["$adults", "$kids"] } } } }],
            inv: [{ $group: { _id: "$invitation", count: { $sum: 1 }, people: { $sum: 0 } } }],
          },
        },
      ]),
      Guest.find()
        .sort({ _id: -1 })
        .limit(5)
        .select("name side addedBy")
        .populate<{ addedBy: { name: string } | null }>("addedBy", "name")
        .lean(),
    ]);
    const f = facets[0] ?? { side: [], rsvp: [], inv: [] };
    return {
      ...f,
      latest: latest.map((g) => ({ id: String(g._id), name: toBi(g.name), side: g.side, addedByName: g.addedBy?.name ?? "" })),
    };
  },
  ["guest-stats"],
  { tags: ["guests"], revalidate: 120 },
);

export interface GuestsPage {
  guests: GuestDTO[];
  summary: { count: number; adults: number; kids: number };
  page: number;
  pages: number;
  hasAny: boolean;
}

/** One page of the filtered guest list. The filter values are part of the cache key. */
export const getGuestsPage = unstable_cache(
  async (q: string, side: string, group: string, rsvp: string, mineId: string, pageReq: number): Promise<GuestsPage> => {
    await connectDB();
    // mineId = "" means everyone's guests; otherwise only the guests added by that user
    const filter = buildGuestFilter({ q, side: side as Side | "", group: group as Group | "", rsvp: rsvp as Rsvp | "", mine: mineId !== "", page: pageReq }, mineId);
    const [totals, anyGuest] = await Promise.all([
      Guest.aggregate<{ count: number; adults: number; kids: number }>([
        { $match: filter },
        { $group: { _id: null, count: { $sum: 1 }, adults: { $sum: "$adults" }, kids: { $sum: "$kids" } } },
      ]),
      Guest.exists({}),
    ]);
    const summary = totals[0] ? { count: totals[0].count, adults: totals[0].adults, kids: totals[0].kids } : { count: 0, adults: 0, kids: 0 };
    const pages = Math.max(1, Math.ceil(summary.count / GUEST_PAGE_SIZE));
    const page = Math.min(pageReq, pages);

    const docs = await Guest.find(filter)
      .sort({ "name.en": 1, "name.si": 1, _id: 1 })
      .skip((page - 1) * GUEST_PAGE_SIZE)
      .limit(GUEST_PAGE_SIZE)
      .populate<{ addedBy: { _id: unknown; name: string } | null }>("addedBy", "name")
      .lean();

    const guests: GuestDTO[] = docs.map((g) => ({
      _id: String(g._id),
      name: toBi(g.name),
      phone: g.phone ?? "",
      side: g.side,
      group: g.group ?? "other",
      adults: g.adults ?? 1,
      kids: g.kids ?? 0,
      invitation: g.invitation ?? "not_sent",
      rsvp: g.rsvp ?? "pending",
      notes: g.notes ?? "",
      addedById: g.addedBy ? String(g.addedBy._id) : "",
      addedByName: g.addedBy?.name ?? "",
    }));
    return { guests, summary, page, pages, hasAny: Boolean(anyGuest) };
  },
  ["guests-page"],
  { tags: ["guests"], revalidate: 120 },
);
