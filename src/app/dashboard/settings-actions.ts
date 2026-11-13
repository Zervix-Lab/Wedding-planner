"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { fail, ok, type ActionResult } from "@/lib/actions";
import { Settings } from "@/lib/models/Settings";
import { canManageSettings } from "@/lib/permissions";
import { isObj, str } from "@/lib/validate";

const day = (v: unknown): Date | null | undefined => {
  const s = str(v, 10);
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined; // invalid
  const d = new Date(`${s}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? undefined : d;
};
const time = (v: unknown) => {
  const s = str(v, 5);
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(s) ? s : "";
};
const link = (v: unknown) => {
  const s = str(v, 300);
  return /^https?:\/\/\S+$/i.test(s) ? s : "";
};

export async function saveSettings(raw: unknown): Promise<ActionResult> {
  const me = await getCurrentUser();
  if (!me || !canManageSettings(me)) return fail("err.unauthorized");
  if (!isObj(raw)) return fail("err.invalid");

  const weddingDate = day(raw.weddingDate);
  const homecomingDate = day(raw.homecomingDate);
  if (weddingDate === undefined || homecomingDate === undefined) return fail("err.invalid");

  try {
    await connectDB();
    await Settings.findOneAndUpdate(
      { key: "main" },
      {
        $set: {
          brideName: str(raw.brideName, 60),
          groomName: str(raw.groomName, 60),
          message: str(raw.message, 400),
          weddingDate,
          weddingTime: time(raw.weddingTime),
          weddingVenue: str(raw.weddingVenue, 200),
          weddingMap: link(raw.weddingMap),
          homecomingDate,
          homecomingTime: time(raw.homecomingTime),
          homecomingVenue: str(raw.homecomingVenue, 200),
          homecomingMap: link(raw.homecomingMap),
        },
      },
      { upsert: true },
    );
  } catch (err) {
    console.error(err);
    return fail("err.generic");
  }
  revalidateTag("landing");
  revalidatePath("/dashboard");
  return ok();
}
