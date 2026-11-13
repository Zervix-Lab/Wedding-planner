"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { canManagePlans } from "@/lib/permissions";
import { connectDB } from "@/lib/db";
import { fail, ok, type ActionResult } from "@/lib/actions";
import { Plan } from "@/lib/models/Plan";
import { Vendor } from "@/lib/models/Vendor";
import { isId, parsePlan, type PlanInput } from "@/lib/validate";

function refresh() {
  revalidateTag("plans");
  revalidatePath("/dashboard/budget");
  revalidatePath("/dashboard");
}

/** Keep only selections that point at a real vendor option (no duplicates). Several per category are allowed. */
async function cleanSelections(selections: PlanInput["selections"]): Promise<PlanInput["selections"]> {
  const vendors = await Vendor.find({ _id: { $in: selections.map((s) => s.vendor) } }).select("options._id").lean();
  const seen = new Map<string, PlanInput["selections"][number]>();
  for (const s of selections) {
    const v = vendors.find((x) => String(x._id) === s.vendor);
    if (v && v.options.some((o) => String(o._id) === s.optionId)) seen.set(`${s.vendor}:${s.optionId}`, s);
  }
  return [...seen.values()];
}

export async function createPlan(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const me = await getCurrentUser();
  if (!me || !canManagePlans(me)) return fail("err.unauthorized");
  const p = parsePlan(raw);
  if (!p.ok) return p;
  try {
    await connectDB();
    const plan = await Plan.create({ ...p.value, selections: await cleanSelections(p.value.selections), createdBy: me.id });
    refresh();
    return ok({ id: String(plan._id) });
  } catch (err) {
    console.error(err);
    return fail("err.generic");
  }
}

export async function updatePlan(id: string, raw: unknown): Promise<ActionResult> {
  const me = await getCurrentUser();
  if (!me || !canManagePlans(me)) return fail("err.unauthorized");
  if (!isId(id)) return fail("err.invalid");
  const p = parsePlan(raw);
  if (!p.ok) return p;
  try {
    await connectDB();
    const res = await Plan.findByIdAndUpdate(id, { $set: { ...p.value, selections: await cleanSelections(p.value.selections) } });
    if (!res) return fail("err.notFound");
  } catch (err) {
    console.error(err);
    return fail("err.generic");
  }
  refresh();
  return ok();
}

export async function deletePlan(id: string): Promise<ActionResult> {
  const me = await getCurrentUser();
  if (!me || !canManagePlans(me)) return fail("err.unauthorized");
  if (!isId(id)) return fail("err.invalid");
  try {
    await connectDB();
    await Plan.findByIdAndDelete(id);
  } catch (err) {
    console.error(err);
    return fail("err.generic");
  }
  refresh();
  return ok();
}

/** Exactly one plan can be final: unmark all others and mark this one in a single bulk write. */
export async function setFinalPlan(id: string): Promise<ActionResult> {
  const me = await getCurrentUser();
  if (!me || !canManagePlans(me)) return fail("err.unauthorized");
  if (!isId(id)) return fail("err.invalid");
  try {
    await connectDB();
    if (!(await Plan.exists({ _id: id }))) return fail("err.notFound");
    await Plan.bulkWrite([
      { updateMany: { filter: { _id: { $ne: id }, isFinal: true }, update: { $set: { isFinal: false } } } },
      { updateOne: { filter: { _id: id }, update: { $set: { isFinal: true } } } },
    ]);
  } catch (err) {
    console.error(err);
    return fail("err.generic");
  }
  refresh();
  return ok();
}
