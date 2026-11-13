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
  planCounts,
  sameChoice,
  type Counts,
  type Choice,
  type GuestCounts,
  type ListBasis,
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
  guests,
  categories,
  canManage,
}: {
  vendors: VendorDTO[];
  plans: PlanDTO[];
  guests: GuestCounts;
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
  const [basis, setBasis] = useState<ListBasis>("all");
  const [extraAdults, setExtraAdults] = useState("0");
  const [extraKids, setExtraKids] = useState("0");
  const [picks, setPicks] = useState<PickMap>({});
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  const byId = useMemo(() => indexVendors(vendors), [vendors]);
  const order = useMemo(() => categories.map((c) => c.slug), [categories]);
  const catNames = useMemo(() => new Map(categories.map((c) => [c.slug, bi(c.name, lang)])), [categories, lang]);
  const sections = useMemo(() => categories.map((c) => ({ category: c, vendors: vendors.filter((v) => v.category === c.slug) })), [categories, vendors]);

  // Live calculation: pure client-side, recalculated only when an input actually changes.
  const counts = useMemo<Counts>(
    () =>
      planCounts(
        { adults: toCount(adults), kids: toCount(kids), useGuestList: useList, listBasis: basis, extraAdults: toCount(extraAdults), extraKids: toCount(extraKids) },
        guests,
      ),
    [useList, basis, guests, adults, kids, extraAdults, extraKids],
  );
  const lines = useMemo(() => buildLines(picks, byId, counts.adults, counts.kids, order), [picks, byId, counts, order]);
  const total = useMemo(() => sumLines(lines), [lines]);

  // Stable callback so memoised CategorySections are not re-rendered by unrelated state changes
  const toggle = useCallback((category: Category, pick: Choice | null) => {
    setPicks((prev) => {
      const next = { ...prev };
      if (!pick) {
        delete next[category];
        return next;
      }
      const cur = prev[category] ?? [];
      const rest = cur.filter((c) => !sameChoice(c, pick));
      const list = rest.length === cur.length ? [...cur, pick] : rest; // not ticked yet -> add, already ticked -> remove
      if (list.length > 0) next[category] = list;
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
    setBasis(plan.listBasis);
    setExtraAdults(String(plan.extraAdults));
    setExtraKids(String(plan.extraKids));
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
      listBasis: basis,
      extraAdults: toCount(extraAdults),
      extraKids: toCount(extraKids),
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
        subtitle={canManage ? t("budget.subtitle") : t("budget.subtitleView")}
        action={plans.length > 0 ? <ExportButton href="/api/export/plans" label={t("xl.download")} /> : undefined}
      />

      {!canManage && (
        <p className="mb-4 flex items-start gap-2 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-base text-amber-950">
          <Icon name="eye" className="mt-0.5 h-5 w-5 shrink-0" />
          {t("budget.viewOnly")}
        </p>
      )}

      {canManage && (
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
      )}

      {/* Editors cannot build or save budgets: they only see what the admin saved */}
      {tab === "plans" || !canManage ? (
        <PlansPanel plans={plans} byId={byId} categories={categories} canManage={canManage} guests={guests} onOpen={openPlan} onBuild={() => setTab("build")} />
      ) : (
        <div className="pb-32 lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-6 lg:pb-0">
          <div className="space-y-4">
            <Card>
              <h2 className="mb-3 text-xl font-bold">{t("budget.guestCounts")}</h2>
              <label className="mb-3 flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 border-stone-300 px-3 text-lg">
                <input type="checkbox" className="h-6 w-6 shrink-0 accent-rose-800" checked={useList} onChange={(e) => setUseList(e.target.checked)} />
                <span>{t("budget.useGuestList")}</span>
              </label>

              {useList ? (
                <div className="space-y-4">
                  {/* Whole guest list, by reply status */}
                  <ul className="divide-y divide-stone-200 rounded-xl border-2 border-stone-300 bg-stone-50 text-base">
                    {(["confirmed", "maybe", "pending", "declined"] as const).map((s) => (
                      <li key={s} className="flex items-center justify-between gap-3 px-3 py-2">
                        <span className="font-semibold">{t(`rsvp.${s}`)}</span>
                        <span className="tabular-nums text-stone-800">{t("budget.adultsKids", { adults: guests[s].adults, kids: guests[s].kids })}</span>
                      </li>
                    ))}
                  </ul>

                  <div role="radiogroup" className="grid gap-2">
                    {(["all", "confirmed"] as const).map((b) => (
                      <label key={b} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 px-3 text-lg ${basis === b ? "border-rose-800 bg-rose-50" : "border-stone-300"}`}>
                        <input type="radio" name="basis" className="h-5 w-5 shrink-0 accent-rose-800" checked={basis === b} onChange={() => setBasis(b)} />
                        {t(`budget.basis.${b}`)}
                      </label>
                    ))}
                  </div>

                  <div>
                    <p className="mb-2 text-base font-semibold">{t("budget.extra")}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label={t("budget.adults")}>
                        <Input type="number" inputMode="numeric" min={0} value={extraAdults} onChange={(e) => setExtraAdults(e.target.value)} onFocus={(e) => e.target.select()} />
                      </Field>
                      <Field label={t("budget.kids")}>
                        <Input type="number" inputMode="numeric" min={0} value={extraKids} onChange={(e) => setExtraKids(e.target.value)} onFocus={(e) => e.target.select()} />
                      </Field>
                    </div>
                  </div>

                  <p className="rounded-xl bg-rose-50 px-3 py-2 text-lg font-bold text-rose-900">
                    {t("budget.counting", { adults: counts.adults, kids: counts.kids })}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t("budget.adults")}>
                    <Input type="number" inputMode="numeric" min={0} value={adults} onChange={(e) => setAdults(e.target.value)} onFocus={(e) => e.target.select()} />
                  </Field>
                  <Field label={t("budget.kids")}>
                    <Input type="number" inputMode="numeric" min={0} value={kids} onChange={(e) => setKids(e.target.value)} onFocus={(e) => e.target.select()} />
                  </Field>
                </div>
              )}
            </Card>

            {sections.map((s) => (
              <CategorySection key={s.category.slug} category={s.category} vendors={s.vendors} picks={picks[s.category.slug]} onToggle={toggle} />
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
          <div className="fixed inset-x-0 bottom-(--tabbar-h) z-30 border-t-2 border-rose-800 bg-white px-3 py-2 shadow-[0_-4px_12px_rgba(0,0,0,.15)] md:bottom-0 lg:hidden">
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
