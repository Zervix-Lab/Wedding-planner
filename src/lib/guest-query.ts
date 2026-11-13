// Shared by the Guests page and the Excel export so "what you see" is exactly "what you download".
import { Types, type QueryFilter } from "mongoose";
import type { GuestDoc } from "./models/Guest";
import { GROUPS, RSVPS, SIDES, type Group, type Rsvp, type Side } from "./types";
import { oneOf } from "./validate";

export interface GuestParams {
  q: string;
  side: Side | "";
  group: Group | "";
  rsvp: Rsvp | "";
  /** true = only the guests the signed-in user added */
  mine: boolean;
  page: number;
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function parseGuestParams(sp: Record<string, string | string[] | undefined>): GuestParams {
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : (sp[k] as string | undefined));
  return {
    q: (one("q") ?? "").trim().slice(0, 60),
    side: oneOf(one("side"), SIDES) ?? "",
    group: oneOf(one("group"), GROUPS) ?? "",
    rsvp: oneOf(one("rsvp"), RSVPS) ?? "",
    mine: one("mine") === "1",
    page: Math.max(1, Math.floor(Number(one("page")) || 1)),
  };
}

/** `meId` = the signed-in user's id; it is only used when the "mine" filter is on. */
export function buildGuestFilter(p: GuestParams, meId: string): QueryFilter<GuestDoc> {
  const filter: QueryFilter<GuestDoc> = {};
  if (p.mine && Types.ObjectId.isValid(meId)) filter.addedBy = new Types.ObjectId(meId);
  if (p.side) filter.side = p.side;
  if (p.group) filter.group = p.group;
  if (p.rsvp) filter.rsvp = p.rsvp;
  if (p.q) {
    const rx = new RegExp(escapeRegex(p.q), "i");
    filter.$or = [{ "name.en": rx }, { "name.si": rx }, { phone: rx }];
  }
  return filter;
}
