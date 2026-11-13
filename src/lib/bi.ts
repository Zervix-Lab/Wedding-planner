import type { Bi } from "./types";

const SINHALA = /[\u0D80-\u0DFF]/;
export const hasSinhala = (s: string) => SINHALA.test(s);

/** Reads a stored value that may be the { en, si } shape or an old plain string. */
export function toBi(v: unknown): Bi {
  if (typeof v === "string") return { en: v, si: v };
  if (v && typeof v === "object") {
    const o = v as { en?: unknown; si?: unknown };
    const en = typeof o.en === "string" ? o.en : "";
    const si = typeof o.si === "string" ? o.si : "";
    return { en: en || si, si: si || en };
  }
  return { en: "", si: "" };
}

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

/**
 * Saves text exactly as typed, in the language it was typed in: text with Sinhala letters goes to `si`,
 * everything else to `en`. Nothing is translated. The screen shows whichever one exists.
 */
export function normalizeBi(input: { en?: unknown; si?: unknown } | null | undefined, max = 200): Bi {
  const en = clean(input?.en, max);
  const si = clean(input?.si, max);
  const typed = en || si;
  if (!typed) return { en: "", si: "" };
  if (en && si) return { en, si }; // both already present (older saved data): keep as is
  return hasSinhala(typed) ? { en: "", si: typed } : { en: typed, si: "" };
}
