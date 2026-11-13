"use client";
import Image from "next/image";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/Modal";
import { useLang, useT } from "@/components/Providers";
import { Badge, Button } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { bi, type VendorDTO } from "@/lib/types";

/** Popup with everything about one vendor: photos, contact, charges and every package (tap a package for its details). */
export function VendorDetails({
  vendor,
  categoryName,
  canManage,
  isMine,
  busy,
  onClose,
  onEdit,
  onDelete,
}: {
  vendor: VendorDTO;
  categoryName: string;
  /** may edit/delete this vendor (admin, or the editor who added it) */
  canManage: boolean;
  isMine: boolean;
  busy: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useT();
  const lang = useLang();
  const [photo, setPhoto] = useState(0);
  const [openOpt, setOpenOpt] = useState<string | null>(vendor.options.length === 1 ? vendor.options[0]._id : null);
  const name = bi(vendor.name, lang);
  const terms = [vendor.serviceCharge > 0 && t("vendors.charge", { pct: vendor.serviceCharge }), vendor.minPlates > 0 && t("vendors.min", { n: vendor.minPlates })].filter(Boolean);

  return (
    <Modal title={name} onClose={onClose}>
      <div className="space-y-5">
        {/* Photos */}
        {vendor.images.length > 0 ? (
          <div className="space-y-2">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-stone-200">
              <Image key={photo} src={vendor.images[photo] ?? vendor.images[0]} alt={name} fill sizes="(min-width: 640px) 36rem, 100vw" className="object-cover" />
            </div>
            {vendor.images.length > 1 && (
              <div className="flex gap-2">
                {vendor.images.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setPhoto(i)}
                    aria-label={`${name} ${i + 1}`}
                    aria-current={i === photo}
                    className={`relative h-16 w-16 overflow-hidden rounded-xl border-2 ${i === photo ? "border-rose-800" : "border-transparent opacity-80"}`}
                  >
                    <Image src={src} alt="" fill sizes="64px" loading="lazy" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex aspect-[16/7] items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-rose-50 to-amber-50 text-rose-800">
            <Icon name="image" className="h-8 w-8" />
            <span className="text-base">{t("vendors.noPhoto")}</span>
          </div>
        )}

        {/* Basics */}
        <div className="space-y-2">
          <Badge tone="rose">{categoryName}</Badge>
          {vendor.contact && (
            <p>
              <a href={`tel:${vendor.contact.replace(/[^\d+]/g, "")}`} className="inline-flex min-h-11 items-center gap-2 text-lg font-semibold text-rose-900 underline">
                <Icon name="phone" className="h-5 w-5" />
                {vendor.contact}
              </a>
            </p>
          )}
          {terms.length > 0 && <p className="text-base text-stone-800">{terms.join(" · ")}</p>}
          {(isMine || vendor.addedByName) && (
            <p className="text-base text-stone-600">
              {t("xl.addedBy")}: {isMine ? t("guests.you") : vendor.addedByName}
            </p>
          )}
        </div>

        {/* Packages: tap one to see its details */}
        <div>
          <h3 className="mb-2 text-lg font-bold">{t("vendors.options")}</h3>
          {vendor.options.length === 0 ? (
            <p className="rounded-xl bg-stone-100 px-4 py-4 text-base text-stone-700">{t("vendors.noOptions")}</p>
          ) : (
            <ul className="space-y-2">
              {vendor.options.map((o) => {
                const open = openOpt === o._id;
                return (
                  <li key={o._id} className={`overflow-hidden rounded-xl border-2 ${open ? "border-rose-800" : "border-stone-300"}`}>
                    <button
                      type="button"
                      onClick={() => setOpenOpt(open ? null : o._id)}
                      aria-expanded={open}
                      className="flex min-h-14 w-full items-center gap-3 bg-white px-3 py-2 text-left"
                    >
                      <span className="min-w-0 flex-1 text-lg font-semibold">{bi(o.name, lang)}</span>
                      <span className="shrink-0 text-lg font-bold text-rose-900">{formatMoney(o.price)}</span>
                      <Icon name={open ? "up" : "down"} className="h-5 w-5 text-stone-600" />
                    </button>
                    {open && (
                      <div className="space-y-2 border-t border-stone-200 bg-stone-50 px-3 py-3 text-base">
                        <p>
                          <span className="font-semibold">{t(`pricetype.${o.priceType}`)}</span>
                          {o.priceType === "per_plate" && (
                            <span className="text-stone-800">
                              {" "}
                              · {t("budget.kids")}: {formatMoney(o.kidsPrice ?? o.price)}
                            </span>
                          )}
                        </p>
                        {o.inclusions.length > 0 ? (
                          <ul className="list-disc space-y-0.5 pl-5">
                            {o.inclusions.map((x, i) => (
                              <li key={i}>{bi(x, lang)}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-stone-600">{t("vendors.noInclusions")}</p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {canManage && (
          <div className="flex flex-wrap gap-3 border-t border-stone-200 pt-4">
            <Button variant="secondary" icon="edit" onClick={onEdit}>
              {t("common.edit")}
            </Button>
            <Button variant="danger" icon="trash" onClick={onDelete} disabled={busy}>
              {t("common.delete")}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
