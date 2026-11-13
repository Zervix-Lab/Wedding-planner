"use client";
import Image from "next/image";
import { memo } from "react";
import { Icon } from "@/components/Icon";
import { useLang, useT } from "@/components/Providers";
import type { Choice } from "@/lib/calc";
import { formatMoney } from "@/lib/money";
import { bi, type Category, type CategoryDTO, type VendorDTO } from "@/lib/types";

interface Props {
  category: CategoryDTO;
  vendors: VendorDTO[];
  pick: Choice | undefined;
  onSelect: (category: Category, pick: Choice | null) => void;
}

const CARD =
  "flex items-start gap-3 rounded-xl border-2 border-stone-300 bg-white p-3 transition peer-checked:border-rose-800 peer-checked:bg-rose-50 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-rose-700 hover:border-stone-500";

function Mark({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
        selected ? "border-rose-800 bg-rose-800 text-white" : "border-stone-400 bg-white"
      }`}
    >
      {selected && <Icon name="check" className="h-4 w-4" />}
    </span>
  );
}

/**
 * One section per category. Memoised: typing in the guest-count boxes (or picking in another category)
 * does not re-render this component, because its props only change when ITS selection changes.
 */
export const CategorySection = memo(function CategorySection({ category, vendors, pick, onSelect }: Props) {
  const t = useT();
  const lang = useLang();
  const name = `cat-${category.slug}`;

  return (
    <fieldset className="rounded-2xl border border-stone-300 bg-white p-3 shadow-sm sm:p-4">
      <legend className="mb-1 px-2 text-xl font-bold text-rose-900">{bi(category.name, lang)}</legend>

      <div className="space-y-3">
        <label className="block cursor-pointer">
          <input type="radio" name={name} className="peer sr-only" checked={!pick} onChange={() => onSelect(category.slug, null)} />
          <div className={CARD}>
            <Mark selected={!pick} />
            <span className="text-lg font-semibold">{t("budget.none")}</span>
          </div>
        </label>

        {vendors.length === 0 && <p className="px-1 text-lg text-stone-700">{t("budget.noVendors")}</p>}

        {vendors.map((v) => (
          <div key={v._id} className="rounded-xl bg-stone-100 p-2">
            <div className="flex items-center gap-3 px-1 pb-2 pt-1">
              {v.images[0] && (
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-stone-200">
                  <Image src={v.images[0]} alt="" fill sizes="56px" loading="lazy" className="object-cover" />
                </div>
              )}
              <div className="min-w-0">
                <p className="break-words text-lg font-bold">{bi(v.name, lang)}</p>
                {(v.serviceCharge > 0 || v.minPlates > 0) && (
                  <p className="text-base text-stone-700">
                    {[v.serviceCharge > 0 && t("vendors.charge", { pct: v.serviceCharge }), v.minPlates > 0 && t("vendors.min", { n: v.minPlates })]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </div>
            </div>

            {v.options.length === 0 ? (
              <p className="px-1 pb-1 text-base text-stone-700">{t("budget.noOptions")}</p>
            ) : (
              <div className="space-y-2">
                {v.options.map((o) => {
                  const selected = pick?.vendorId === v._id && pick.optionId === o._id;
                  return (
                    <label key={o._id} className="block cursor-pointer">
                      <input
                        type="radio"
                        name={name}
                        className="peer sr-only"
                        checked={selected}
                        onChange={() => onSelect(category.slug, { vendorId: v._id, optionId: o._id })}
                      />
                      <div className={CARD}>
                        <Mark selected={selected} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                            <span className="text-lg font-semibold">{bi(o.name, lang)}</span>
                            <span className="text-lg font-bold text-rose-900">{formatMoney(o.price)}</span>
                          </div>
                          <p className="text-base text-stone-700">
                            {t(`pricetype.${o.priceType}`)}
                            {o.priceType === "per_plate" && o.kidsPrice !== null && ` · ${t("budget.kids")}: ${formatMoney(o.kidsPrice)}`}
                          </p>
                          {o.inclusions.length > 0 && <p className="mt-1 text-base text-stone-800">{o.inclusions.map((x) => bi(x, lang)).join(", ")}</p>}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </fieldset>
  );
});
