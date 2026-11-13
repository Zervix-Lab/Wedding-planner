import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { signUpload } from "@/lib/cloudinary";

// Gives a logged-in user a short-lived signature so the browser can upload straight to Cloudinary.
// The API secret never leaves the server, and the image bytes never pass through Vercel.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "err.unauthorized" }, { status: 401 });
  const signed = signUpload();
  if (!signed) return NextResponse.json({ error: "err.photoNotConfigured" }, { status: 503 });
  return NextResponse.json(signed, { headers: { "Cache-Control": "no-store" } });
}
