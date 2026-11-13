"use client";
import { useMemo, useState, useTransition } from "react";
import { Icon } from "@/components/Icon";
import { useConfirm, useLang, useT, useToast } from "@/components/Providers";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { buildLines, picksFromSelections, planCounts, sumLines, type Counts, type Line } from "@/lib/calc";
import { formatMoney } from "@/lib/money";
import { bi, type CategoryDTO, type PlanDTO, type VendorDTO } from "@/lib/types";
import { deletePlan, setFinalPlan } from "./actions";

interface Row {
  plan: PlanDTO;
  counts: Counts;
  lines: Line[];
  missing: number;
  total: number;
}

interface Props {
  plans: PlanDTO[];
  byId: Map<string, VendorDTO>;
  categories: CategoryDTO[];
  canManage: boolean;
  confirmed: Counts;
  onOpen: (plan: PlanDTO) => void;
  onBuild: () => void;
}

export function PlansPanel({ plans, byId, categories, canManage, confirmed, onOpen, onBuild }: Props) {
  const t = useT();
  const lang = useLang();
  const order = useMemo(() => categories.map((c) => c.slug), [categories]);
  const catNames = useMemo(() => new Map(categories.map((c) => [c.slug, bi(c.name, lang)])), [categories, lang]);
  const toast = useToast();
  const confirm = useConfirm();
  const [pending, start] = useTransition();
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [hidden, setHidden] = useState<string[]>([]); // optimistic deletes

  // Totals are recalculated from CURRENT vendor prices every time, never read from the database.
  const rows = useMemo<Row[]>(
    () =>
      plans.map((plan) => {
        const counts = planCounts(plan, confirmed);
        const { picks, missing } = picksFromSelections(plan.selections, byId);
        const lines = buildLines(picks, byId, counts.adults, counts.kids, order);
        return { plan, counts, lines, missing, total: sumLines(lines) };
      }),
    [plans, byId, confirmed, order],
  );

  const toggleCompare = (id: string) => {
    if (compareIds.includes(id)) {
      setCompareIds(compareIds.filter((x) => x !== id));
    } else if (compareIds.length >= 3) {
      toast.error("budget.maxCompare");
    } else {
      setCompareIds([...compareIds, id]);
    }
  };

  async function remove(plan: PlanDTO) {
    if (!(await confirm(t("budget.confirmDeletePlan", { name: plan.name })))) return;
    setHidden((h) => [...h, plan._id]);
    setCompareIds((ids) => ids.filter((x) => x !== plan._id));
    start(async () => {
      const res = await deletePlan(plan._id);
      if (res.ok) toast.success("common.deleted");
      else {
        setHidden((h) => h.filter((x) => x !== plan._id));
        toast.error(res.error);
      }
    });
  }

  function makeFinal(plan: PlanDTO) {
    start(async () => {
      const res = await setFinalPlan(plan._id);
      if (res.ok) toast.success("budget.finalSet");
      else toast.error(res.error);
    });
  }

  if (plans.length === 0) {
    return (
      <EmptyState
        icon="list"
        title={t("budget.noPlans")}
        hint={t("budget.noPlansHint")}
        action={
          <Button icon="plus" onClick={onBuild}>
            {t("budget.goBuild")}
          </Button>
        }
      />
    );
  }

  const compared = compareIds.map((id) => rows.find((r) => r.plan._id === id)).filter((r): r is Row => Boolean(r));
  const comparing = showCompare && compared.length >= 2;

  return (
    <div className="space-y-5">
      {comparing && <CompareTable rows={compared} order={order} catNames={catNames} onClose={() => setShowCompare(false)} />}

      <p className="text-lg text-stone-800">{t("budget.compareHint")}</p>

      <ul className="grid gap-4 md:grid-cols-2">
        {rows.filter((r) => !hidden.includes(r.plan._id)).map((r) => (
          <li key={r.plan._id}>
            <Card className={`h-full ${r.plan.isFinal ? "border-2 border-green-700" : ""}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="break-words text-xl font-bold">{r.plan.name}</h3>
                {r.plan.isFinal && (
                  <Badge tone="green">
                    <span className="inline-flex items-center gap-1">
                      <Icon name="star" className="h-4 w-4" />
                      {t("budget.final")}
                    </span>
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-3xl font-extrabold tabular-nums text-rose-900">{formatMoney(r.total)}</p>
              <p className="text-base text-stone-700">{t("budget.adultsKids", { adults: r.counts.adults, kids: r.counts.kids })}</p>
              {r.plan.useGuestList && <p className="text-base text-stone-700">{t("budget.useGuestList")}</p>}

              <ul className="mt-3 space-y-1 text-base">
                {r.lines.map((l) => (
                  <li key={l.category}>
                    <span className="font-semibold">{catNames.get(l.category) ?? l.category}:</span> {bi(l.vendor.name, lang)} - {bi(l.option.name, lang)}
                  </li>
                ))}
                {r.missing > 0 && <li className="text-red-800">{t("budget.missing")}: {r.missing}</li>}
              </ul>

              <label className="mt-3 flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 border-stone-300 px-3 text-lg">
                <input
                  type="checkbox"
                  className="h-6 w-6 accent-rose-800"
                  checked={compareIds.includes(r.plan._id)}
                  onChange={() => toggleCompare(r.plan._id)}
                />
                {t("budget.compare")}
              </label>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button icon="open" onClick={() => onOpen(r.plan)}>
                  {t("budget.openPlan")}
                </Button>
                {canManage && !r.plan.isFinal && (
                  <Button variant="secondary" icon="star" onClick={() => makeFinal(r.plan)} disabled={pending}>
                    {t("budget.makeFinal")}
                  </Button>
                )}
                {canManage && (
                  <Button variant="danger" icon="trash" onClick={() => remove(r.plan)} disabled={pending}>
                    {t("common.delete")}
                  </Button>
                )}
              </div>
            </Card>
          </li>
        ))}
      </ul>

      {compareIds.length >= 2 && !comparing && (
        <div className="sticky bottom-3 z-20 flex justify-center">
          <Button icon="columns" className="shadow-lg" onClick={() => setShowCompare(true)}>
            {t("budget.compareNow", { n: compareIds.length })}
          </Button>
        </div>
      )}
    </div>
  );
}

function CompareTable({ rows, order, catNames, onClose }: { rows: Row[]; order: string[]; catNames: Map<string, string>; onClose: () => void }) {
  const t = useT();
  const lang = useLang();
  const cheapest = Math.min(...rows.map((r) => r.total));
  const categories = order.filter((c) => rows.some((r) => r.lines.some((l) => l.category === c)));
  const head = "border-b border-stone-300 bg-white p-3 text-left align-top";

  return (
    <Card className="border-2 border-rose-800 p-0 sm:p-0">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <h2 className="text-xl font-bold">{t("budget.compareTitle")}</h2>
        <Button variant="secondary" icon="x" onClick={onClose}>
          {t("budget.hideCompare")}
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-base">
          <thead>
            <tr>
              <th className={`${head} sticky left-0 z-10 w-28`} />
              {rows.map((r) => (
                <th key={r.plan._id} className={head}>
                  <span className="block text-lg">{r.plan.name}</span>
                  {r.plan.isFinal && <Badge tone="green">{t("budget.final")}</Badge>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" className={`${head} sticky left-0 z-10 font-semibold`}>
                {t("budget.guestsRow")}
              </th>
              {rows.map((r) => (
                <td key={r.plan._id} className={head}>
                  {t("budget.adultsKids", { adults: r.counts.adults, kids: r.counts.kids })}
                </td>
              ))}
            </tr>
            {categories.map((c) => (
              <tr key={c}>
                <th scope="row" className={`${head} sticky left-0 z-10 font-semibold`}>
                  {catNames.get(c) ?? c}
                </th>
                {rows.map((r) => {
                  const l = r.lines.find((x) => x.category === c);
                  return (
                    <td key={r.plan._id} className={head}>
                      {l ? (
                        <>
                          <span className="block font-semibold">{bi(l.vendor.name, lang)}</span>
                          <span className="block text-stone-700">{bi(l.option.name, lang)}</span>
                          <span className="block tabular-nums text-rose-900">{formatMoney(l.calc.total)}</span>
                        </>
                      ) : (
                        <span className="text-stone-500">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="bg-rose-50">
              <th scope="row" className="sticky left-0 z-10 bg-rose-50 p-3 text-left text-lg font-bold">
                {t("budget.total")}
              </th>
              {rows.map((r) => (
                <td key={r.plan._id} className="p-3 align-top">
                  <span className="block text-xl font-extrabold tabular-nums text-rose-900">{formatMoney(r.total)}</span>
                  {r.total === cheapest && rows.some((x) => x.total !== cheapest) && <Badge tone="green">{t("budget.cheapest")}</Badge>}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}
