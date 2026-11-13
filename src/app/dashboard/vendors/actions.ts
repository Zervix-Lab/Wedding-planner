"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { destroyImages } from "@/lib/cloudinary";
import { connectDB } from "@/lib/db";
import { fail, ok, type ActionResult } from "@/lib/actions";
import { CategoryModel } from "@/lib/models/Category";
import { Vendor } from "@/lib/models/Vendor";
import { canManageVendors } from "@/lib/permissions";
import { isId, parseVendor, type VendorInput } from "@/lib/validate";

function refresh() {
  revalidateTag("vendors");
  revalidateTag("landing");
  revalidateTag("categories");
  revalidatePath("/dashboard/vendors");
  revalidatePath("/dashboard/budget");
  revalidatePath("/dashboard");
}

/** Returns the slug to store: the chosen existing category, or a brand-new one created on the spot. */
async function resolveCategory(v: VendorInput): Promise<string | null> {
  if (v.newCategory) {
    const last = await CategoryModel.findOne().sort({ order: -1 }).select("order").lean();
    const slug = `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    await CategoryModel.create({ slug, name: v.newCategory, order: (last?.order ?? 80) + 10, builtin: false });
    return slug;
  }
  return (await CategoryModel.exists({ slug: v.category })) ? v.category : null;
}

export async function createVendor(raw: unknown): Promise<ActionResult> {
  const me = await getCurrentUser();
  if (!me || !canManageVendors(me)) return fail("err.unauthorized");
  const p = parseVendor(raw);
  if (!p.ok) return p;
  try {
    await connectDB();
    const category = await resolveCategory(p.value);
    if (!category) return fail("err.invalid");
    const { newCategory: _unused, ...data } = p.value;
    void _unused;
    await Vendor.create({ ...data, category });
  } catch (err) {
    console.error(err);
    return fail("err.generic");
  }
  refresh();
  return ok();
}

export async function updateVendor(id: string, raw: unknown): Promise<ActionResult> {
  const me = await getCurrentUser();
  if (!me || !canManageVendors(me)) return fail("err.unauthorized");
  if (!isId(id)) return fail("err.invalid");
  const p = parseVendor(raw);
  if (!p.ok) return p;
  try {
    await connectDB();
    const vendor = await Vendor.findById(id);
    if (!vendor) return fail("err.notFound");
    const category = await resolveCategory(p.value);
    if (!category) return fail("err.invalid");
    const removedImages = vendor.images.filter((img) => !p.value.images.includes(img));
    const { newCategory: _unused, ...data } = p.value;
    void _unused;
    // Options keep their _id so saved plans that point at them stay valid.
    vendor.set({ ...data, category });
    await vendor.save();
    await destroyImages(removedImages); // awaited: serverless may freeze un-awaited work. Never throws.
  } catch (err) {
    console.error(err);
    return fail("err.generic");
  }
  refresh();
  return ok();
}

export async function deleteVendor(id: string): Promise<ActionResult> {
  const me = await getCurrentUser();
  if (!me || !canManageVendors(me)) return fail("err.unauthorized");
  if (!isId(id)) return fail("err.invalid");
  try {
    await connectDB();
    const vendor = await Vendor.findByIdAndDelete(id);
    if (vendor) await destroyImages(vendor.images);
  } catch (err) {
    console.error(err);
    return fail("err.generic");
  }
  refresh();
  return ok();
}
