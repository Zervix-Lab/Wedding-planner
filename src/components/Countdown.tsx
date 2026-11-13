"use client";
import { useEffect, useMemo, useState } from "react";
import { useT } from "./Providers";

function parts(target: number, now: number) {
  const diff = Math.max(0, target - now);
  const s = Math.floor(diff / 1000);
  return { done: diff === 0, days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
}

/** `date` is "YYYY-MM-DD". Counts down to 00:00 on that day in the visitor's own time zone. */
export function Countdown({ date }: { date: string }) {
  const t = useT();
  const target = useMemo(() => {
    const [y, m, d] = date.split("-").map(Number);
    return new Date(y, m - 1, d).getTime();
  }, [date]);
  // null until mounted: avoids a server/client mismatch because "now" differs between them
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const p = now === null ? null : parts(target, now);
  const endOfDay = target + 86400000;

  if (p?.done) {
    return <p className="font-serif text-3xl font-bold text-rose-900 sm:text-4xl">{now! < endOfDay ? t("landing.today") : t("landing.passed")}</p>;
  }

  const cells: [string, number | undefined][] = [
    [t("landing.days"), p?.days],
    [t("landing.hours"), p?.hours],
    [t("landing.minutes"), p?.minutes],
    [t("landing.seconds"), p?.seconds],
  ];

  return (
    <div>
      <p className="mb-3 text-base font-semibold uppercase tracking-[0.2em] text-rose-900/80 sm:text-lg">{t("landing.countdown")}</p>
      <div className="mx-auto grid max-w-xl grid-cols-4 gap-2 sm:gap-4">
        {cells.map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-white/70 bg-white/55 px-1 py-3 shadow-lg shadow-rose-900/10 backdrop-blur-md sm:rounded-3xl sm:py-5"
          >
            <div className="font-serif text-3xl font-bold tabular-nums text-rose-800 sm:text-5xl">
              {value === undefined ? "--" : String(value).padStart(2, "0")}
            </div>
            <div className="mt-1 text-sm font-medium text-stone-700 sm:text-base">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
