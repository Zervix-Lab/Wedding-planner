"use client";
import { useCallback, useMemo, useState, useTransition } from "react";
import { Icon } from "@/components/Icon";
import { ExportButton } from "@/components/ExportButton";
import { useLang, useT, useToast } from "@/components/Providers";
import { Button, Card, Field, Input, PageTitle } from "@/components/ui";
import {
  buildLines,
  indexVendors,
  picksFromSelections,
  selectionsFromPicks,
  sumLines,
  type Counts,
  type Choice,
  type PickMap,
} from "@/lib/calc";
import { formatMoney } from "@/lib/money";
import { bi, type Category, type CategoryDTO, type PlanDTO, type VendorDTO } from "@/lib/types";
import { createPlan, updatePlan } from "./actions";
import { Breakdown } from "./Breakdown";
import { CategorySection } from "./CategorySection";
import { PlansPanel } from "./PlansPanel";

const toCount = (s: string) => Math.max(0, Math.min(100000, Math.floor(Number(s) || 0)));

export function BudgetClient({
  vendors,
  plans,
  confirmed,
  categories,
  canManage,
}: {
  vendors: VendorDTO[];
  plans: PlanDTO[];
  confirmed: Counts;
  categories: CategoryDTO[];
  canManage: boolean;
}) {
  const t = useT();
  const lang = useLang();
  const toast = useToast();
  const [saving, startSave] = useTransition();

  const [tab, setTab] = useState<"build" | "plans">("build");
  const [adults, setAdults] = useState("1");
  const [kids, setKids] = useState("0");
  const [useList, setUseList] = useState(false);
  const [picks, setPicks] = useState<PickMap>({});
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  const byId = useMemo(() => indexVendors(vendors), [vendors]);
  const order = useMemo(() => categories.map((c) => c.slug), [categories]);
  const catNames = useMemo(() => new Map(categories.map((c) => [c.slug, bi(c.name, lang)])), [categories, lang]);
  const sections = useMemo(() => categories.map((c) => ({ category: c, vendors: vendors.filter((v) => v.category === c.slug) })), [categories, vendors]);

  // Live calculation: pure client-side, recalculated only when an input actually changes.
  const counts = useMemo<Counts>(() => (useList ? confirmed : { adults: toCount(adults), kids: toCount(kids) }), [useList, confirmed, adults, kids]);
  const lines = useMemo(() => buildLines(picks, byId, counts.adults, counts.kids, order), [picks, byId, counts, order]);
  const total = useMemo(() => sumLines(lines), [lines]);

  // Stable callback so memoised CategorySections are not re-rendered by unrelated state changes
  const select = useCallback((category: Category, pick: Choice | null) => {
    setPicks((prev) => {
      const next = { ...prev };
      if (pick) next[category] = pick;
      else delete next[category];
      return next;
    });
  }, []);

  const loaded = plans.find((p) => p._id === loadedId) ?? null;
  const defaultName = t("budget.defaultPlanName", { letter: String.fromCharCode(65 + (plans.length % 26)) });
  const planName = nameInput.trim() || defaultName;

  function openPlan(plan: PlanDTO) {
    setPicks(picksFromSelections(plan.selections, byId).picks);
    setAdults(String(plan.adults));
    setKids(String(plan.kids));
    setUseList(plan.useGuestList);
    setLoadedId(plan._id);
    setNameInput("");
    setTab("build");
    window.scrollTo({ top: 0 });
  }

  function save(mode: "new" | "update") {
    const payload = {
      name: mode === "update" && loaded ? loaded.name : planName,
      adults: toCount(adults),
      kids: toCount(kids),
      useGuestList: useList,
      selections: selectionsFromPicks(picks, order),
    };
    startSave(async () => {
      if (mode === "update" && loaded) {
        const res = await updatePlan(loaded._id, payload);
        if (res.ok) toast.success("budget.planSaved");
        else toast.error(res.error);
      } else {
        const res = await createPlan(payload);
        if (res.ok && res.data) {
          toast.success("budget.planSaved");
          setLoadedId(res.data.id);
          setNameInput("");
        } else if (!res.ok) toast.error(res.error);
      }
    });
  }

  const savePanel = (
    <Card className="mt-4 space-y-3 bg-stone-50">
      <h3 className="text-lg font-bold">{t("budget.savePlan")}</h3>
      {loaded && <p className="text-base text-stone-800">{t("budget.editing", { name: loaded.name })}</p>}
      {loaded && (
        <Button icon="save" className="w-full" onClick={() => save("update")} disabled={saving}>
          {t("budget.updatePlan", { name: loaded.name })}
        </Button>
      )}
      <Field label={t("budget.planName")}>
        <Input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder={defaultName} maxLength={60} />
      </Field>
      <Button variant={loaded ? "secondary" : "primary"} icon="plus" className="w-full" onClick={() => save("new")} disabled={saving}>
        {loaded ? t("budget.saveNew") : t("budget.savePlan")}
      </Button>
    </Card>
  );

  return (
    <>
      <PageTitle
        title={t("budget.title")}
        subtitle={t("budget.subtitle")}
        action={plans.length > 0 ? <ExportButton href="/api/export/plans" label={t("xl.download")} /> : undefined}
      />

      {!canManage && (
        <p className="mb-4 flex items-start gap-2 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-base text-amber-950">
          <Icon name="eye" className="mt-0.5 h-5 w-5 shrink-0" />
          {t("budget.viewOnly")}
        </p>
      )}

      <div role="group" className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-stone-200 p-1.5">
        {(["build", "plans"] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={tab === k}
            onClick={() => setTab(k)}
            className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-2 text-base font-semibold ${
              tab === k ? "bg-white text-rose-900 shadow" : "text-stone-800"
            }`}
          >
            <Icon name={k === "build" ? "wallet" : "list"} className="h-5 w-5" />
            {k === "build" ? t("budget.tabBuild") : `${t("budget.tabPlans")} (${plans.length})`}
          </button>
        ))}
      </div>

      {tab === "plans" ? (
        <PlansPanel plans={plans} byId={byId} categories={categories} canManage={canManage} confirmed={confirmed} onOpen={openPlan} onBuild={() => setTab("build")} />
      ) : (
        <div className="pb-32 lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-6 lg:pb-0">
          <div className="space-y-4">
            <Card>
              <h2 className="mb-3 text-xl font-bold">{t("budget.guestCounts")}</h2>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("budget.adults")}>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={useList ? String(confirmed.adults) : adults}
                    disabled={useList}
                    onChange={(e) => setAdults(e.target.value)}
                    onFocus={(e) => e.target.select()}
                  />
                </Field>
                <Field label={t("budget.kids")}>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={useList ? String(confirmed.kids) : kids}
                    disabled={useList}
                    onChange={(e) => setKids(e.target.value)}
                    onFocus={(e) => e.target.select()}
                  />
                </Field>
              </div>
              <label className="mt-3 flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 border-stone-300 px-3 text-lg">
                <input type="checkbox" className="h-6 w-6 shrink-0 accent-rose-800" checked={useList} onChange={(e) => setUseList(e.target.checked)} />
                <span>
                  {t("budget.useGuestList")}
                  {useList && <span className="block text-base text-stone-700">{t("budget.fromList", { adults: confirmed.adults, kids: confirmed.kids })}</span>}
                </span>
              </label>
            </Card>

            {sections.map((s) => (
              <CategorySection key={s.category.slug} category={s.category} vendors={s.vendors} pick={picks[s.category.slug]} onSelect={select} />
            ))}
          </div>

          {/* Desktop: sticky side panel */}
          <aside className="hidden lg:sticky lg:top-24 lg:block">
            <Card>
              <Breakdown lines={lines} total={total} emptyKey="budget.nothingPicked" catNames={catNames} />
              {canManage && savePanel}
            </Card>
          </aside>

          {/* Mobile: bottom bar + sheet */}
          <div className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-rose-800 bg-white px-3 py-2 shadow-[0_-4px_12px_rgba(0,0,0,.15)] lg:hidden">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
              <div>
                <p className="text-base font-semibold leading-tight text-stone-700">{t("budget.total")}</p>
                <p className="text-2xl font-extrabold tabular-nums leading-tight text-rose-900">{formatMoney(total)}</p>
              </div>
              <Button icon="up" onClick={() => setSheetOpen(true)}>
                {t("budget.seeDetails")}
              </Button>
            </div>
          </div>

          {sheetOpen && (
            <div className="fixed inset-0 z-50 flex items-end bg-black/50 lg:hidden" onClick={() => setSheetOpen(false)}>
              <div
                role="dialog"
                aria-modal="true"
                className="max-h-[88dvh] w-full overflow-y-auto overscroll-contain rounded-t-2xl bg-white p-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-3 flex justify-end">
                  <Button variant="secondary" icon="down" onClick={() => setSheetOpen(false)}>
                    {t("budget.hideDetails")}
                  </Button>
                </div>
                <Breakdown lines={lines} total={total} emptyKey="budget.nothingPickedMobile" catNames={catNames} />
                {canManage && savePanel}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
