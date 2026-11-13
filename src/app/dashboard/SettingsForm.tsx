"use client";
import { useState, useTransition, type FormEvent } from "react";
import { Icon } from "@/components/Icon";
import { useT, useToast } from "@/components/Providers";
import { Button, Card, Field, Input, Textarea } from "@/components/ui";
import type { SettingsDTO } from "@/lib/types";
import { saveSettings } from "./settings-actions";

type EventKey = "wedding";

export function SettingsForm({ initial, highlight }: { initial: SettingsDTO; highlight: boolean }) {
  const t = useT();
  const toast = useToast();
  const [form, setForm] = useState(initial);
  const [pending, start] = useTransition();
  const set = <K extends keyof SettingsDTO>(k: K, v: SettingsDTO[K]) => setForm((f) => ({ ...f, [k]: v }));

  function submit(e: FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await saveSettings(form);
      if (res.ok) toast.success("common.saved");
      else toast.error(res.error);
    });
  }

  const eventBox = (ev: EventKey, title: string) => (
    <fieldset className="space-y-3 rounded-2xl border-2 border-stone-300 bg-stone-50 p-4">
      <legend className="flex items-center gap-2 px-2 text-lg font-bold text-rose-900">
        <Icon name="calendar" className="h-5 w-5" />
        {title}
      </legend>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("dash.eventDate")}>
          <Input type="date" value={form[`${ev}Date`]} onChange={(e) => set(`${ev}Date`, e.target.value)} />
        </Field>
        <Field label={t("dash.eventTime")}>
          <Input type="time" value={form[`${ev}Time`]} onChange={(e) => set(`${ev}Time`, e.target.value)} />
        </Field>
      </div>
      <Field label={t("dash.eventVenue")}>
        <Input maxLength={200} value={form[`${ev}Venue`]} onChange={(e) => set(`${ev}Venue`, e.target.value)} />
      </Field>
      <Field label={t("dash.eventMap")} hint={t("dash.eventMapHint")}>
        <Input type="url" inputMode="url" placeholder="https://maps.google.com/..." maxLength={300} value={form[`${ev}Map`]} onChange={(e) => set(`${ev}Map`, e.target.value)} />
      </Field>
    </fieldset>
  );

  return (
    <Card className={highlight ? "border-2 border-amber-500 bg-amber-50" : ""}>
      <h2 className="text-xl font-bold">{t("dash.details")}</h2>
      <p className="mb-4 text-lg text-stone-700">{highlight ? t("dash.setupNeeded") : t("dash.detailsHint")}</p>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("dash.brideName")}>
            <Input maxLength={60} value={form.brideName} onChange={(e) => set("brideName", e.target.value)} />
          </Field>
          <Field label={t("dash.groomName")}>
            <Input maxLength={60} value={form.groomName} onChange={(e) => set("groomName", e.target.value)} />
          </Field>
        </div>
        <Field label={t("dash.message")} hint={t("dash.messageHint")}>
          <Textarea rows={3} maxLength={400} value={form.message} onChange={(e) => set("message", e.target.value)} />
        </Field>
        {eventBox("wedding", t("dash.weddingEvent"))}
        <Button type="submit" icon="save" disabled={pending}>
          {pending ? t("common.pleaseWait") : t("common.save")}
        </Button>
      </form>
    </Card>
  );
}
