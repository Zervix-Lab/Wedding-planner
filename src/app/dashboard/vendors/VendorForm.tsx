"use client";
import { useState, useTransition, type FormEvent } from "react";
import { BiField } from "@/components/BiField";
import { ImageUploader } from "@/components/ImageUploader";
import { Modal } from "@/components/Modal";
import { useLang, useT, useToast } from "@/components/Providers";
import { Button, Field, Input, Select } from "@/components/ui";
import { PRICE_TYPES, bi, type Bi, type CategoryDTO, type PriceType, type VendorDTO } from "@/lib/types";
import { createVendor, updateVendor } from "./actions";

const NEW = "__new__";

interface OptionForm {
  key: string;
  _id?: string;
  name: Bi;
  priceType: PriceType;
  price: string;
  kidsPrice: string;
  inclusions: Bi; // one per line, in each language
}

interface FormState {
  name: Bi;
  category: string;
  newCategory: Bi;
  contact: string;
  serviceCharge: string;
  minPlates: string;
  images: string[];
  options: OptionForm[];
}

let keySeq = 0;
const newKey = () => `k${++keySeq}`;
const emptyBi = (): Bi => ({ en: "", si: "" });
const emptyOption = (): OptionForm => ({ key: newKey(), name: emptyBi(), priceType: "fixed", price: "", kidsPrice: "", inclusions: emptyBi() });

function fromVendor(v: VendorDTO | null, firstCategory: string): FormState {
  if (!v) {
    return { name: emptyBi(), category: firstCategory, newCategory: emptyBi(), contact: "", serviceCharge: "0", minPlates: "0", images: [], options: [] };
  }
  return {
    name: v.name,
    category: v.category,
    newCategory: emptyBi(),
    contact: v.contact,
    serviceCharge: String(v.serviceCharge),
    minPlates: String(v.minPlates),
    images: v.images,
    options: v.options.map((o) => ({
      key: newKey(),
      _id: o._id,
      name: o.name,
      priceType: o.priceType,
      price: String(o.price),
      kidsPrice: o.kidsPrice === null ? "" : String(o.kidsPrice),
      inclusions: { en: o.inclusions.map((x) => x.en || x.si).join("\n"), si: "" },
    })),
  };
}

/** One item per line, each saved as typed. */
function toLines(b: Bi): Bi[] {
  return (b.en || b.si)
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => ({ en: s, si: "" }));
}

