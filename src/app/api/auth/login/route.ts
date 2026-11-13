import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { COOKIE_NAME, signToken } from "@/lib/jwt";
import { authCookieOptions } from "@/lib/auth";

// Compared against when the email is unknown so response time doesn't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "err.invalid" }, { status: 400 });
  }
  const { email, password } = (body ?? {}) as { email?: unknown; password?: unknown };
  if (typeof email !== "string" || typeof password !== "string" || !email || !password || password.length > 200) {
    return NextResponse.json({ error: "err.invalid" }, { status: 400 });
  }

  try {
    await connectDB();
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !valid) return NextResponse.json({ error: "err.badLogin" }, { status: 401 });

    const token = await signToken({
      uid: String(user._id),
      role: user.role === "admin" ? "admin" : "editor",
      side: user.side ?? "bride",
      name: user.name,
    });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, token, authCookieOptions);
    return res;
  } catch (err) {
    console.error("login failed", err);
    return NextResponse.json({ error: "err.generic" }, { status: 500 });
  }
}
