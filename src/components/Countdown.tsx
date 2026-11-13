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
    return <p className="text-2xl font-bold text-rose-900">{now! < endOfDay ? t("landing.today") : t("landing.passed")}</p>;
  }

  const cells: [string, number | undefined][] = [
    [t("landing.days"), p?.days],
    [t("landing.hours"), p?.hours],
    [t("landing.minutes"), p?.minutes],
    [t("landing.seconds"), p?.seconds],
  ];

  return (
    <div>
      <p className="mb-2 text-lg font-semibold text-stone-800">{t("landing.countdown")}</p>
      <div className="mx-auto grid max-w-md grid-cols-4 gap-2 sm:gap-3">
        {cells.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-rose-200 bg-white px-1 py-3 shadow-sm">
            <div className="text-3xl font-bold tabular-nums text-rose-900 sm:text-4xl">{value === undefined ? "--" : String(value).padStart(2, "0")}</div>
            <div className="text-base text-stone-800">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
