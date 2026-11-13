import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, TOKEN_MAX_AGE, verifyToken, type Session } from "./jwt";
import { connectDB } from "./db";
import { User } from "./models/User";
import type { Role, Side } from "./types";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  side: Side;
  canManageVendors: boolean;
}

/** Cheap check: cookie + JWT signature only (no database). Good for "is someone logged in?" UI. */
export const getSession = cache(async (): Promise<Session | null> => {
  const store = await cookies();
  return verifyToken(store.get(COOKIE_NAME)?.value);
});

// Remembering a verified user for a few seconds saves one database round trip on EVERY page and action.
// A deleted/demoted user is locked out within USER_TTL_MS (immediately on the instance that handled the change).
const USER_TTL_MS = 30_000;
const g = globalThis as unknown as { _userCache?: Map<string, { at: number; user: CurrentUser }> };
const userCache = (g._userCache ??= new Map());

/** Call after changing or deleting a user so the change applies at once on this instance. */
export function forgetUsers(): void {
  userCache.clear();
}

/** Verified check: JWT is valid AND the user still exists (re-checked against the database every 30 seconds). */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession();
  if (!session) return null;
  const hit = userCache.get(session.uid);
  if (hit && Date.now() - hit.at < USER_TTL_MS) return hit.user;
  try {
    await connectDB();
    const u = await User.findById(session.uid).select("name email role side canManageVendors").lean();
    if (!u) return null;
    const user: CurrentUser = {
      id: String(u._id),
      name: u.name,
      email: u.email,
      role: u.role === "admin" ? "admin" : "editor", // legacy "member" counts as editor
      side: u.side ?? "bride",
      canManageVendors: Boolean(u.canManageVendors),
    };
    userCache.set(session.uid, { at: Date.now(), user });
    return user;
  } catch {
    return null;
  }
});

/** For pages: go to /login when not signed in (and clear the cookie if the account no longer exists). */
export async function requireUserPage(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/api/auth/expired");
  return user;
}

export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: TOKEN_MAX_AGE,
};
