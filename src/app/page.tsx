import Image from "next/image";
import { Countdown } from "@/components/Countdown";
import { Icon, type IconName } from "@/components/Icon";
import { ImageSlider } from "@/components/ImageSlider";
import { SiteHeader } from "@/components/SiteHeader";
import { LinkButton, buttonClass } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { getLandingData, type LandingVendor } from "@/lib/data";
import { getI18n } from "@/lib/i18n-server";
import { bi } from "@/lib/types";

const SIZES = "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw";
type Lang = "si" | "en";

function formatDate(iso: string, lang: Lang): string {
  const [y, m, d] = iso.split("-").map(Number);
  try {
    return new Intl.DateTimeFormat(lang === "si" ? "si-LK" : "en-GB", { dateStyle: "full", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
  } catch {
    return iso;
  }
}

function formatTime(hhmm: string, lang: Lang): string {
  const [h, m] = hhmm.split(":").map(Number);
  try {
    return new Intl.DateTimeFormat(lang === "si" ? "si-LK" : "en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" }).format(new Date(Date.UTC(1970, 0, 1, h, m)));
  } catch {
    return hhmm;
  }
}

/** A pretty divider: two thin lines around a heart. Pure CSS/SVG, no image to download. */
function HeartDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 text-rose-700 ${className}`} aria-hidden="true">
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-rose-400" />
      <Icon name="heart" className="h-5 w-5" />
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-rose-400" />
    </div>
  );
}

function EventCard({
  icon,
  title,
  date,
  time,
  venue,
  map,
  mapLabel,
  lang,
}: {
  icon: IconName;
  title: string;
  date: string;
  time: string;
  venue: string;
  map: string;
  mapLabel: string;
  lang: Lang;
}) {
  const row = (name: IconName, text: string) => (
    <li className="flex items-start gap-3 text-lg text-stone-800">
      <Icon name={name} className="mt-1 h-5 w-5 text-rose-700" />
      <span className="min-w-0 break-words">{text}</span>
    </li>
  );
  return (
    <li className="relative overflow-hidden rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-rose-100" aria-hidden="true" />
      <div className="relative">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-800 text-white">
          <Icon name={icon} className="h-7 w-7" />
        </span>
        <h3 className="mb-3 text-2xl font-bold text-rose-950">{title}</h3>
        <ul className="space-y-2">
          {date && row("calendar", formatDate(date, lang))}
          {time && row("clock", formatTime(time, lang))}
          {venue && row("pin", venue)}
        </ul>
        {map && (
          <a href={map} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "mt-4")}>
            <Icon name="open" />
            <span>{mapLabel}</span>
          </a>
        )}
      </div>
    </li>
  );
}

function VendorCard({ vendor, name, noPhoto }: { vendor: LandingVendor; name: string; noPhoto: string }) {
  return (
    <li className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {vendor.images.length > 1 ? (
        <ImageSlider images={vendor.images} alt={name} />
      ) : vendor.images.length === 1 ? (
        <div className="relative aspect-[4/3] bg-stone-200">
          <Image src={vendor.images[0]} alt={name} fill sizes={SIZES} loading="lazy" className="object-cover" />
        </div>
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center gap-2 bg-gradient-to-br from-rose-50 to-amber-50 text-rose-800">
          <Icon name="image" className="h-8 w-8" />
          <span className="text-base">{noPhoto}</span>
        </div>
      )}
      <h4 className="px-4 py-3 text-xl font-bold text-stone-900">{name}</h4>
    </li>
  );
}

export default async function Landing() {
  const [{ lang, t }, session, { settings, vendors, categories }] = await Promise.all([getI18n(), getSession(), getLandingData()]);

  const hasNames = settings.brideName || settings.groomName;
  const anySlider = vendors.some((v) => v.images.length > 1);
  const groups = categories.map((c) => ({ category: c, items: vendors.filter((v) => v.category === c.slug) })).filter((g) => g.items.length > 0);
  const hasWedding = settings.weddingDate || settings.weddingTime || settings.weddingVenue;
  const hasHomecoming = settings.homecomingDate || settings.homecomingTime || settings.homecomingVenue;

  const steps: { icon: IconName; title: string; text: string }[] = [
    { icon: "mail", title: t("landing.step1Title"), text: t("landing.step1Text") },
    { icon: "login", title: t("landing.step2Title"), text: t("landing.step2Text") },
    { icon: "list", title: t("landing.step3Title"), text: t("landing.step3Text") },
    { icon: "download", title: t("landing.step4Title"), text: t("landing.step4Text") },
  ];

  return (
    <>
      <SiteHeader />
      <main>
        {/* ---------- Hero ---------- */}
        <section className="relative overflow-hidden bg-gradient-to-b from-rose-100 via-rose-50 to-stone-50 px-4 pb-14 pt-12 text-center sm:pt-20">
          <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-rose-200/50 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-24 top-40 h-72 w-72 rounded-full bg-amber-100/70 blur-3xl" aria-hidden="true" />
          <div className="relative mx-auto max-w-3xl">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-rose-300 bg-white/80 px-4 py-1.5 text-base font-semibold text-rose-900">
              <Icon name="heart" className="h-4 w-4" />
              {t("landing.invite")}
            </p>
            {hasNames ? (
              <h1 className="text-5xl font-bold leading-tight text-rose-950 sm:text-7xl">
                {settings.brideName}
                {settings.brideName && settings.groomName && (
                  <span className="my-1 block text-3xl font-semibold text-rose-700 sm:my-2 sm:text-4xl">{t("landing.and")}</span>
                )}
                {settings.groomName}
              </h1>
            ) : (
              <h1 className="text-5xl font-bold leading-tight text-rose-950 sm:text-7xl">{t("landing.defaultTitle")}</h1>
            )}
            <HeartDivider className="mt-6" />

            {settings.weddingDate ? (
              <>
                <p className="mt-5 text-xl font-semibold text-stone-800 sm:text-2xl">{formatDate(settings.weddingDate, lang)}</p>
                <div className="mt-6">
                  <Countdown date={settings.weddingDate} />
                </div>
              </>
            ) : (
              <p className="mt-5 text-xl text-stone-800">{t("landing.dateSoon")}</p>
            )}

            {settings.message && <p className="mx-auto mt-8 max-w-xl whitespace-pre-line text-xl leading-relaxed text-stone-800">{settings.message}</p>}

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {(hasWedding || hasHomecoming) && (
                <a href="#events" className={buttonClass("primary")}>
                  <Icon name="calendar" />
                  <span>{t("landing.celebrations")}</span>
                </a>
              )}
              <a href="#guide" className={buttonClass("secondary", "bg-white/80")}>
                <Icon name="list" />
                <span>{t("landing.guideTitle")}</span>
              </a>
            </div>
          </div>
        </section>

        {/* ---------- Celebrations ---------- */}
        {(hasWedding || hasHomecoming) && (
          <section id="events" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-12 sm:px-5">
            <h2 className="text-center text-3xl font-bold text-stone-900">{t("landing.celebrations")}</h2>
            <p className="mt-1 text-center text-lg text-stone-700">{t("landing.celebrationsHint")}</p>
            <HeartDivider className="my-5" />
            <ul className={`mx-auto grid gap-5 ${hasWedding && hasHomecoming ? "md:grid-cols-2" : "max-w-xl"}`}>
              {hasWedding && (
                <EventCard
                  icon="heart"
                  title={t("event.wedding")}
                  date={settings.weddingDate}
                  time={settings.weddingTime}
                  venue={settings.weddingVenue}
                  map={settings.weddingMap}
                  mapLabel={t("landing.openMap")}
                  lang={lang}
                />
              )}
              {hasHomecoming && (
                <EventCard
                  icon="home"
                  title={t("event.homecoming")}
                  date={settings.homecomingDate}
                  time={settings.homecomingTime}
                  venue={settings.homecomingVenue}
                  map={settings.homecomingMap}
                  mapLabel={t("landing.openMap")}
                  lang={lang}
                />
              )}
            </ul>
          </section>
        )}

        {/* ---------- Wedding team ---------- */}
        <section id="team" className="scroll-mt-20 bg-white px-4 py-12 sm:px-5">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-3xl font-bold text-stone-900">{t("landing.vendorsTitle")}</h2>
            <p className="mt-1 text-center text-lg text-stone-700">
              {t("landing.vendorsHint")} {anySlider && t("landing.swipe") + "."}
            </p>
            <HeartDivider className="my-5" />

            {groups.length === 0 ? (
              <p className="rounded-2xl border-2 border-dashed border-stone-400 bg-stone-50 px-5 py-10 text-center text-xl text-stone-800">{t("landing.noVendors")}</p>
            ) : (
              groups.map((g) => (
                <div key={g.category.slug} className="mt-8 first:mt-0">
                  <h3 className="mb-3 flex items-center gap-2 text-xl font-bold text-rose-900 sm:text-2xl">
                    <span className="h-6 w-1.5 rounded bg-rose-800" aria-hidden="true" />
                    {bi(g.category.name, lang)}
                  </h3>
                  <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {g.items.map((v) => (
                      <VendorCard key={v._id} vendor={v} name={bi(v.name, lang)} noPhoto={t("landing.noPhoto")} />
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ---------- How this site works ---------- */}
        <section id="guide" className="scroll-mt-20 bg-gradient-to-b from-stone-50 to-rose-50 px-4 py-14 sm:px-5">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-3xl font-bold text-stone-900">{t("landing.guideTitle")}</h2>
            <p className="mt-1 text-center text-lg text-stone-700">{t("landing.guideHint")}</p>
            <HeartDivider className="my-5" />
            <ol className="grid gap-4 sm:grid-cols-2">
              {steps.map((s, i) => (
                <li key={s.title} className="flex gap-4 rounded-2xl border border-rose-200 bg-white p-5 shadow-sm">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-800 text-xl font-bold text-white" aria-hidden="true">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="flex items-center gap-2 text-xl font-bold text-rose-950">
                      <Icon name={s.icon} className="h-5 w-5 text-rose-700" />
                      {s.title}
                    </h3>
                    <p className="mt-1 text-lg text-stone-800">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-5 text-center text-lg font-semibold text-rose-900">{t("landing.guideNote")}</p>

            {!session && (
              <div className="mt-8 flex flex-col items-center gap-3 rounded-3xl bg-white p-6 text-center shadow-sm">
                <p className="text-lg text-stone-800">{t("landing.pricesHint")}</p>
                <LinkButton href="/login" icon="login">
                  {t("auth.login")}
                </LinkButton>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="bg-rose-950 px-4 py-8 text-center text-rose-100">
        <HeartDivider className="mb-3 !text-rose-300" />
        <p className="text-lg font-semibold">{hasNames ? [settings.brideName, settings.groomName].filter(Boolean).join(` ${t("landing.and")} `) : t("app.name")}</p>
        <p className="text-base text-rose-200">{t("landing.footer")}</p>
      </footer>
    </>
  );
}
