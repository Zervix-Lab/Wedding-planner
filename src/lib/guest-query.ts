// Shared by the Guests page and the Excel export so "what you see" is exactly "what you download".
import type { QueryFilter } from "mongoose";
import type { GuestDoc } from "./models/Guest";
import { GROUPS, RSVPS, SIDES, type Group, type Rsvp, type Side } from "./types";
import { oneOf } from "./validate";

export interface GuestParams {
  q: string;
  side: Side | "";
  group: Group | "";
  rsvp: Rsvp | "";
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
    page: Math.max(1, Math.floor(Number(one("page")) || 1)),
  };
}

export function buildGuestFilter(p: GuestParams): QueryFilter<GuestDoc> {
  const filter: QueryFilter<GuestDoc> = {};
  if (p.side) filter.side = p.side;
  if (p.group) filter.group = p.group;
  if (p.rsvp) filter.rsvp = p.rsvp;
  if (p.q) {
    const rx = new RegExp(escapeRegex(p.q), "i");
    filter.$or = [{ "name.en": rx }, { "name.si": rx }, { phone: rx }];
  }
  return filter;
}
