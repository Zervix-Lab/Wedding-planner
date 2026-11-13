"use client";
import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { ExportButton } from "@/components/ExportButton";
import { Icon } from "@/components/Icon";
import { useConfirm, useLang, useT, useToast } from "@/components/Providers";
import { Button, EmptyState, PageTitle, Select } from "@/components/ui";
import { canModifyVendor, type Actor } from "@/lib/permissions";
import { bi, type CategoryDTO, type VendorDTO } from "@/lib/types";
import { deleteVendor } from "./actions";
import { VendorDetails } from "./VendorDetails";
import { VendorForm } from "./VendorForm";

export function VendorsManager({
  vendors,
  categories,
  me,
  canAdd,
}: {
  vendors: VendorDTO[];
  categories: CategoryDTO[];
  me: Actor;
  /** may add new vendors (admin, or an editor the admin allowed) */
  canAdd: boolean;
}) {
  const t = useT();
  const lang = useLang();
  const toast = useToast();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<VendorDTO | null | "new">(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [hidden, setHidden] = useState<string[]>([]); // optimistic deletes
  const [pending, start] = useTransition();

  const catName = useMemo(() => new Map(categories.map((c) => [c.slug, bi(c.name, lang)])), [categories, lang]);

  // One section per category (in the usual category order). Empty categories are skipped.
  const sections = useMemo(() => {
    const live = vendors.filter((v) => !hidden.includes(v._id) && (filter === "all" || v.category === filter));
    return categories.map((c) => ({ category: c, vendors: live.filter((v) => v.category === c.slug) })).filter((s) => s.vendors.length > 0);
  }, [vendors, categories, filter, hidden]);

  // Look the vendor up again each render so the popup always shows the latest saved data
  const viewing = viewingId ? (vendors.find((v) => v._id === viewingId && !hidden.includes(v._id)) ?? null) : null;

  async function remove(v: VendorDTO) {
    if (!(await confirm(t("vendors.confirmDelete", { name: bi(v.name, lang) })))) return;
    setHidden((h) => [...h, v._id]);
    setViewingId(null);
    start(async () => {
      const res = await deleteVendor(v._id);
      if (res.ok) toast.success("common.deleted");
      else {
        setHidden((h) => h.filter((x) => x !== v._id));
        toast.error(res.error);
      }
    });
  }

  const addButton = canAdd ? (
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

      {!canAdd && (
        <p className="mb-4 flex items-start gap-2 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-base text-amber-950">
          <Icon name="eye" className="mt-0.5 h-5 w-5 shrink-0" />
          {t("vendors.viewOnly")}
        </p>
      )}

      {vendors.length === 0 ? (
        <EmptyState icon="store" title={t("vendors.empty")} hint={canAdd ? t("vendors.emptyHint") : undefined} action={addButton} />
      ) : (
        <>
          <div className="mb-2 max-w-xs">
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
          <p className="mb-5 text-base text-stone-700">{t("vendors.tapHint")}</p>

          <div className={`space-y-8 ${pending ? "opacity-70" : ""}`}>
            {sections.map((s) => (
              <section key={s.category.slug} aria-labelledby={`vs-${s.category.slug}`}>
                <h2 id={`vs-${s.category.slug}`} className="mb-3 flex items-center gap-2 border-b-2 border-rose-200 pb-1.5 text-xl font-bold text-rose-900">
                  {bi(s.category.name, lang)}
                  <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-base font-semibold text-rose-900">{s.vendors.length}</span>
                </h2>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {s.vendors.map((v) => (
                    <li key={v._id}>
                      <button
                        type="button"
                        onClick={() => setViewingId(v._id)}
                        className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-stone-300 bg-white text-left shadow-sm transition hover:border-rose-400 hover:shadow-md focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-rose-700 active:scale-[.98]"
                      >
                        <span className="relative block aspect-[4/3] w-full bg-stone-200">
                          {v.images[0] ? (
                            <Image src={v.images[0]} alt="" fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" loading="lazy" className="object-cover transition group-hover:scale-105" />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rose-50 to-amber-50 text-rose-700">
                              <Icon name="image" className="h-8 w-8" />
                            </span>
                          )}
                        </span>
                        <span className="flex flex-1 flex-col gap-0.5 p-3">
                          <span className="line-clamp-2 break-words text-lg font-bold leading-snug text-stone-900">{bi(v.name, lang)}</span>
                          <span className="text-base text-stone-700">{v.options.length === 0 ? t("vendors.noOptions") : t("vendors.packagesCount", { n: v.options.length })}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}

      {viewing && !editing && (
        <VendorDetails
          vendor={viewing}
          categoryName={catName.get(viewing.category) ?? viewing.category}
          canManage={canModifyVendor(me, viewing.addedById)}
          isMine={viewing.addedById === me.id}
          busy={pending}
          onClose={() => setViewingId(null)}
          onEdit={() => {
            setEditing(viewing);
            setViewingId(null);
          }}
          onDelete={() => remove(viewing)}
        />
      )}

      {editing && (canAdd || editing !== "new") && (
        <VendorForm vendor={editing === "new" ? null : editing} categories={categories} onClose={() => setEditing(null)} />
      )}
    </>
  );
}
