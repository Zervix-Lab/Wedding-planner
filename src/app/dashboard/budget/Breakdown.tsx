"use client";
import { memo } from "react";
import { useLang, useT } from "@/components/Providers";
import type { Line } from "@/lib/calc";
import { formatMoney } from "@/lib/money";
import { bi } from "@/lib/types";

function Row({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex justify-between gap-3 text-base text-stone-800">
      <span>{label}</span>
      <span className="shrink-0 tabular-nums">{formatMoney(amount)}</span>
    </div>
  );
}

/** Itemised cost. Pure display: every number comes from lib/calc. */
export const Breakdown = memo(function Breakdown({
  lines,
  total,
  emptyKey,
  catNames,
  title,
}: {
  lines: Line[];
  total: number;
  emptyKey: "budget.nothingPicked" | "budget.nothingPickedMobile";
  catNames: Map<string, string>;
  title?: string;
}) {
  const t = useT();
  const lang = useLang();
  return (
    <div>
      <h2 className="mb-3 text-xl font-bold">{title ?? t("budget.breakdown")}</h2>

      {lines.length === 0 ? (
        <p className="rounded-xl bg-stone-100 px-4 py-6 text-center text-lg text-stone-800">{t(emptyKey)}</p>
      ) : (
        <ul className="space-y-4">
          {lines.map(({ category, vendor, option, calc }) => (
            <li key={category} className="space-y-1 border-b border-stone-300 pb-3">
              <p className="text-base font-semibold text-stone-600">{catNames.get(category) ?? category}</p>
              <div className="flex justify-between gap-3 text-lg font-bold">
                <span className="min-w-0 break-words">
                  {bi(vendor.name, lang)} - {bi(option.name, lang)}
                </span>
                <span className="shrink-0 tabular-nums text-rose-900">{formatMoney(calc.total)}</span>
              </div>
              {option.priceType === "fixed" ? (
                <Row label={t("budget.fixed")} amount={calc.base} />
              ) : calc.minApplied ? (
                <Row label={t("budget.minLine", { n: calc.minPlates, price: formatMoney(option.price) })} amount={calc.base} />
              ) : (
                <>
                  {calc.adults > 0 && <Row label={t("budget.adultsLine", { n: calc.adults, price: formatMoney(option.price) })} amount={calc.adultsCost} />}
                  {calc.kids > 0 && <Row label={t("budget.kidsLine", { n: calc.kids, price: formatMoney(option.kidsPrice ?? option.price) })} amount={calc.kidsCost} />}
                </>
              )}
              {calc.service > 0 && <Row label={t("budget.service", { pct: calc.serviceChargePct })} amount={calc.service} />}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 rounded-2xl bg-rose-800 px-4 py-4 text-white">
        <p className="text-base font-semibold tracking-wide">{t("budget.total")}</p>
        <p className="text-4xl font-extrabold tabular-nums" data-testid="total">
          {formatMoney(total)}
        </p>
      </div>
    </div>
  );
});
