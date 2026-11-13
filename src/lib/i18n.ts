// Tiny dictionary-based i18n. No JSON imports here so client bundles only ever receive ONE language.
import type en from "@locales/en.json";

export type Lang = "si" | "en";
export type Dict = Record<string, string>;
export type DictKey = keyof typeof en;
export type TFunc = (key: DictKey, vars?: Record<string, string | number>) => string;

export const LANG_COOKIE = "lang";
export const DEFAULT_LANG: Lang = "si";

export function makeT(dict: Dict): TFunc {
  return (key, vars) => {
    let s = dict[key] ?? key;
    if (vars) for (const k of Object.keys(vars)) s = s.replaceAll(`{${k}}`, String(vars[k]));
    return s;
  };
}
