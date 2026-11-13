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

const SPINNER = "h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent";

/** Sidebar item content. Rendered inside <Link>: shows a small spinner on the item you just clicked while the next page loads. */
function SideItem({ item }: { item: NavItem }) {
  const { pending } = useLinkStatus();
  return (
    <>
      <Icon name={item.icon} className="h-6 w-6" />
      <span className="flex-1 leading-tight">{item.label}</span>
      {pending && <span aria-hidden="true" className={SPINNER} />}
    </>
  );
}

/** Bottom tab content (phones). The icon turns into a spinner while the next page loads. */
function TabItem({ item, active }: { item: NavItem; active: boolean }) {
  const { pending } = useLinkStatus();
  return (
    <>
      <span className={`flex h-8 w-14 items-center justify-center rounded-full transition-colors ${active ? "bg-rose-100 text-rose-800" : "text-stone-600"}`}>
        {pending ? <span aria-hidden="true" className={SPINNER} /> : <Icon name={item.icon} className="h-6 w-6" />}
      </span>
      <span className={`line-clamp-2 px-0.5 text-center text-[0.8125rem] leading-tight ${active ? "font-bold text-rose-900" : "font-medium text-stone-700"}`}>{item.label}</span>
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
  const [accountOpen, setAccountOpen] = useState(false);
  useEffect(() => setAccountOpen(false), [pathname]);

  const active = (it: NavItem) => (it.exact ? pathname === it.href : pathname.startsWith(it.href));
  const initial = (userName.trim()[0] ?? "?").toUpperCase();

  const brand = (
    <Link href="/dashboard" className="flex min-h-11 min-w-0 items-center gap-3 px-1 text-xl font-bold text-white">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-rose-800 shadow">
        <Icon name="heart" className="h-6 w-6" />
      </span>
      <span className="leading-tight">{appName}</span>
    </Link>
  );

  return (
    <div className="min-h-dvh md:flex">
      {/* Tablet / desktop: fixed left sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col justify-between gap-4 overflow-y-auto bg-gradient-to-b from-rose-950 via-rose-900 to-rose-800 p-4 md:flex xl:w-64">
        <div className="space-y-6">
          {brand}
          <nav className="flex flex-col gap-1.5" aria-label="Main">
            {items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                prefetch
                aria-current={active(it) ? "page" : undefined}
                className={`flex min-h-12 items-center gap-3 rounded-xl px-4 py-2 text-lg font-semibold transition ${
                  active(it) ? "bg-white text-rose-900 shadow" : "text-rose-50 hover:bg-white/10"
                }`}
              >
                <SideItem item={it} />
              </Link>
            ))}
          </nav>
        </div>

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
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar: brand + language + account on phones; name + language from tablet up */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-stone-300 bg-white/90 px-3 py-2 backdrop-blur sm:px-5">
          <Link href="/dashboard" className="flex min-h-11 min-w-0 items-center gap-2 font-bold text-rose-900 md:hidden">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-800 text-white">
              <Icon name="heart" className="h-5 w-5" />
            </span>
            <span className="hidden truncate min-[420px]:inline">{appName}</span>
          </Link>
          <span className="hidden text-lg font-semibold text-stone-700 md:block">{userName}</span>

          <div className="flex items-center gap-2">
            {langToggle}
            {/* Phones only: account menu (name, role, home page, log out) */}
            <div className="relative md:hidden">
              <button
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                aria-label={menuLabel}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-100 text-lg font-bold text-rose-900 ring-2 ring-rose-300"
              >
                {initial}
              </button>
              {accountOpen && (
                <>
                  <button type="button" aria-label={closeLabel} className="fixed inset-0 z-40 cursor-default" onClick={() => setAccountOpen(false)} />
                  <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-64 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-stone-300 bg-white p-3 shadow-xl">
                    <p className="break-words text-lg font-bold leading-tight text-stone-900">{userName}</p>
                    <p className="mb-3 inline-flex items-center gap-1.5 text-base text-stone-700">
                      <Icon name="shield" className="h-4 w-4" />
                      {roleLabel}
                    </p>
                    <Link href="/" className="mb-2 flex min-h-11 items-center gap-3 rounded-xl px-3 text-base font-semibold text-rose-900 hover:bg-rose-50">
                      <Icon name="open" className="h-5 w-5" />
                      {viewSiteLabel}
                    </Link>
                    <Logout
                      label={logoutLabel}
                      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-rose-800 px-3 text-base font-semibold text-white"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* On phones leave room for the bottom tab bar (--tabbar-h, defined in globals.css) */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-3 pb-[calc(var(--tabbar-h)+1rem)] pt-5 sm:px-5 sm:py-8 md:pb-8">{children}</main>
      </div>

      {/* Phones: bottom tab bar, thumb-reachable, all pages one tap away */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 h-(--tabbar-h) border-t border-stone-300 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(0,0,0,.08)] backdrop-blur md:hidden"
      >
        <ul className="mx-auto grid h-full max-w-xl" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
          {items.map((it) => (
            <li key={it.href} className="min-w-0">
              <Link
                href={it.href}
                prefetch
                aria-current={active(it) ? "page" : undefined}
                className="flex h-full flex-col items-center justify-center gap-0.5 px-0.5 pt-1 active:bg-rose-50"
              >
                <TabItem item={it} active={active(it)} />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
