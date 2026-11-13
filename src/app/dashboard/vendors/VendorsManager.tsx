"use client";
import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { DataTable, type Column } from "@/components/DataTable";
import { ExportButton } from "@/components/ExportButton";
import { Icon } from "@/components/Icon";
import { useConfirm, useLang, useT, useToast } from "@/components/Providers";
import { Badge, Button, EmptyState, PageTitle, Select } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { bi, type CategoryDTO, type VendorDTO } from "@/lib/types";
import { deleteVendor } from "./actions";
import { VendorForm } from "./VendorForm";

export function VendorsManager({
  vendors,
  categories,
  canManage,
}: {
  vendors: VendorDTO[];
  categories: CategoryDTO[];
  canManage: boolean;
}) {
  const t = useT();
  const lang = useLang();
  const toast = useToast();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<VendorDTO | null | "new">(null);
  const [filter, setFilter] = useState<string>("all");
  const [hidden, setHidden] = useState<string[]>([]); // optimistic deletes
  const [pending, start] = useTransition();

  const catName = useMemo(() => new Map(categories.map((c) => [c.slug, bi(c.name, lang)])), [categories, lang]);
  const shown = useMemo(
    () => vendors.filter((v) => !hidden.includes(v._id) && (filter === "all" || v.category === filter)),
    [vendors, filter, hidden],
  );

  async function remove(v: VendorDTO) {
    if (!(await confirm(t("vendors.confirmDelete", { name: bi(v.name, lang) })))) return;
    setHidden((h) => [...h, v._id]);
    start(async () => {
      const res = await deleteVendor(v._id);
      if (res.ok) toast.success("common.deleted");
      else {
        setHidden((h) => h.filter((x) => x !== v._id));
        toast.error(res.error);
      }
    });
  }

  const columns: Column<VendorDTO>[] = [
    {
      key: "name",
      header: t("vendors.name"),
      primary: true,
      cell: (v) => (
        <span className="flex items-center gap-3">
          <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-stone-200">
            {v.images[0] && <Image src={v.images[0]} alt="" fill sizes="56px" loading="lazy" className="object-cover" />}
          </span>
          <span className="min-w-0">
            {bi(v.name, lang)}
            <span className="mt-0.5 block">
              <Badge tone="rose">{catName.get(v.category) ?? v.category}</Badge>
            </span>
          </span>
        </span>
      ),
    },
    {
      key: "contact",
      header: t("vendors.contact"),
      cell: (v) =>
        v.contact ? (
          <a href={`tel:${v.contact.replace(/[^\d+]/g, "")}`} className="inline-flex min-h-11 items-center gap-1 break-all text-rose-900 underline">
            <Icon name="phone" className="h-4 w-4" />
            {v.contact}
          </a>
        ) : (
          <span className="text-stone-500">-</span>
        ),
    },
    {
      key: "packages",
      header: t("vendors.options"),
      cell: (v) =>
        v.options.length === 0 ? (
          <span className="text-stone-600">{t("vendors.noOptions")}</span>
        ) : (
          <ul className="space-y-1">
            {v.options.map((o) => (
              <li key={o._id}>
                <span className="font-semibold">{bi(o.name, lang)}</span>{" "}
                <span className="whitespace-nowrap font-bold text-rose-900">
                  {formatMoney(o.price)} <span className="font-normal text-stone-700">{t(`pricetype.${o.priceType}`)}</span>
                </span>
              </li>
            ))}
          </ul>
        ),
    },
    {
      key: "terms",
      header: t("vendors.terms"),
      cell: (v) => (
        <span className="flex flex-col items-end gap-1 xl:items-start">
          {(v.serviceCharge > 0 || v.minPlates > 0) && (
            <span>
              {[v.serviceCharge > 0 && t("vendors.charge", { pct: v.serviceCharge }), v.minPlates > 0 && t("vendors.min", { n: v.minPlates })].filter(Boolean).join(" · ")}
            </span>
          )}
          <Badge tone={v.showOnLanding ? "green" : "neutral"}>{v.showOnLanding ? t("xl.onLanding") : t("vendors.hidden")}</Badge>
        </span>
      ),
    },
    ...(canManage
      ? [
          {
            key: "actions",
            header: "",
            actions: true,
            cell: (v: VendorDTO) => (
              <div className="flex flex-wrap gap-2 xl:flex-col">
                <Button variant="secondary" icon="edit" onClick={() => setEditing(v)}>
                  {t("common.edit")}
                </Button>
                <Button variant="danger" icon="trash" onClick={() => remove(v)} disabled={pending}>
                  {t("common.delete")}
                </Button>
              </div>
            ),
          } satisfies Column<VendorDTO>,
        ]
      : []),
  ];

  const addButton = canManage ? (
    <Button icon="plus" onClick={() => setEditing("new")}>
      {t("vendors.add")}
    </Button>
  ) : undefined;

  return (
    <>
      <PageTitle
        title={t("vendors.title")}
        subtitle={t("vendors.subtitle")}
        action={
          <div className="flex flex-wrap gap-2">
            {vendors.length > 0 && <ExportButton href="/api/export/vendors" label={t("xl.download")} />}
            {vendors.length > 0 && addButton}
          </div>
        }
      />

      {!canManage && (
        <p className="mb-4 flex items-start gap-2 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-base text-amber-950">
          <Icon name="eye" className="mt-0.5 h-5 w-5 shrink-0" />
          {t("vendors.viewOnly")}
        </p>
      )}

      {vendors.length === 0 ? (
        <EmptyState icon="store" title={t("vendors.empty")} hint={canManage ? t("vendors.emptyHint") : undefined} action={addButton} />
      ) : (
        <>
          <div className="mb-4 max-w-xs">
            <Select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label={t("vendors.category")}>
              <option value="all">{t("common.all")}</option>
              {categories
                .filter((c) => vendors.some((v) => v.category === c.slug))
                .map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {bi(c.name, lang)}
                  </option>
                ))}
            </Select>
          </div>
          <DataTable columns={columns} rows={shown} rowKey={(v) => v._id} dim={pending} />
        </>
      )}

      {editing && canManage && (
        <VendorForm vendor={editing === "new" ? null : editing} categories={categories} onClose={() => setEditing(null)} />
      )}
    </>
  );
}
