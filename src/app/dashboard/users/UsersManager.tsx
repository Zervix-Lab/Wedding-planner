"use client";
import { useState, useTransition, type FormEvent } from "react";
import { DataTable, type Column } from "@/components/DataTable";
import { ExportButton } from "@/components/ExportButton";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/Modal";
import { useConfirm, useT, useToast } from "@/components/Providers";
import { Badge, Button, EmptyState, Field, Input, PageTitle, Select } from "@/components/ui";
import { ROLES, SIDES, type Role, type Side, type UserDTO } from "@/lib/types";
import { createUser, deleteUser, updateUser } from "./actions";

interface FormState {
  id?: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  side: Side;
  canManageVendors: boolean;
}

const EMPTY: FormState = { name: "", email: "", password: "", role: "editor", side: "bride", canManageVendors: false };

export function UsersManager({ users, meId }: { users: UserDTO[]; meId: string }) {
  const t = useT();
  const toast = useToast();
  const confirm = useConfirm();
  const [form, setForm] = useState<FormState | null>(null);
  const [hidden, setHidden] = useState<string[]>([]); // optimistic deletes
  const [pending, start] = useTransition();

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    start(async () => {
      const res = form.id ? await updateUser(form.id, form) : await createUser(form);
      if (res.ok) {
        toast.success(form.id ? "common.saved" : "users.created");
        setForm(null);
      } else toast.error(res.error);
    });
  }

  async function remove(u: UserDTO) {
    if (!(await confirm(t("users.confirmDelete", { name: u.name })))) return;
    setHidden((h) => [...h, u._id]);
    start(async () => {
      const res = await deleteUser(u._id);
      if (res.ok) toast.success("common.deleted");
      else {
        setHidden((h) => h.filter((x) => x !== u._id));
        toast.error(res.error);
      }
    });
  }

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));

  const columns: Column<UserDTO>[] = [
    {
      key: "name",
      header: t("users.name"),
      primary: true,
      cell: (u) => (
        <span className="flex flex-wrap items-center gap-2">
          {u.name}
          {u._id === meId && <Badge tone="green">{t("users.you")}</Badge>}
        </span>
      ),
    },
    { key: "email", header: t("auth.email"), cell: (u) => <span className="break-all">{u.email}</span> },
    { key: "role", header: t("users.role"), cell: (u) => <Badge tone={u.role === "admin" ? "rose" : "blue"}>{t(`role.${u.role}`)}</Badge> },
    { key: "side", header: t("users.side"), cell: (u) => t(`side.${u.side}`) },
    {
      key: "vendors",
      header: t("xl.vendorAccess"),
      cell: (u) => (u.role === "admin" || u.canManageVendors ? <Badge tone="green">{t("xl.yes")}</Badge> : <Badge>{t("xl.no")}</Badge>),
    },
    {
      key: "actions",
      header: "",
      actions: true,
      cell: (u) => (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon="edit" onClick={() => setForm({ id: u._id, name: u.name, email: u.email, password: "", role: u.role, side: u.side, canManageVendors: u.canManageVendors })}>
            {t("common.edit")}
          </Button>
          {u._id !== meId && (
            <Button variant="danger" icon="trash" onClick={() => remove(u)} disabled={pending}>
              {t("common.delete")}
            </Button>
          )}
        </div>
      ),
    },
  ];

  const addButton = (
    <Button icon="plus" onClick={() => setForm(EMPTY)}>
      {t("users.add")}
    </Button>
  );

  return (
    <>
      <PageTitle
        title={t("users.title")}
        subtitle={t("users.subtitle")}
        action={
          <div className="flex flex-wrap gap-2">
            <ExportButton href="/api/export/users" label={t("xl.download")} />
            {addButton}
          </div>
        }
      />

      <div className="mb-4 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-base text-sky-950">
        <p className="mb-1 flex items-center gap-2 font-bold">
          <Icon name="shield" className="h-5 w-5 shrink-0" />
          {t("users.rolesTitle")}
        </p>
        <ul className="list-disc space-y-0.5 pl-6">
          <li>{t("users.roleAdminHelp")}</li>
          <li>{t("users.roleEditorHelp")}</li>
        </ul>
      </div>

      {users.length === 0 ? (
        <EmptyState icon="users" title={t("users.empty")} action={addButton} />
      ) : (
        <DataTable columns={columns} rows={users.filter((u) => !hidden.includes(u._id))} rowKey={(u) => u._id} />
      )}

      {form && (
        <Modal title={form.id ? t("users.edit") : t("users.add")} onClose={() => setForm(null)}>
          <form onSubmit={submit} className="space-y-4">
            <Field label={t("users.name")}>
              <Input required maxLength={80} value={form.name} onChange={(e) => set("name", e.target.value)} autoFocus />
            </Field>
            <Field label={t("auth.email")} hint={t("users.emailHint")}>
              <Input
                required
                type="email"
                inputMode="email"
                autoCapitalize="none"
                maxLength={120}
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>
            <Field label={t("auth.password")} hint={form.id ? t("users.passwordKeep") : t("users.passwordHint")}>
              <Input
                type="text"
                autoComplete="off"
                required={!form.id}
                minLength={6}
                maxLength={100}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("users.role")}>
                <Select value={form.role} onChange={(e) => set("role", e.target.value as Role)}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {t(`role.${r}`)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t("users.side")}>
                <Select value={form.side} onChange={(e) => set("side", e.target.value as Side)}>
                  {SIDES.map((s) => (
                    <option key={s} value={s}>
                      {t(`side.${s}`)}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            {form.role === "editor" && (
              <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border-2 border-stone-300 px-4 py-3 text-lg">
                <input
                  type="checkbox"
                  checked={form.canManageVendors}
                  onChange={(e) => set("canManageVendors", e.target.checked)}
                  className="mt-1 h-6 w-6 shrink-0 accent-rose-800"
                />
                <span>
                  {t("users.canVendors")}
                  <span className="block text-base text-stone-600">{t("users.canVendorsHint")}</span>
                </span>
              </label>
            )}
            <Button type="submit" icon="save" className="w-full" disabled={pending}>
              {pending ? t("common.pleaseWait") : t("common.save")}
            </Button>
          </form>
        </Modal>
      )}
    </>
  );
}
