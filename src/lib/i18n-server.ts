import { cache } from "react";
import { cookies } from "next/headers";
import en from "@locales/en.json";
import si from "@locales/si.json";
import { DEFAULT_LANG, LANG_COOKIE, makeT, type Dict, type Lang, type TFunc } from "./i18n";

const dicts: Record<Lang, Dict> = { en, si };

export const getLang = cache(async (): Promise<Lang> => {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return v === "en" || v === "si" ? v : DEFAULT_LANG;
});

export async function getI18n(): Promise<{ lang: Lang; dict: Dict; t: TFunc }> {
  const lang = await getLang();
  const dict = dicts[lang];
  return { lang, dict, t: makeT(dict) };
}
