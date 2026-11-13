// Pure budget maths. Used in the browser (instant totals, no server round-trip) AND on the server
// (dashboard "final plan total"). Totals are never stored: they are always derived from CURRENT vendor prices.
import type { Category, PlanSelection, VendorDTO, VendorOptionDTO } from "./types";

export interface Calc {
  adults: number;
  kids: number;
  /** true when adults+kids < minPlates so the minimum is charged instead */
  minApplied: boolean;
  minPlates: number;
  adultsCost: number;
  kidsCost: number;
  /** cost before service charge */
  base: number;
  serviceChargePct: number;
  service: number;
  total: number;
}

/**
 *  fixed      -> option.price
 *  per_plate  -> adults*price + kids*(kidsPrice ?? price); if adults+kids < minPlates -> minPlates*price;
 *                then + serviceCharge %
 */
export function calcOption(
  vendor: Pick<VendorDTO, "serviceCharge" | "minPlates">,
  option: Pick<VendorOptionDTO, "priceType" | "price" | "kidsPrice">,
  adults: number,
  kids: number,
): Calc {
  if (option.priceType === "fixed") {
    return {
      adults, kids, minApplied: false, minPlates: 0, adultsCost: 0, kidsCost: 0,
      base: option.price, serviceChargePct: 0, service: 0, total: option.price,
    };
  }
  const kidsPrice = option.kidsPrice ?? option.price;
  const minApplied = vendor.minPlates > 0 && adults + kids < vendor.minPlates;
  const adultsCost = adults * option.price;
  const kidsCost = kids * kidsPrice;
  const base = minApplied ? vendor.minPlates * option.price : adultsCost + kidsCost;
  const service = Math.round((base * vendor.serviceCharge) / 100);
  return {
    adults, kids, minApplied, minPlates: vendor.minPlates, adultsCost, kidsCost,
    base, serviceChargePct: vendor.serviceCharge, service, total: base + service,
  };
}

export interface Choice {
  vendorId: string;
  optionId: string;
}
/** Any number of packages can be ticked in a category (a hotel hall AND a menu, two photo packages, ...). */
export type PickMap = Record<Category, Choice[] | undefined>;

export const sameChoice = (a: Choice, b: Choice): boolean => a.vendorId === b.vendorId && a.optionId === b.optionId;

export interface Line {
  category: Category;
  vendor: VendorDTO;
  option: VendorOptionDTO;
  calc: Calc;
}

export function indexVendors(vendors: VendorDTO[]): Map<string, VendorDTO> {
  return new Map(vendors.map((v) => [v._id, v]));
}

/** Turns saved plan selections into one pick per category. Anything deleted since saving is reported as `missing`. */
export function picksFromSelections(selections: PlanSelection[], byId: Map<string, VendorDTO>): { picks: PickMap; missing: number } {
  const picks: PickMap = {};
  let missing = 0;
  for (const s of selections) {
    const v = byId.get(s.vendor);
    if (!v || !v.options.some((o) => o._id === s.optionId)) {
      missing++;
      continue;
    }
    const choice = { vendorId: v._id, optionId: s.optionId };
    const list = (picks[v.category] ??= []);
    if (!list.some((c) => sameChoice(c, choice))) list.push(choice);
  }
  return { picks, missing };
}

/** `order` = category slugs in display order (lines are always listed in this order). */
export function selectionsFromPicks(picks: PickMap, order: string[]): PlanSelection[] {
  return order.flatMap((c) => (picks[c] ?? []).map((p) => ({ vendor: p.vendorId, optionId: p.optionId })));
}

export function buildLines(picks: PickMap, byId: Map<string, VendorDTO>, adults: number, kids: number, order: string[]): Line[] {
  const lines: Line[] = [];
  for (const category of order) {
    for (const p of picks[category] ?? []) {
      const vendor = byId.get(p.vendorId);
      const option = vendor?.options.find((o) => o._id === p.optionId);
      if (!vendor || !option) continue;
      lines.push({ category, vendor, option, calc: calcOption(vendor, option, adults, kids) });
    }
  }
  return lines;
}

export const sumLines = (lines: Line[]): number => lines.reduce((s, l) => s + l.calc.total, 0);

export interface Counts {
  adults: number;
  kids: number;
}

/** Guest-list headcount split by RSVP status. */
export interface GuestCounts {
  confirmed: Counts;
  maybe: Counts;
  pending: Counts;
  declined: Counts;
}

/** confirmed = only people who said they are coming; all = everyone not declined (coming + maybe + waiting). */
export type ListBasis = "confirmed" | "all";
export const LIST_BASES: readonly ListBasis[] = ["confirmed", "all"];

export function listCounts(g: GuestCounts, basis: ListBasis): Counts {
  if (basis === "confirmed") return g.confirmed;
  return {
    adults: g.confirmed.adults + g.maybe.adults + g.pending.adults,
    kids: g.confirmed.kids + g.maybe.kids + g.pending.kids,
  };
}

export interface CountSource {
  adults: number;
  kids: number;
  useGuestList: boolean;
  listBasis: ListBasis;
  extraAdults: number;
  extraKids: number;
}

/** The headcount a plan should use right now: typed numbers, or the guest list plus any extra people. */
export function planCounts(plan: CountSource, guests: GuestCounts): Counts {
  if (!plan.useGuestList) return { adults: plan.adults, kids: plan.kids };
  const base = listCounts(guests, plan.listBasis);
  return { adults: base.adults + plan.extraAdults, kids: base.kids + plan.extraKids };
}
