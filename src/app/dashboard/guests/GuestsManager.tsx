"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { DataTable, type Column } from "@/components/DataTable";
import { ExportButton } from "@/components/ExportButton";
import { Icon } from "@/components/Icon";
import { useConfirm, useLang, useT, useToast } from "@/components/Providers";
import { Badge, Button, Card, EmptyState, Input, PageTitle, Select } from "@/components/ui";
import { canModifyGuest } from "@/lib/permissions";
import { GROUPS, RSVPS, SIDES, bi, type GuestDTO, type Role, type Rsvp, type Side } from "@/lib/types";
import { deleteGuest } from "./actions";
import { GuestForm } from "./GuestForm";

interface Query {
  q: string;
  side: string;
  group: string;
  rsvp: string;
  /** "1" = only the guests I added */
  mine: string;
}

interface Props {
  guests: GuestDTO[];
  summary: { count: number; adults: number; kids: number };
  page: number;
  pages: number;
  hasAny: boolean;
  defaultSide: Side;
  me: { id: string; role: Role };
  query: Query;
}

const RSVP_TONE: Record<Rsvp, "green" | "amber" | "rose" | "neutral"> = { confirmed: "green", maybe: "amber", declined: "rose", pending: "neutral" };

export function GuestsManager({ guests, summary, page, pages, hasAny, defaultSide, me, query }: Props) {
  const t = useT();
  const lang = useLang();
  const toast = useToast();
  const confirm = useConfirm();
  const router = useRouter();
  const pathname = usePathname();
  const [navPending, startNav] = useTransition();
  const [delPending, startDel] = useTransition();
  const [editing, setEditing] = useState<GuestDTO | null>(null);
  const [formOpen, setFormOpen] = useState(false); // phones only; the form is always visible from md up
  const [search, setSearch] = useState(query.q);
  const [hidden, setHidden] = useState<string[]>([]); // rows deleted but not yet confirmed by the server (optimistic)
  const formRef = useRef<HTMLDivElement>(null);

  // The most recently REQUESTED query. Updated synchronously in go(), so a debounce timer firing while a
  // filter navigation is still in flight can never overwrite that filter with a stale copy.
  const queryRef = useRef(query);
  useEffect(() => {
    if (!navPending) queryRef.current = query;
  }, [query.q, query.side, query.group, query.rsvp, query.mine, navPending]); // eslint-disable-line react-hooks/exhaustive-deps

  function go(next: Partial<Query> & { page?: number }) {
    const merged = { ...queryRef.current, ...next };
    queryRef.current = merged;
    const params = new URLSearchParams();
    for (const k of ["q", "side", "group", "rsvp", "mine"] as const) if (merged[k]) params.set(k, merged[k]);
    if (next.page && next.page > 1) params.set("page", String(next.page));
    const qs = params.toString();
    startNav(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  // Debounce typing: only hit the server 350ms after the user stops typing
  useEffect(() => {
    if (search.trim() === queryRef.current.q) return;
    const id = setTimeout(() => go({ q: search.trim() }), 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function startEdit(g: GuestDTO) {
    setEditing(g);
    setFormOpen(true);
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  async function remove(g: GuestDTO) {
    if (!(await confirm(t("guests.confirmDelete", { name: bi(g.name, lang) })))) return;
    setHidden((h) => [...h, g._id]); // the row disappears instantly...
    if (editing?._id === g._id) setEditing(null);
    startDel(async () => {
      const res = await deleteGuest(g._id);
      if (res.ok) toast.success("common.deleted");
      else {
        setHidden((h) => h.filter((x) => x !== g._id)); // ...and comes back if the server said no
        toast.error(res.error);
      }
    });
  }

  const visible = guests.filter((g) => !hidden.includes(g._id));
  const filtered = Boolean(query.q || query.side || query.group || query.rsvp || query.mine);
  const exportQs = new URLSearchParams(Object.entries(query).filter(([, v]) => v)).toString();

  const columns: Column<GuestDTO>[] = [
    {
      key: "name",
      header: t("guests.name"),
      primary: true,
      cell: (g) => {
        return (
          <span>
            {bi(g.name, lang)}
            {g.phone && (
              <a href={`tel:${g.phone.replace(/[^\d+]/g, "")}`} className="inline-flex min-h-11 items-center gap-1 whitespace-nowrap text-base font-normal text-rose-900 underline">
                <Icon name="phone" className="h-4 w-4" />
                {g.phone}
              </a>
            )}
            {g.notes && <span className="mt-1 block whitespace-pre-wrap rounded-lg bg-stone-100 px-2 py-1 text-base font-normal text-stone-800">{g.notes}</span>}
          </span>
        );
      },
    },
    {
      key: "side",
      header: t("guests.side"),
      cell: (g) => (
        <span className="flex flex-wrap justify-end gap-1.5 xl:justify-start">
          <Badge tone="blue">{t(`side.${g.side}`)}</Badge>
          <Badge>{t(`group.${g.group}`)}</Badge>
        </span>
      ),
    },
    { key: "people", header: t("xl.people"), cell: (g) => <span>{t("guests.adultsKids", { adults: g.adults, kids: g.kids })}</span> },
    {
      key: "invitation",
      header: t("guests.invitation"),
      cell: (g) => <span>{t(`invitation.${g.invitation}`)}</span>,
    },
    { key: "rsvp", header: t("guests.rsvp"), cell: (g) => <Badge tone={RSVP_TONE[g.rsvp]}>{t(`rsvp.${g.rsvp}`)}</Badge> },
    {
      key: "by",
      header: t("xl.addedBy"),
      cell: (g) =>
        g.addedById === me.id ? <Badge tone="green">{t("guests.you")}</Badge> : g.addedByName || <span className="text-stone-500">-</span>,
    },
    {
      key: "actions",
      header: "",
      actions: true,
      cell: (g) => (
        <div className="flex flex-wrap gap-2 xl:flex-col">
          {canModifyGuest(me, g.addedById) ? (
            <>
              <Button variant="secondary" icon="edit" onClick={() => startEdit(g)}>
                {t("common.edit")}
              </Button>
              <Button variant="danger" icon="trash" onClick={() => remove(g)} disabled={delPending}>
                {t("common.delete")}
              </Button>
            </>
          ) : (
            <span className="text-base text-stone-500">{t("guests.viewOnly")}</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageTitle
        title={t("guests.title")}
        subtitle={t("guests.subtitle")}
        action={hasAny ? <ExportButton href={`/api/export/guests${exportQs ? `?${exportQs}` : ""}`} label={t("xl.download")} /> : undefined}
      />

      {/* Form on top, table below */}
      <div ref={formRef} className="scroll-mt-20">
        <Card className="mb-6 border-2 border-rose-200">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">{editing ? t("guests.edit") : t("guests.add")}</h2>
            <Button variant="ghost" icon={formOpen ? "up" : "down"} className="md:hidden" onClick={() => setFormOpen((v) => !v)}>
              {formOpen ? t("common.close") : t("common.open")}
            </Button>
          </div>
          <div className={`${formOpen ? "block" : "hidden"} md:block`}>
            <GuestForm
              key={editing?._id ?? "new"}
              guest={editing}
              defaultSide={defaultSide}
             
              onDone={() => {
                setEditing(null);
                if (editing) setFormOpen(false);
              }}
            />
          </div>
        </Card>
      </div>

      {!hasAny ? (
        <EmptyState icon="users" title={t("guests.empty")} hint={t("guests.emptyHint")} />
      ) : (
        <>
          <div className="mb-4 space-y-3">
            {/* Everyone sees every guest; "My guests" shows only the ones I added (the ones I can edit) */}
            <div role="group" className="grid grid-cols-2 gap-2 rounded-2xl bg-stone-200 p-1.5">
              {(["", "1"] as const).map((v) => (
                <button
                  key={v || "all"}
                  type="button"
                  aria-pressed={query.mine === v}
                  onClick={() => go({ mine: v })}
                  className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-2 text-base font-semibold ${
                    query.mine === v ? "bg-white text-rose-900 shadow" : "text-stone-800"
                  }`}
                >
                  <Icon name="users" className="h-5 w-5" />
                  {v ? t("guests.tabMine") : t("guests.tabAll")}
                </button>
              ))}
            </div>
            <div className="relative">
              <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-6 w-6 -translate-y-1/2 text-stone-600" />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("guests.search")}
                aria-label={t("guests.search")}
                className="pl-12"
                maxLength={60}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Select value={query.side} onChange={(e) => go({ side: e.target.value })} aria-label={t("guests.side")}>
                <option value="">{t("guests.allSides")}</option>
                {SIDES.map((s) => (
                  <option key={s} value={s}>
                    {t(`side.${s}`)}
                  </option>
                ))}
              </Select>
              <Select value={query.group} onChange={(e) => go({ group: e.target.value })} aria-label={t("guests.group")}>
                <option value="">{t("guests.allGroups")}</option>
                {GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {t(`group.${g}`)}
                  </option>
                ))}
              </Select>
              <Select value={query.rsvp} onChange={(e) => go({ rsvp: e.target.value })} aria-label={t("guests.rsvp")}>
                <option value="">{t("guests.allStatuses")}</option>
                {RSVPS.map((r) => (
                  <option key={r} value={r}>
                    {t(`rsvp.${r}`)}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <p className="mb-3 text-lg font-semibold text-stone-900" aria-live="polite">
            {t("guests.summary", { count: summary.count, adults: summary.adults, kids: summary.kids })}
          </p>

          {visible.length === 0 ? (
            <EmptyState
              icon="search"
              title={t("guests.noResults")}
              action={
                filtered ? (
                  <Button
                    variant="secondary"
                    icon="x"
                    onClick={() => {
                      setSearch("");
                      go({ q: "", side: "", group: "", rsvp: "", mine: "" });
                    }}
                  >
                    {t("guests.clearFilters")}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <DataTable columns={columns} rows={visible} rowKey={(g) => g._id} dim={navPending} />
          )}

          {pages > 1 && (
            <nav className="mt-6 flex flex-wrap items-center justify-between gap-3" aria-label="Pages">
              <Button variant="secondary" icon="left" disabled={page <= 1 || navPending} onClick={() => go({ page: page - 1 })}>
                {t("guests.prev")}
              </Button>
              <span className="text-lg font-semibold">{t("guests.page", { page, pages })}</span>
              <Button variant="secondary" icon="right" disabled={page >= pages || navPending} onClick={() => go({ page: page + 1 })}>
                {t("guests.next")}
              </Button>
            </nav>
          )}
        </>
      )}
    </>
  );
}
