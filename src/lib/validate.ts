// Hand-rolled input validation for server actions (no schema library to keep the bundle small).
// Client input is never trusted: everything is re-validated and clamped here.
import type { DictKey } from "./i18n";
import { normalizeBi } from "./bi";
import {
  GROUPS,
  INVITATIONS,
  MAX_IMAGES,
  PRICE_TYPES,
  RSVPS,
  ROLES,
  SIDES,
  type Bi,
  type Group,
  type Invitation,
  type PriceType,
  type Role,
  type Rsvp,
  type Side,
} from "./types";

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: DictKey };

const bad = (error: DictKey): { ok: false; error: DictKey } => ({ ok: false, error });
export const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
export const isId = (v: unknown): v is string => typeof v === "string" && /^[a-f0-9]{24}$/i.test(v);

export function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export function num(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function oneOf<T extends string>(v: unknown, list: readonly T[]): T | null {
  return list.includes(v as T) ? (v as T) : null;
}

const biOf = (v: unknown, max: number): Bi => normalizeBi(isObj(v) ? v : null, max);
const biFilled = (b: Bi) => Boolean(b.en || b.si);

/* ---------------- category ---------------- */
export function parseNewCategory(raw: unknown): Parsed<Bi> {
  const name = biOf(raw, 80);
  return biFilled(name) ? { ok: true, value: name } : bad("err.nameRequired");
}

/* ---------------- vendor ---------------- */
export interface VendorInput {
  name: Bi;
  /** existing category slug, or "" when `newCategory` is given */
  category: string;
  newCategory: Bi | null;
  images: string[];
  contact: string;
  serviceCharge: number;
  minPlates: number;
  options: {
    _id?: string;
    name: Bi;
    priceType: PriceType;
    price: number;
    kidsPrice: number | null;
    inclusions: Bi[];
  }[];
}

export function parseVendor(raw: unknown): Parsed<VendorInput> {
  if (!isObj(raw)) return bad("err.invalid");
  const name = biOf(raw.name, 100);
  if (!biFilled(name)) return bad("err.nameRequired");

  let category = "";
  let newCategory: Bi | null = null;
  if (raw.category === "__new__") {
    const c = parseNewCategory(raw.newCategory);
    if (!c.ok) return c;
    newCategory = c.value;
  } else {
    category = str(raw.category, 40);
    if (!/^[\w-]{1,40}$/.test(category)) return bad("err.invalid");
  }

  const images = (Array.isArray(raw.images) ? raw.images : [])
    .filter((x): x is string => typeof x === "string" && /^[\w\-./]{1,200}$/.test(x))
    .slice(0, MAX_IMAGES);

  const options: VendorInput["options"] = [];
  for (const o of (Array.isArray(raw.options) ? raw.options : []).slice(0, 30)) {
    if (!isObj(o)) return bad("err.invalid");
    const oName = biOf(o.name, 100);
    const priceType = oneOf(o.priceType, PRICE_TYPES);
    if (!biFilled(oName) || !priceType) return bad("err.optionInvalid");
    const kids = o.kidsPrice === null || o.kidsPrice === "" || o.kidsPrice === undefined ? null : num(o.kidsPrice, 0, 1e9, NaN);
    options.push({
      ...(isId(o._id) ? { _id: o._id } : {}),
      name: oName,
      priceType,
      price: Math.round(num(o.price, 0, 1e9, 0)),
      kidsPrice: priceType === "per_plate" && kids !== null && Number.isFinite(kids) ? Math.round(kids) : null,
      inclusions: (Array.isArray(o.inclusions) ? o.inclusions : [])
        .map((x) => biOf(x, 120))
        .filter(biFilled)
        .slice(0, 30),
    });
  }

  return {
    ok: true,
    value: {
      name,
      category,
      newCategory,
      images,
      contact: str(raw.contact, 120),
      serviceCharge: num(raw.serviceCharge, 0, 100, 0),
      minPlates: Math.round(num(raw.minPlates, 0, 100000, 0)),
      options,
    },
  };
}

/* ---------------- guest ---------------- */
export interface GuestInput {
  name: Bi;
  phone: string;
  side: Side;
  group: Group;
  adults: number;
  kids: number;
  invitation: Invitation;
  rsvp: Rsvp;
  notes: string;
}

export function parseGuest(raw: unknown): Parsed<GuestInput> {
  if (!isObj(raw)) return bad("err.invalid");
  const name = biOf(raw.name, 100);
  if (!biFilled(name)) return bad("err.nameRequired");
  const side = oneOf(raw.side, SIDES);
  const group = oneOf(raw.group, GROUPS);
  const invitation = oneOf(raw.invitation, INVITATIONS);
  const rsvp = oneOf(raw.rsvp, RSVPS);
  if (!side || !group || !invitation || !rsvp) return bad("err.invalid");
  return {
    ok: true,
    value: {
      name,
      phone: str(raw.phone, 30),
      side,
      group,
      adults: Math.round(num(raw.adults, 0, 100, 1)),
      kids: Math.round(num(raw.kids, 0, 100, 0)),
      invitation,
      rsvp,
      notes: str(raw.notes, 500),
    },
  };
}

/* ---------------- plan ---------------- */
export interface PlanInput {
  name: string;
  adults: number;
  kids: number;
  useGuestList: boolean;
  listBasis: "confirmed" | "all";
  extraAdults: number;
  extraKids: number;
  selections: { vendor: string; optionId: string }[];
}

export function parsePlan(raw: unknown): Parsed<PlanInput> {
  if (!isObj(raw)) return bad("err.invalid");
  const name = str(raw.name, 60);
  if (!name) return bad("err.nameRequired");
  const selections: PlanInput["selections"] = [];
  for (const s of (Array.isArray(raw.selections) ? raw.selections : []).slice(0, 40)) {
    if (isObj(s) && isId(s.vendor) && isId(s.optionId)) selections.push({ vendor: s.vendor, optionId: s.optionId });
  }
  return {
    ok: true,
    value: {
      name,
      adults: Math.round(num(raw.adults, 0, 100000, 1)),
      kids: Math.round(num(raw.kids, 0, 100000, 0)),
      useGuestList: raw.useGuestList === true,
      listBasis: raw.listBasis === "all" ? "all" : "confirmed",
      extraAdults: Math.round(num(raw.extraAdults, 0, 100000, 0)),
      extraKids: Math.round(num(raw.extraKids, 0, 100000, 0)),
      selections,
    },
  };
}

/* ---------------- user ---------------- */
export interface UserInput {
  name: string;
  email: string;
  password: string; // "" means "leave unchanged" on update
  role: Role;
  side: Side;
  canManageVendors: boolean;
}

export function parseUser(raw: unknown, passwordRequired: boolean): Parsed<UserInput> {
  if (!isObj(raw)) return bad("err.invalid");
  const name = str(raw.name, 80);
  const email = str(raw.email, 120).toLowerCase();
  const password = typeof raw.password === "string" ? raw.password : "";
  const role = oneOf(raw.role, ROLES);
  const side = oneOf(raw.side, SIDES);
  if (!name) return bad("err.nameRequired");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad("err.emailInvalid");
  if (!role || !side) return bad("err.invalid");
  if ((passwordRequired || password) && (password.length < 6 || password.length > 100)) return bad("err.passwordShort");
  return { ok: true, value: { name, email, password, role, side, canManageVendors: role === "editor" && raw.canManageVendors === true } };
}
