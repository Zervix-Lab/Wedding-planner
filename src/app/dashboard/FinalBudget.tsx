"use client";
import { useMemo } from "react";
import { useLang, useT } from "@/components/Providers";
import type { Line } from "@/lib/calc";
import { bi, type CategoryDTO } from "@/lib/types";
import { Breakdown } from "./budget/Breakdown";

/** The final plan with every price calculation (read-only). Shown to admins and editors on the dashboard. */
export function FinalBudget({ lines, total, categories, planName, adults, kids }: { lines: Line[]; total: number; categories: CategoryDTO[]; planName: string; adults: number; kids: number }) {
  const t = useT();
  const lang = useLang();
  const catNames = useMemo(() => new Map(categories.map((c) => [c.slug, bi(c.name, lang)])), [categories, lang]);
  return (
    <div>
      <p className="mb-1 text-lg font-semibold text-rose-900">{t("dash.finalIs", { name: planName })}</p>
      <p className="mb-4 text-base text-stone-700">{t("dash.finalFor", { adults, kids })}</p>
      <Breakdown lines={lines} total={total} emptyKey="budget.nothingPicked" catNames={catNames} title={t("dash.finalBudgetTitle")} />
    </div>
  );
}
