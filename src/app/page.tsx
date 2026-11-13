import { Countdown } from "@/components/Countdown";
import { Icon } from "@/components/Icon";
import { LangToggle } from "@/components/LangToggle";
import { LinkButton } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { getI18n } from "@/lib/i18n-server";

function formatDate(iso: string, lang: "si" | "en"): string {
  const [y, m, d] = iso.split("-").map(Number);
  try {
    return new Intl.DateTimeFormat(lang === "si" ? "si-LK" : "en-GB", { dateStyle: "full", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
  } catch {
    return iso;
  }
}

// Floating hearts: pure CSS (see .float-heart in globals.css), no images. [left %, size px, delay s, duration s]
// Fewer on small screens (hidden via the `hidden sm:block` flag) to keep phones light.
const HEARTS: { left: number; size: number; delay: number; dur: number; desktopOnly?: boolean }[] = [
  { left: 8, size: 22, delay: 0, dur: 16 },
  { left: 24, size: 14, delay: 5, dur: 20, desktopOnly: true },
  { left: 42, size: 26, delay: 9, dur: 18 },
  { left: 63, size: 16, delay: 2, dur: 22, desktopOnly: true },
  { left: 80, size: 24, delay: 7, dur: 17 },
  { left: 92, size: 14, delay: 12, dur: 21, desktopOnly: true },
];

export default async function Home() {
  const [{ lang, t }, session, settings] = await Promise.all([getI18n(), getSession(), getSettings()]);
  const names = [settings.brideName, settings.groomName].filter(Boolean).join(` ${t("landing.and")} `);

  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-gradient-to-br from-rose-200 via-rose-100 to-pink-200">
      {/* Soft glowing blobs + floating hearts (decorative, hidden from screen readers) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-rose-400/40 blur-3xl sm:h-[28rem] sm:w-[28rem]" />
        <div className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-pink-400/40 blur-3xl sm:h-[32rem] sm:w-[32rem]" />
        <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-100/70 blur-3xl" />
        {HEARTS.map((h, i) => (
          <span
            key={i}
            className={`float-heart absolute bottom-0 text-rose-500/40 ${h.desktopOnly ? "hidden sm:block" : ""}`}
            style={{ left: `${h.left}%`, width: h.size, height: h.size, animationDelay: `${h.delay}s`, animationDuration: `${h.dur}s` }}
          >
            <Icon name="heart" className="h-full w-full" />
          </span>
        ))}
      </div>

      {/* Top bar */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-4">
        <span className="flex items-center gap-2 text-lg font-bold text-rose-900 sm:text-xl">
          <Icon name="heart" className="h-6 w-6" />
          <span className="hidden sm:inline">{t("app.name")}</span>
        </span>
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
      </header>

      {/* Hero */}
      <main className="flex flex-1 items-center justify-center px-4 pb-12 pt-4 text-center sm:px-6">
        <div className="w-full max-w-3xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-white/70 bg-white/60 text-rose-700 shadow-lg shadow-rose-900/10 backdrop-blur-md sm:mb-6 sm:h-20 sm:w-20">
            <Icon name="heart" className="h-8 w-8 sm:h-10 sm:w-10" />
          </div>

          <h1 className="font-serif text-5xl font-bold leading-[1.1] text-rose-950 drop-shadow-sm sm:text-7xl lg:text-8xl">{t("app.name")}</h1>
          <p className="mx-auto mt-3 max-w-md text-lg text-rose-900/80 sm:text-xl">{t("app.tagline")}</p>

          <div className="mx-auto my-6 flex max-w-xs items-center gap-3 text-rose-500 sm:my-8" aria-hidden="true">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-rose-400" />
            <Icon name="heart" className="h-5 w-5" />
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-rose-400" />
          </div>

          {names && <p className="font-serif text-3xl font-semibold text-rose-900 sm:text-4xl">{names}</p>}

          {settings.weddingDate ? (
            <>
              <p className="mt-3 text-lg font-semibold text-stone-800 sm:text-xl">{formatDate(settings.weddingDate, lang)}</p>
              <div className="mt-8 sm:mt-10">
                <Countdown date={settings.weddingDate} />
              </div>
            </>
          ) : (
            <p className="mt-4 text-lg text-stone-800 sm:text-xl">{t("landing.dateSoon")}</p>
          )}
        </div>
      </main>
    </div>
  );
}
