"use client";
import { useState, useTransition, type FormEvent } from "react";
import { BiField } from "@/components/BiField";
import { useT, useToast } from "@/components/Providers";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import {
  EVENTS,
  GROUPS,
  INVITATIONS,
  RSVPS,
  SIDES,
  type Bi,
  type Group,
  type GuestDTO,
  type Invitation,
  type Rsvp,
  type Side,
  type WeddingEvent,
} from "@/lib/types";
import { createGuest, updateGuest } from "./actions";

interface FormState {
  name: Bi;
  phone: string;
  side: Side;
  group: Group;
  adults: string;
  kids: string;
  events: WeddingEvent[];
  invitation: Invitation;
  rsvp: Rsvp;
  notes: string;
}

const blank = (side: Side): FormState => ({
  name: { en: "", si: "" },
  phone: "",
  side,
  group: "family",
  adults: "1",
  kids: "0",
  events: ["wedding", "homecoming"],
  invitation: "not_sent",
  rsvp: "pending",
  notes: "",
});

/** Inline form (sits above the table). Remount it with a new `key` to switch between "add" and "edit". */
export function GuestForm({ guest, defaultSide, onDone }: { guest: GuestDTO | null; defaultSide: Side; onDone: () => void }) {
  const t = useT();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [form, setForm] = useState<FormState>(() => (guest ? { ...guest, adults: String(guest.adults), kids: String(guest.kids) } : blank(defaultSide)));
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));
  const toggleEvent = (e: WeddingEvent) => set("events", form.events.includes(e) ? form.events.filter((x) => x !== e) : [...form.events, e]);

  function submit(e: FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = guest ? await updateGuest(guest._id, form) : await createGuest(form);
      if (res.ok) {
        toast.success("common.saved");
        setForm(blank(form.side)); // ready for the next guest; keeps the same side to speed up bulk entry
        onDone();
      } else toast.error(res.error);
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="sm:col-span-2 lg:col-span-4">
        <BiField label={t("guests.name")} value={form.name} onChange={(v) => set("name", v)} required />
      </div>
      <Field label={t("guests.phone")}>
        <Input type="tel" inputMode="tel" maxLength={30} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
      </Field>
      <Field label={t("guests.side")}>
        <Select value={form.side} onChange={(e) => set("side", e.target.value as Side)}>
          {SIDES.map((s) => (
            <option key={s} value={s}>
              {t(`side.${s}`)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t("guests.group")}>
        <Select value={form.group} onChange={(e) => set("group", e.target.value as Group)}>
          {GROUPS.map((g) => (
            <option key={g} value={g}>
              {t(`group.${g}`)}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("guests.adults")}>
          <Input type="number" inputMode="numeric" min={0} max={100} value={form.adults} onChange={(e) => set("adults", e.target.value)} onFocus={(e) => e.target.select()} />
        </Field>
        <Field label={t("guests.kids")}>
          <Input type="number" inputMode="numeric" min={0} max={100} value={form.kids} onChange={(e) => set("kids", e.target.value)} onFocus={(e) => e.target.select()} />
        </Field>
      </div>

      <fieldset className="sm:col-span-2">
        <legend className="mb-1 text-base font-semibold">{t("guests.events")}</legend>
        <div className="flex flex-col gap-2 sm:flex-row">
          {EVENTS.map((ev) => (
            <label key={ev} className="flex min-h-12 flex-1 cursor-pointer items-center gap-3 rounded-xl border-2 border-stone-300 bg-white px-4 text-lg">
              <input type="checkbox" checked={form.events.includes(ev)} onChange={() => toggleEvent(ev)} className="h-6 w-6 accent-rose-800" />
              {t(`event.${ev}`)}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label={t("guests.invitation")}>
        <Select value={form.invitation} onChange={(e) => set("invitation", e.target.value as Invitation)}>
          {INVITATIONS.map((i) => (
            <option key={i} value={i}>
              {t(`invitation.${i}`)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t("guests.rsvp")}>
        <Select value={form.rsvp} onChange={(e) => set("rsvp", e.target.value as Rsvp)}>
          {RSVPS.map((r) => (
            <option key={r} value={r}>
              {t(`rsvp.${r}`)}
            </option>
          ))}
        </Select>
      </Field>
      <div className="sm:col-span-2 lg:col-span-4">
        <Field label={t("guests.notes")}>
          <Textarea rows={2} maxLength={500} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </Field>
      </div>

      <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-4">
        <Button type="submit" icon="save" disabled={pending}>
          {pending ? t("common.pleaseWait") : guest ? t("common.save") : t("guests.add")}
        </Button>
        {guest && (
          <Button variant="secondary" icon="x" onClick={onDone}>
            {t("common.cancel")}
          </Button>
        )}
      </div>
    </form>
  );
}
