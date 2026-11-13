"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { fail, ok, type ActionResult } from "@/lib/actions";
import { Guest } from "@/lib/models/Guest";
import { canEditGuests, canModifyGuest } from "@/lib/permissions";
import { isId, parseGuest } from "@/lib/validate";

function refresh() {
  revalidateTag("guests");
  revalidatePath("/dashboard/guests");
  revalidatePath("/dashboard/budget");
  revalidatePath("/dashboard");
}

export async function createGuest(raw: unknown): Promise<ActionResult> {
  const me = await getCurrentUser();
  if (!me || !canEditGuests(me)) return fail("err.unauthorized");
  const p = parseGuest(raw);
  if (!p.ok) return p;
  try {
    await connectDB();
    await Guest.create({ ...p.value, addedBy: me.id });
  } catch (err) {
    console.error(err);
    return fail("err.generic");
  }
  refresh();
  return ok();
}

export async function updateGuest(id: string, raw: unknown): Promise<ActionResult> {
  const me = await getCurrentUser();
  if (!me || !canEditGuests(me)) return fail("err.unauthorized");
  if (!isId(id)) return fail("err.invalid");
  const p = parseGuest(raw);
  if (!p.ok) return p;
  try {
    await connectDB();
    const guest = await Guest.findById(id).select("addedBy").lean();
    if (!guest) return fail("err.notFound");
    if (!canModifyGuest(me, guest.addedBy ? String(guest.addedBy) : "")) return fail("err.notYours");
    await Guest.findByIdAndUpdate(id, { $set: p.value }, { runValidators: true });
  } catch (err) {
    console.error(err);
    return fail("err.generic");
  }
  refresh();
  return ok();
}

export async function deleteGuest(id: string): Promise<ActionResult> {
  const me = await getCurrentUser();
  if (!me) return fail("err.unauthorized");
  if (!isId(id)) return fail("err.invalid");
  try {
    await connectDB();
    const guest = await Guest.findById(id).select("addedBy").lean();
    if (!guest) return ok();
    if (!canModifyGuest(me, guest.addedBy ? String(guest.addedBy) : "")) return fail("err.notYours");
    await Guest.findByIdAndDelete(id);
  } catch (err) {
    console.error(err);
    return fail("err.generic");
  }
  refresh();
  return ok();
}
