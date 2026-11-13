import type { DictKey } from "./i18n";

/** Server actions return a dictionary KEY for errors so the browser can show it in the chosen language. */
export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: DictKey };

export const fail = (error: DictKey): { ok: false; error: DictKey } => ({ ok: false, error });
export const ok = <T = undefined>(data?: T): { ok: true; data?: T } => ({ ok: true, data });
