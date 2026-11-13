// Edge-runtime safe: only `jose`, no Node APIs, no Mongoose. Used by middleware.ts and server code.
import { SignJWT, jwtVerify } from "jose";
import type { Role, Side } from "./types";

export const COOKIE_NAME = "wp_token";
export const TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface Session {
  uid: string;
  role: Role;
  side: Side;
  name: string;
}

function secretKey(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) throw new Error("JWT_SECRET must be set and at least 32 characters long");
  return new TextEncoder().encode(s);
}

export async function signToken(session: Session): Promise<string> {
  return new SignJWT({ role: session.role, side: session.side, name: session.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.uid)
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifyToken(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (!payload.sub) return null;
    return {
      uid: payload.sub,
      role: payload.role === "admin" ? "admin" : "editor",
      side: payload.side === "groom" ? "groom" : "bride",
      name: typeof payload.name === "string" ? payload.name : "",
    };
  } catch {
    return null;
  }
}
