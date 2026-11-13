// Read-side data helpers shared by pages. Converts Mongoose lean docs into plain, serializable DTOs.
import { unstable_cache } from "next/cache";
import { connectDB } from "./db";
import { toBi } from "./bi";
import { getCategories } from "./categories";
import { Vendor } from "./models/Vendor";
import { Settings } from "./models/Settings";
import type { Bi, CategoryDTO, PriceType, SettingsDTO, VendorDTO } from "./types";

interface LeanVendor {
  _id: unknown;
  name: unknown;
  category: string;
  images?: string[];
  contact?: string;
  serviceCharge?: number;
  minPlates?: number;
  showOnLanding?: boolean;
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
    showOnLanding: v.showOnLanding !== false,
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
    const docs = await Vendor.find().sort({ category: 1, _id: 1 }).lean();
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
    homecomingDate: day(s?.homecomingDate),
    homecomingTime: s?.homecomingTime ?? "",
    homecomingVenue: s?.homecomingVenue ?? "",
    homecomingMap: s?.homecomingMap ?? "",
  };
}

/** Couple names + date. Cached; refreshed whenever an admin saves them (tag "landing"). */
export const getSettings = unstable_cache(readSettings, ["settings"], { tags: ["landing"], revalidate: 3600 });

export interface LandingVendor {
  _id: string;
  name: Bi;
  category: string;
  images: string[];
}

/**
 * Public landing page data. Prices are NEVER selected here, so they cannot leak to logged-out visitors.
 * Cached for an hour and invalidated with revalidateTag("landing") whenever vendors/settings change.
 */
export const getLandingData = unstable_cache(
  async (): Promise<{ settings: SettingsDTO; vendors: LandingVendor[]; categories: CategoryDTO[] }> => {
    await connectDB();
    const [settings, categories, docs] = await Promise.all([
      readSettings(),
      getCategories(),
      Vendor.find({ showOnLanding: true }).select("name category images").sort({ _id: 1 }).lean(),
    ]);
    return {
      settings,
      categories,
      vendors: docs.map((d) => ({ _id: String(d._id), name: toBi(d.name), category: d.category, images: d.images ?? [] })),
    };
  },
  ["landing-data"],
  { tags: ["landing", "categories"], revalidate: 3600 },
);
