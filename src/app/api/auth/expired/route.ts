import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/jwt";

// A signed-in token whose user no longer exists (e.g. account deleted): clear the cookie, then go to /login.
// Without this, middleware (valid token -> /dashboard) and the layout (no user -> /login) would loop forever.
export async function GET(req: Request) {
  const res = NextResponse.redirect(new URL("/login", req.url));
  res.cookies.set(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
