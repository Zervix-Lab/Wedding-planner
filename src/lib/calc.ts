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
export type PickMap = Record<Category, Choice | undefined>;

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
    picks[v.category] = { vendorId: v._id, optionId: s.optionId };
  }
  return { picks, missing };
}

/** `order` = category slugs in display order (lines are always listed in this order). */
export function selectionsFromPicks(picks: PickMap, order: string[]): PlanSelection[] {
  return order.flatMap((c) => (picks[c] ? [{ vendor: picks[c]!.vendorId, optionId: picks[c]!.optionId }] : []));
}

export function buildLines(picks: PickMap, byId: Map<string, VendorDTO>, adults: number, kids: number, order: string[]): Line[] {
  const lines: Line[] = [];
  for (const category of order) {
    const p = picks[category];
    if (!p) continue;
    const vendor = byId.get(p.vendorId);
    const option = vendor?.options.find((o) => o._id === p.optionId);
    if (!vendor || !option) continue;
    lines.push({ category, vendor, option, calc: calcOption(vendor, option, adults, kids) });
  }
  return lines;
}

export const sumLines = (lines: Line[]): number => lines.reduce((s, l) => s + l.calc.total, 0);

export interface Counts {
  adults: number;
  kids: number;
}

/** The headcount a plan should use right now. */
export function planCounts(plan: { adults: number; kids: number; useGuestList: boolean }, confirmed: Counts): Counts {
  return plan.useGuestList ? confirmed : { adults: plan.adults, kids: plan.kids };
}
