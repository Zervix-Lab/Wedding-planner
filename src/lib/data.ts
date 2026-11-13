// Read-side data helpers shared by pages. Converts Mongoose lean docs into plain, serializable DTOs.
import { unstable_cache } from "next/cache";
import { connectDB } from "./db";
import { toBi } from "./bi";
import "./models/User"; // registers the User model so populate("addedBy") works
import { Vendor } from "./models/Vendor";
import { Settings } from "./models/Settings";
import type { PriceType, SettingsDTO, VendorDTO } from "./types";

interface LeanVendor {
  _id: unknown;
  name: unknown;
  category: string;
  images?: string[];
  contact?: string;
  serviceCharge?: number;
  minPlates?: number;
  addedBy?: { _id: unknown; name?: string } | null;
  options?: {
    _id: unknown;
    name: unknown;
    priceType?: PriceType;
    price: number;
    kidsPrice?: number | null;
    inclusions?: unknown[];
  }[];
}

export function toVendorDTO(v: LeanVendor): VendorDTO {
  return {
    _id: String(v._id),
    name: toBi(v.name),
    category: v.category,
    images: v.images ?? [],
    contact: v.contact ?? "",
    serviceCharge: v.serviceCharge ?? 0,
    minPlates: v.minPlates ?? 0,
    addedById: v.addedBy ? String(v.addedBy._id) : "",
    addedByName: v.addedBy?.name ?? "",
    options: (v.options ?? []).map((o) => ({
      _id: String(o._id),
      name: toBi(o.name),
      priceType: o.priceType ?? "fixed",
      price: o.price,
      kidsPrice: o.kidsPrice ?? null,
      inclusions: (o.inclusions ?? []).map(toBi),
    })),
  };
}

/** All vendors including prices. Only call this from pages that require login. Cached with tag "vendors". */
export const getAllVendors = unstable_cache(
  async (): Promise<VendorDTO[]> => {
    await connectDB();
    const docs = await Vendor.find().sort({ category: 1, _id: 1 }).populate("addedBy", "name").lean();
    return docs.map((d) => toVendorDTO(d as unknown as LeanVendor));
  },
  ["vendors-all"],
  { tags: ["vendors"], revalidate: 120 },
);

async function readSettings(): Promise<SettingsDTO> {
  await connectDB();
  const s = await Settings.findOne({ key: "main" }).lean();
  const day = (d: Date | null | undefined) => (d ? new Date(d).toISOString().slice(0, 10) : "");
  return {
    brideName: s?.brideName ?? "",
    groomName: s?.groomName ?? "",
    message: s?.message ?? "",
    weddingDate: day(s?.weddingDate),
    weddingTime: s?.weddingTime ?? "",
    weddingVenue: s?.weddingVenue ?? "",
    weddingMap: s?.weddingMap ?? "",
  };
}

/** Couple names + date. Cached; refreshed whenever an admin saves them (tag "settings"). */
export const getSettings = unstable_cache(readSettings, ["settings"], { tags: ["settings"], revalidate: 3600 });