export function VendorForm({
  vendor,
  categories,
  onClose,
}: {
  vendor: VendorDTO | null;
  categories: CategoryDTO[];
  onClose: () => void;
}) {
  const t = useT();
  const lang = useLang();
  const toast = useToast();
  const [form, setForm] = useState<FormState>(() => fromVendor(vendor, categories[0]?.slug ?? "hotel"));
  const [pending, start] = useTransition();

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));
  const setOption = (key: string, patch: Partial<OptionForm>) =>
    setForm((f) => ({ ...f, options: f.options.map((o) => (o.key === key ? { ...o, ...patch } : o)) }));

  // Service charge / minimum plates only matter when at least one option is priced per plate (hotels, catering).
  const hasPerPlate = form.options.some((o) => o.priceType === "per_plate");

  function submit(e: FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      category: form.category,
      newCategory: form.newCategory,
      contact: form.contact,
      serviceCharge: hasPerPlate ? form.serviceCharge : "0",
      minPlates: hasPerPlate ? form.minPlates : "0",
      images: form.images,
      options: form.options.map((o) => ({
        _id: o._id,
        name: o.name,
        priceType: o.priceType,
        price: o.price,
        kidsPrice: o.kidsPrice,
        inclusions: toLines(o.inclusions),
      })),
    };
    start(async () => {
      const res = vendor ? await updateVendor(vendor._id, payload) : await createVendor(payload);
      if (res.ok) {
        toast.success("common.saved");
        onClose();
      } else toast.error(res.error);
    });
  }

  return (
    <Modal title={vendor ? t("vendors.edit") : t("vendors.add")} onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <BiField label={t("vendors.name")} value={form.name} onChange={(v) => set("name", v)} required autoFocus />

        <Field label={t("vendors.category")}>
          <Select value={form.category} onChange={(e) => set("category", e.target.value)}>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {bi(c.name, lang)}
              </option>
            ))}
            <option value={NEW}>+ {t("vendors.newCategory")}</option>
          </Select>
        </Field>
        {form.category === NEW && (
          <div className="rounded-xl border-2 border-rose-300 bg-rose-50 p-3">
            <BiField label={t("vendors.newCategoryName")} value={form.newCategory} onChange={(v) => set("newCategory", v)} required maxLength={80} />
          </div>
        )}

        <Field label={t("vendors.contact")}>
          <Input maxLength={120} value={form.contact} onChange={(e) => set("contact", e.target.value)} inputMode="tel" />
        </Field>

        {hasPerPlate && (
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("vendors.serviceCharge")}>
              <Input type="number" inputMode="decimal" min={0} max={100} step="any" value={form.serviceCharge} onChange={(e) => set("serviceCharge", e.target.value)} />
            </Field>
            <Field label={t("vendors.minPlates")} hint={t("vendors.minPlatesHint")}>
              <Input type="number" inputMode="numeric" min={0} value={form.minPlates} onChange={(e) => set("minPlates", e.target.value)} />
            </Field>
          </div>
        )}

        <div>
          <p className="mb-2 text-base font-semibold">{t("vendors.images")}</p>
          <ImageUploader value={form.images} onChange={(ids) => set("images", ids)} />
        </div>

        <div>
          <p className="text-base font-semibold">{t("vendors.options")}</p>
          <p className="mb-3 text-base text-stone-600">{t("vendors.optionsHint")}</p>
          <div className="space-y-4">
            {form.options.map((o) => (
              <fieldset key={o.key} className="space-y-3 rounded-xl border-2 border-stone-300 bg-stone-50 p-3">
                <BiField label={t("vendors.optionName")} value={o.name} onChange={(v) => setOption(o.key, { name: v })} required />
                <Field label={t("vendors.priceType")}>
                  <Select value={o.priceType} onChange={(e) => setOption(o.key, { priceType: e.target.value as PriceType })}>
                    {PRICE_TYPES.map((p) => (
                      <option key={p} value={p}>
                        {t(`pricetype.${p}`)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t("vendors.price")}>
                    <Input required type="number" inputMode="numeric" min={0} value={o.price} onChange={(e) => setOption(o.key, { price: e.target.value })} />
                  </Field>
                  {o.priceType === "per_plate" && (
                    <Field label={t("vendors.kidsPrice")} hint={t("vendors.kidsPriceHint")}>
                      <Input type="number" inputMode="numeric" min={0} value={o.kidsPrice} onChange={(e) => setOption(o.key, { kidsPrice: e.target.value })} />
                    </Field>
                  )}
                </div>
                <BiField
                  label={`${t("vendors.inclusions")} (${t("vendors.inclusionsHint")})`}
                  value={o.inclusions}
                  onChange={(v) => setOption(o.key, { inclusions: v })}
                 
                  multiline
                  maxLength={1500}
                />
                <Button variant="danger" icon="trash" onClick={() => set("options", form.options.filter((x) => x.key !== o.key))}>
                  {t("vendors.removeOption")}
                </Button>
              </fieldset>
            ))}
          </div>
          <Button variant="secondary" icon="plus" className="mt-3" onClick={() => set("options", [...form.options, emptyOption()])}>
            {t("vendors.addOption")}
          </Button>
        </div>

        <div className="sticky -bottom-4 -mx-4 -mb-4 border-t border-stone-300 bg-white px-4 py-3">
          <Button type="submit" icon="save" className="w-full" disabled={pending}>
            {pending ? t("common.pleaseWait") : t("common.save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
