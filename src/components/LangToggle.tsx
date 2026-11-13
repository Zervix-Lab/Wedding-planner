"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LANG_COOKIE, type Lang } from "@/lib/i18n";
import { useLang } from "./Providers";

const OPTIONS: { code: Lang; label: string; name: string }[] = [
  { code: "si", label: "සිංහල", name: "Sinhala" },
  { code: "en", label: "English", name: "English" },
];

export function LangToggle() {
  const lang = useLang();
  const router = useRouter();
  const [pending, start] = useTransition();

  function choose(code: Lang) {
    if (code === lang) return;
    document.cookie = `${LANG_COOKIE}=${code}; path=/; max-age=31536000; samesite=lax`;
    start(() => router.refresh());
  }

  return (
    <div
      role="group"
      aria-label="Language / භාෂාව"
      className={`inline-flex rounded-xl border-2 border-rose-800 bg-white p-0.5 ${pending ? "opacity-70" : ""}`}
    >
      {OPTIONS.map((o) => (
        <button
          key={o.code}
          type="button"
          onClick={() => choose(o.code)}
          aria-pressed={lang === o.code}
          lang={o.code}
          className={`min-h-11 min-w-[4.5rem] rounded-[9px] px-3 text-base font-semibold ${
            lang === o.code ? "bg-rose-800 text-white" : "text-rose-900 hover:bg-rose-100"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
