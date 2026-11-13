"use client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, Card, Field, Input } from "@/components/ui";
import { useT, useToast } from "@/components/Providers";
import type { DictKey } from "@/lib/i18n";

export function LoginForm() {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      if (res.ok) {
        toast.success("auth.welcome");
        router.replace("/dashboard");
        router.refresh();
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: DictKey };
      toast.error(data.error ?? "err.generic");
    } catch {
      toast.error("err.network");
    }
    setBusy(false);
  }

  return (
    <Card className="p-6">
      <h1 className="mb-1 text-2xl font-bold">{t("auth.loginTitle")}</h1>
      <p className="mb-5 text-lg text-stone-700">{t("auth.loginHint")}</p>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label={t("auth.email")}>
          <Input name="email" type="email" required autoComplete="username" inputMode="email" autoCapitalize="none" />
        </Field>
        <Field label={t("auth.password")}>
          <Input name="password" type={show ? "text" : "password"} required autoComplete="current-password" />
        </Field>
        <label className="flex min-h-11 items-center gap-3 text-base">
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="h-6 w-6 accent-rose-800" />
          {t("auth.showPassword")}
        </label>
        <Button type="submit" icon="login" className="w-full" disabled={busy}>
          {busy ? t("common.pleaseWait") : t("auth.login")}
        </Button>
      </form>
    </Card>
  );
}
