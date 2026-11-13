"use client";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/Icon";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  exact?: boolean;
}

interface Props {
  items: NavItem[];
  appName: string;
  userName: string;
  roleLabel: string;
  menuLabel: string;
  closeLabel: string;
  logoutLabel: string;
  viewSiteLabel: string;
  langToggle: ReactNode;
  children: ReactNode;
}

/** Rendered inside <Link>: shows a small spinner on the item you just clicked while the next page loads. */
function NavContent({ item }: { item: NavItem }) {
  const { pending } = useLinkStatus();
  return (
    <>
      <Icon name={item.icon} className="h-6 w-6" />
      <span className="flex-1">{item.label}</span>
      {pending && <span aria-hidden="true" className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />}
    </>
  );
}

function Logout({ label, className }: { label: string; className: string }) {
  return (
    <form action="/api/auth/logout" method="post">
      <button type="submit" className={className}>
        <Icon name="logout" />
        {label}
      </button>
    </form>
  );
}

export function DashShell({ items, appName, userName, roleLabel, menuLabel, closeLabel, logoutLabel, viewSiteLabel, langToggle, children }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const active = (it: NavItem) => (it.exact ? pathname === it.href : pathname.startsWith(it.href));

  const nav = (
    <nav className="flex flex-col gap-1.5" aria-label="Main">
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          prefetch
          aria-current={active(it) ? "page" : undefined}
          className={`flex min-h-12 items-center gap-3 rounded-xl px-4 text-lg font-semibold transition ${
            active(it) ? "bg-white text-rose-900 shadow" : "text-rose-50 hover:bg-white/10"
          }`}
        >
          <NavContent item={it} />
        </Link>
      ))}
    </nav>
  );

  const footer = (
    <div className="space-y-2">
      <Link href="/" className="flex min-h-11 items-center gap-3 rounded-xl px-4 text-base font-semibold text-rose-100 hover:bg-white/10">
        <Icon name="open" className="h-5 w-5" />
        {viewSiteLabel}
      </Link>
      <div className="rounded-xl bg-black/20 p-3">
        <p className="break-words text-lg font-bold leading-tight text-white">{userName}</p>
        <p className="mb-2 inline-flex items-center gap-1.5 text-base text-rose-100">
          <Icon name="shield" className="h-4 w-4" />
          {roleLabel}
        </p>
        <Logout
          label={logoutLabel}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-white/60 px-3 text-base font-semibold text-white hover:bg-white/10"
        />
      </div>
    </div>
  );

  const brand = (
    <Link href="/dashboard" className="flex min-h-11 items-center gap-3 px-2 text-xl font-bold text-white">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-rose-800">
        <Icon name="heart" className="h-6 w-6" />
      </span>
      <span className="leading-tight">{appName}</span>
    </Link>
  );

  return (
    <div className="min-h-dvh md:flex">
      {/* Desktop / tablet: fixed left sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col justify-between gap-4 overflow-y-auto bg-gradient-to-b from-rose-950 via-rose-900 to-rose-800 p-4 md:flex xl:w-64">
        <div className="space-y-6">
          {brand}
          {nav}
        </div>
        {footer}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-stone-300 bg-white/90 px-3 py-2 backdrop-blur sm:px-5">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-rose-800 px-3 text-base font-semibold text-white md:hidden"
          >
            <Icon name="menu" />
            {menuLabel}
          </button>
          <span className="hidden text-lg font-semibold text-stone-700 md:block">{userName}</span>
          {langToggle}
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-5 sm:px-5 sm:py-8">{children}</main>
      </div>

      {/* Phone: slide-out drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button type="button" aria-label={closeLabel} className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-xs flex-col justify-between gap-4 overflow-y-auto bg-gradient-to-b from-rose-950 via-rose-900 to-rose-800 p-4 shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                {brand}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-base font-semibold text-white hover:bg-white/10"
                >
                  <Icon name="x" className="h-5 w-5" />
                  {closeLabel}
                </button>
              </div>
              {nav}
            </div>
            {footer}
          </div>
        </div>
      )}
    </div>
  );
}
