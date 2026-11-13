import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/jwt";

// Works from a plain <form method="post"> (no JavaScript needed). 303 turns the POST into a GET on "/".
export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL("/", req.url), 303);
  res.cookies.set(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
