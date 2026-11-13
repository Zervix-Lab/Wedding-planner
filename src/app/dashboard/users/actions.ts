"use server";
import bcrypt from "bcryptjs";
import { revalidatePath, revalidateTag } from "next/cache";
import { forgetUsers, getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { fail, ok, type ActionResult } from "@/lib/actions";
import { User } from "@/lib/models/User";
import { isId, parseUser } from "@/lib/validate";

async function admin() {
  const u = await getCurrentUser();
  return u && u.role === "admin" ? u : null;
}

function isDuplicate(err: unknown) {
  return typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;
}

export async function createUser(raw: unknown): Promise<ActionResult> {
  const me = await admin();
  if (!me) return fail("err.unauthorized");
  const p = parseUser(raw, true);
  if (!p.ok) return p;
  try {
    await connectDB();
    await User.create({
      name: p.value.name,
      email: p.value.email,
      passwordHash: await bcrypt.hash(p.value.password, 10),
      role: p.value.role,
      side: p.value.side,
      canManageVendors: p.value.canManageVendors,
    });
  } catch (err) {
    if (isDuplicate(err)) return fail("err.emailTaken");
    console.error(err);
    return fail("err.generic");
  }
  forgetUsers();
  revalidateTag("users");
  revalidatePath("/dashboard/users");
  return ok();
}

export async function updateUser(id: string, raw: unknown): Promise<ActionResult> {
  const me = await admin();
  if (!me) return fail("err.unauthorized");
  if (!isId(id)) return fail("err.invalid");
  const p = parseUser(raw, false);
  if (!p.ok) return p;
  try {
    await connectDB();
    const target = await User.findById(id);
    if (!target) return fail("err.notFound");
    // Never leave the site without an admin.
    if (target.role === "admin" && p.value.role !== "admin" && (await User.countDocuments({ role: "admin" })) <= 1) {
      return fail("err.lastAdmin");
    }
    target.name = p.value.name;
    target.email = p.value.email;
    target.role = p.value.role;
    target.side = p.value.side;
    target.canManageVendors = p.value.canManageVendors;
    if (p.value.password) target.passwordHash = await bcrypt.hash(p.value.password, 10);
    await target.save();
  } catch (err) {
    if (isDuplicate(err)) return fail("err.emailTaken");
    console.error(err);
    return fail("err.generic");
  }
  forgetUsers();
  revalidateTag("users");
  revalidatePath("/dashboard/users");
  return ok();
}

export async function deleteUser(id: string): Promise<ActionResult> {
  const me = await admin();
  if (!me) return fail("err.unauthorized");
  if (!isId(id)) return fail("err.invalid");
  if (id === me.id) return fail("err.deleteSelf");
  try {
    await connectDB();
    await User.findByIdAndDelete(id);
  } catch (err) {
    console.error(err);
    return fail("err.generic");
  }
  forgetUsers();
  revalidateTag("users");
  revalidatePath("/dashboard/users");
  return ok();
}
