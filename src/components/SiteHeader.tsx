import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getI18n } from "@/lib/i18n-server";
import { Icon } from "./Icon";
import { LangToggle } from "./LangToggle";
import { LinkButton } from "./ui";

/** Public header (landing + login). Language toggle is always visible. */
export async function SiteHeader() {
  const [{ t }, session] = await Promise.all([getI18n(), getSession()]);
  return (
    <header className="sticky top-0 z-40 border-b border-stone-300 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-5">
        <Link href="/" aria-label={t("app.name")} className="flex min-h-11 min-w-11 items-center justify-center gap-2 text-xl font-bold text-rose-900">
          <Icon name="heart" className="h-7 w-7" />
          <span className="hidden sm:inline">{t("app.name")}</span>
        </Link>
        <div className="flex items-center gap-2">
          <LangToggle />
          {session ? (
            <LinkButton href="/dashboard" icon="home">
              {t("nav.goToDashboard")}
            </LinkButton>
          ) : (
            <LinkButton href="/login" icon="login">
              {t("auth.login")}
            </LinkButton>
          )}
        </div>
      </div>
    </header>
  );
}
