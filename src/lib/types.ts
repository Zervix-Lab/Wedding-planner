// Shared constants + DTO types (safe to import from client and server code).

/** A category is identified by a slug. The 8 built-in ones have fixed slugs; admins can add more. */
export type Category = string;

export const SIDES = ["bride", "groom"] as const;
export type Side = (typeof SIDES)[number];

export const ROLES = ["admin", "editor"] as const;
export type Role = (typeof ROLES)[number];

export const GROUPS = ["family", "relatives", "office", "friends", "neighbours", "other"] as const;
export type Group = (typeof GROUPS)[number];

export const EVENTS = ["wedding", "homecoming"] as const;
export type WeddingEvent = (typeof EVENTS)[number];

export const INVITATIONS = ["not_sent", "given", "posted", "whatsapp"] as const;
export type Invitation = (typeof INVITATIONS)[number];

export const RSVPS = ["pending", "confirmed", "maybe", "declined"] as const;
export type Rsvp = (typeof RSVPS)[number];

export const PRICE_TYPES = ["per_plate", "fixed"] as const;
export type PriceType = (typeof PRICE_TYPES)[number];

export const MAX_IMAGES = 3;

/** Text that is stored in both languages. Whatever is typed in one language is filled into the other automatically. */
export interface Bi {
  en: string;
  si: string;
}

export interface CategoryDTO {
  slug: string;
  name: Bi;
  builtin: boolean;
}

export interface VendorOptionDTO {
  _id: string;
  name: Bi;
  priceType: PriceType;
  price: number;
  kidsPrice: number | null;
  inclusions: Bi[];
}

export interface VendorDTO {
  _id: string;
  name: Bi;
  category: Category;
  images: string[];
  contact: string;
  serviceCharge: number;
  minPlates: number;
  showOnLanding: boolean;
  options: VendorOptionDTO[];
}

export interface GuestDTO {
  _id: string;
  name: Bi;
  phone: string;
  side: Side;
  group: Group;
  adults: number;
  kids: number;
  events: WeddingEvent[];
  invitation: Invitation;
  rsvp: Rsvp;
  notes: string;
  addedById: string;
  addedByName: string;
}

export interface PlanSelection {
  vendor: string;
  optionId: string;
}

export interface PlanDTO {
  _id: string;
  name: string;
  adults: number;
  kids: number;
  useGuestList: boolean;
  selections: PlanSelection[];
  isFinal: boolean;
  createdAt: string;
}

export interface UserDTO {
  _id: string;
  name: string;
  email: string;
  role: Role;
  side: Side;
  canManageVendors: boolean;
}

export interface SettingsDTO {
  brideName: string;
  groomName: string;
  /** Short message shown on the home page under the date. */
  message: string;
  /** ISO date string (YYYY-MM-DD) or "" when not set. */
  weddingDate: string;
  /** "HH:MM" (24h) or "" */
  weddingTime: string;
  weddingVenue: string;
  weddingMap: string;
  homecomingDate: string;
  homecomingTime: string;
  homecomingVenue: string;
  homecomingMap: string;
}

/** Pick the text for the active language, falling back to the other one so nothing is ever blank. */
export function bi(text: Bi | undefined | null, lang: "si" | "en"): string {
  if (!text) return "";
  return (lang === "si" ? text.si || text.en : text.en || text.si) || "";
}
