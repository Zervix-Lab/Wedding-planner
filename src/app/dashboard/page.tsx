import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";
import { Badge, Card, LinkButton, PageTitle } from "@/components/ui";
import { requireUserPage } from "@/lib/auth";
import { buildLines, indexVendors, picksFromSelections, planCounts, sumLines } from "@/lib/calc";
import { getCategories } from "@/lib/categories";
import { getAllVendors, getSettings } from "@/lib/data";
import { getGuestStats } from "@/lib/guests-data";
import { getI18n } from "@/lib/i18n-server";
import { formatMoney } from "@/lib/money";
import { getConfirmedCounts, getPlans } from "@/lib/plans-data";
import { INVITATIONS, RSVPS, bi, type Rsvp } from "@/lib/types";
import { FinalBudget } from "./FinalBudget";
import { SettingsForm } from "./SettingsForm";

/** Whole days from today (Sri Lanka time) until the wedding date. 0 = today, negative = already passed. */
function daysUntil(isoDate: string): number {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" }); // YYYY-MM-DD
  return Math.round((Date.parse(`${isoDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000);
}

function Stat({ icon, label, children }: { icon: IconName; label: string; children: React.ReactNode }) {
  return (
    <Card className="h-full">
      <div className="mb-2 flex items-center gap-2 text-lg font-semibold text-stone-800">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-800">
          <Icon name={icon} />
        </span>
        {label}
      </div>
      {children}
    </Card>
  );
}

const RSVP_BAR: Record<Rsvp, string> = { confirmed: "bg-green-600", maybe: "bg-amber-500", pending: "bg-stone-400", declined: "bg-rose-600" };

export default async function DashboardHome() {
  // Everything below is read from the server cache (refreshed the moment anything changes), all in parallel.
  const [user, { lang, t }] = await Promise.all([requireUserPage(), getI18n()]);
  const [settings, stats, confirmed, plans, vendors, categories] = await Promise.all([
    getSettings(),
    getGuestStats(),
    getConfirmedCounts(),
    getPlans(),
    getAllVendors(),
    getCategories(),
  ]);

  const sidePeople = (s: string) => stats.side.find((x) => x._id === s)?.people ?? 0;
  const bride = sidePeople("bride");
  const groom = sidePeople("groom");
  const totalPeople = bride + groom;
  const invitations = stats.side.reduce((n, s) => n + s.count, 0);
  const rsvpPeople = (r: string) => stats.rsvp.find((x) => x._id === r)?.people ?? 0;
  const invCount = (i: string) => stats.inv.find((x) => x._id === i)?.count ?? 0;

  // Final plan: every line and every price calculation, from CURRENT vendor prices (nothing is stored).
  const order = categories.map((c) => c.slug);
  const finalPlan = plans.find((p) => p.isFinal) ?? null;
  let finalLines: ReturnType<typeof buildLines> = [];
  let finalTotal = 0;
  let finalCounts = { adults: 0, kids: 0 };
  if (finalPlan) {
    const byId = indexVendors(vendors);
    finalCounts = planCounts(finalPlan, confirmed);
    finalLines = buildLines(picksFromSelections(finalPlan.selections, byId).picks, byId, finalCounts.adults, finalCounts.kids, order);
    finalTotal = sumLines(finalLines);
  }

  const days = settings.weddingDate ? daysUntil(settings.weddingDate) : null;
  const isAdmin = user.role === "admin";
  const links: { href: string; icon: IconName; label: string }[] = [
    { href: "/dashboard/budget", icon: "wallet", label: t("nav.budget") },
    { href: "/dashboard/guests", icon: "users", label: t("nav.guests") },
    { href: "/dashboard/vendors", icon: "store", label: t("nav.vendors") },
    ...(isAdmin ? [{ href: "/dashboard/users", icon: "user" as IconName, label: t("nav.users") }] : []),
  ];

  return (
    <div className="space-y-6">
      <PageTitle title={t("dash.hello", { name: user.name })} subtitle={t("dash.welcome")} />

      {isAdmin && !settings.weddingDate && <SettingsForm initial={settings} highlight />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon="calendar" label={t("dash.daysLeft")}>
          {days === null ? (
            <p className="text-2xl font-bold text-stone-700">{t("dash.dateNotSet")}</p>
          ) : days > 0 ? (
            <p className="text-5xl font-extrabold tabular-nums text-rose-900">{days}</p>
          ) : days === 0 ? (
            <p className="text-4xl font-extrabold text-rose-900">{t("dash.today")}</p>
          ) : (
            <p className="text-2xl font-bold text-stone-700">{t("dash.passed")}</p>
          )}
        </Stat>

        <Stat icon="users" label={t("dash.totalGuests")}>
          <p className="text-5xl font-extrabold tabular-nums text-rose-900">
            {totalPeople} <span className="text-xl font-semibold text-stone-700">{t("dash.people")}</span>
          </p>
          <dl className="mt-2 space-y-1 text-lg">
            <div className="flex justify-between gap-3">
              <dt>{t("side.bride")}</dt>
              <dd className="font-bold tabular-nums">{bride}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>{t("side.groom")}</dt>
              <dd className="font-bold tabular-nums">{groom}</dd>
            </div>
          </dl>
          <p className="mt-2 text-base text-stone-700">{t("dash.invitations", { n: invitations })}</p>
        </Stat>

        <Stat icon="wallet" label={t("dash.finalTotal")}>
          {finalPlan ? (
            <>
              <p className="text-3xl font-extrabold tabular-nums text-rose-900 sm:text-4xl">{formatMoney(finalTotal)}</p>
              <p className="mt-1 text-lg text-stone-800">{t("dash.finalIs", { name: finalPlan.name })}</p>
            </>
          ) : (
            <>
              <p className="text-xl font-bold">{t("dash.noFinal")}</p>
              <p className="mb-3 text-base text-stone-700">{t("dash.noFinalHint")}</p>
              {isAdmin && (
                <LinkButton href="/dashboard/budget" icon="wallet">
                  {t("dash.goBudget")}
                </LinkButton>
              )}
            </>
          )}
        </Stat>

        <Stat icon="store" label={t("dash.vendorsCard")}>
          <p className="text-5xl font-extrabold tabular-nums text-rose-900">{vendors.length}</p>
          <p className="mt-2 text-base text-stone-700">{t("dash.vendorsCount", { n: vendors.length, c: new Set(vendors.map((v) => v.category)).size })}</p>
        </Stat>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        {/* The complete final budget: every price, for admins and editors */}
        <Card>
          {finalPlan ? (
            <FinalBudget
              lines={finalLines}
              total={finalTotal}
              categories={categories}
              planName={finalPlan.name}
              adults={finalCounts.adults}
              kids={finalCounts.kids}
            />
          ) : (
            <>
              <h2 className="mb-2 text-xl font-bold">{t("dash.finalBudgetTitle")}</h2>
              <p className="text-lg text-stone-700">{t("dash.noFinalHint")}</p>
            </>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <h2 className="mb-3 text-xl font-bold">{t("dash.rsvpTitle")}</h2>
            {totalPeople === 0 ? (
              <p className="text-lg text-stone-700">{t("dash.noGuestsYet")}</p>
            ) : (
              <>
                <div className="flex h-5 w-full overflow-hidden rounded-full bg-stone-200" role="img" aria-label={t("dash.rsvpTitle")}>
                  {RSVPS.map((r) => (
                    <div key={r} className={RSVP_BAR[r]} style={{ width: `${(rsvpPeople(r) / totalPeople) * 100}%` }} />
                  ))}
                </div>
                <ul className="mt-3 space-y-1.5 text-lg">
                  {RSVPS.map((r) => (
                    <li key={r} className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2">
                        <span className={`h-3.5 w-3.5 rounded-full ${RSVP_BAR[r]}`} aria-hidden="true" />
                        {t(`rsvp.${r}`)}
                      </span>
                      <span className="font-bold tabular-nums">{t("dash.peopleCount", { n: rsvpPeople(r) })}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <h3 className="mb-2 mt-5 text-lg font-bold">{t("dash.invitationTitle")}</h3>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-lg">
              {INVITATIONS.map((i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span>{t(`invitation.${i}`)}</span>
                  <span className="font-bold tabular-nums">{invCount(i)}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h2 className="mb-3 text-xl font-bold">{t("dash.latestGuests")}</h2>
            {stats.latest.length === 0 ? (
              <p className="text-lg text-stone-700">{t("dash.noGuestsYet")}</p>
            ) : (
              <ul className="divide-y divide-stone-200">
                {stats.latest.map((g) => (
                  <li key={g.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-lg">
                    <span className="font-semibold">{bi(g.name, lang)}</span>
                    <span className="flex flex-wrap items-center gap-2 text-base text-stone-700">
                      <Badge tone="blue">{t(`side.${g.side}`)}</Badge>
                      {g.addedByName && <span>{t("guests.addedBy", { name: g.addedByName })}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-xl font-bold">{t("dash.quick")}</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-rose-800 bg-white p-3 text-center text-lg font-bold text-rose-900 transition hover:bg-rose-50"
            >
              <Icon name={l.icon} className="h-9 w-9" />
              {l.label}
            </Link>
          ))}
        </div>
      </section>

      {isAdmin && settings.weddingDate && <SettingsForm initial={settings} highlight={false} />}
    </div>
  );
}
