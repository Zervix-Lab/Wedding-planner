import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { toBi } from "@/lib/bi";
import { buildLines, indexVendors, picksFromSelections, planCounts, sumLines } from "@/lib/calc";
import { getCategories } from "@/lib/categories";
import { getAllVendors } from "@/lib/data";
import { connectDB } from "@/lib/db";
import { buildGuestFilter, parseGuestParams } from "@/lib/guest-query";
import { getI18n } from "@/lib/i18n-server";
import { Guest } from "@/lib/models/Guest";
import { User } from "@/lib/models/User";
import { getConfirmedCounts, getPlans } from "@/lib/plans-data";
import { buildXlsx, XLSX_MIME, type SheetData } from "@/lib/xlsx";
import { bi } from "@/lib/types";

export const dynamic = "force-dynamic";
const MAX_ROWS = 5000;

/** GET /api/export/guests | vendors | plans | users  ->  an .xlsx download in the visitor's chosen language. */
export async function GET(req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "err.unauthorized" }, { status: 401 });
  const { kind } = await params;
  const { lang, t } = await getI18n();
  const url = new URL(req.url);
  const yes = t("xl.yes");
  const no = t("xl.no");
  await connectDB();

  let sheets: SheetData[];

  if (kind === "guests") {
    const filter = buildGuestFilter(parseGuestParams(Object.fromEntries(url.searchParams)));
    const docs = await Guest.find(filter)
      .sort({ "name.en": 1, "name.si": 1, _id: 1 })
      .limit(MAX_ROWS)
      .populate<{ addedBy: { name: string } | null }>("addedBy", "name")
      .lean();
    const rows = docs.map((g, i) => {
      const name = toBi(g.name);
      return [
        i + 1,
        bi(name, lang),
        g.phone ?? "",
        t(`side.${g.side}`),
        t(`group.${g.group ?? "other"}`),
        g.adults ?? 0,
        g.kids ?? 0,
        (g.adults ?? 0) + (g.kids ?? 0),
        (g.events ?? []).map((e) => t(`event.${e}`)).join(", "),
        t(`invitation.${g.invitation ?? "not_sent"}`),
        t(`rsvp.${g.rsvp ?? "pending"}`),
        g.notes ?? "",
        g.addedBy?.name ?? "",
      ];
    });
    const sum = (col: number) => rows.reduce((s, r) => s + (r[col] as number), 0);
    sheets = [
      {
        name: t("nav.guests"),
        columns: [
          { header: t("xl.number"), width: 6, number: true },
          { header: t("guests.name"), width: 32 },
          { header: t("guests.phone"), width: 16 },
          { header: t("guests.side"), width: 18 },
          { header: t("guests.group"), width: 14 },
          { header: t("guests.adults"), width: 11, number: true },
          { header: t("guests.kids"), width: 9, number: true },
          { header: t("xl.people"), width: 11, number: true },
          { header: t("guests.events"), width: 24 },
          { header: t("guests.invitation"), width: 18 },
          { header: t("guests.rsvp"), width: 20 },
          { header: t("guests.notes"), width: 30 },
          { header: t("xl.addedBy"), width: 16 },
        ],
        rows,
        totals: [t("xl.total"), "", "", "", "", sum(5), sum(6), sum(7), "", "", "", "", ""],
      },
    ];
  } else if (kind === "vendors") {
    const [vendors, cats] = await Promise.all([getAllVendors(), getCategories()]);
    const catName = new Map(cats.map((c) => [c.slug, bi(c.name, lang)]));
    const rows = vendors.flatMap((v) => {
      const base = [catName.get(v.category) ?? v.category, bi(v.name, lang), v.contact, v.serviceCharge, v.minPlates, v.showOnLanding ? yes : no];
      if (v.options.length === 0) return [[...base, "", "", null, null, ""]];
      return v.options.map((o) => [
        ...base,
        bi(o.name, lang),
        t(`pricetype.${o.priceType}`),
        o.price,
        o.kidsPrice,
        o.inclusions.map((x) => bi(x, lang)).join(", "),
      ]);
    });
    sheets = [
      {
        name: t("nav.vendors"),
        columns: [
          { header: t("vendors.category"), width: 18 },
          { header: t("vendors.name"), width: 32 },
          { header: t("vendors.contact"), width: 18 },
          { header: t("vendors.serviceCharge"), width: 12, number: true },
          { header: t("vendors.minPlates"), width: 11, number: true },
          { header: t("xl.onLanding"), width: 12 },
          { header: t("vendors.optionName"), width: 30 },
          { header: t("vendors.priceType"), width: 16 },
          { header: t("vendors.price"), width: 14, number: true },
          { header: t("vendors.kidsPrice"), width: 14, number: true },
          { header: t("vendors.inclusions"), width: 40 },
        ],
        rows,
      },
    ];
  } else if (kind === "plans") {
    const [vendors, plans, confirmed, cats] = await Promise.all([getAllVendors(), getPlans(), getConfirmedCounts(), getCategories()]);
    const byId = indexVendors(vendors);
    const order = cats.map((c) => c.slug);
    const catName = new Map(cats.map((c) => [c.slug, bi(c.name, lang)]));
    const summary: SheetData["rows"] = [];
    const detail: SheetData["rows"] = [];
    for (const p of plans) {
      const c = planCounts(p, confirmed);
      const lines = buildLines(picksFromSelections(p.selections, byId).picks, byId, c.adults, c.kids, order);
      summary.push([p.name, p.isFinal ? t("budget.final") : "", c.adults, c.kids, sumLines(lines)]);
      for (const l of lines) {
        detail.push([p.name, catName.get(l.category) ?? l.category, bi(l.vendor.name, lang), bi(l.option.name, lang), t(`pricetype.${l.option.priceType}`), l.calc.base, l.calc.service, l.calc.total]);
      }
    }
    sheets = [
      {
        name: t("budget.plans"),
        columns: [
          { header: t("xl.plan"), width: 22 },
          { header: t("budget.final"), width: 10 },
          { header: t("budget.adults"), width: 11, number: true },
          { header: t("budget.kids"), width: 9, number: true },
          { header: t("budget.total"), width: 18, number: true },
        ],
        rows: summary,
      },
      {
        name: t("xl.details"),
        columns: [
          { header: t("xl.plan"), width: 22 },
          { header: t("vendors.category"), width: 18 },
          { header: t("xl.vendor"), width: 26 },
          { header: t("vendors.optionName"), width: 26 },
          { header: t("vendors.priceType"), width: 16 },
          { header: t("xl.amount"), width: 16, number: true },
          { header: t("xl.service"), width: 16, number: true },
          { header: t("budget.total"), width: 18, number: true },
        ],
        rows: detail,
      },
    ];
  } else if (kind === "users") {
    if (me.role !== "admin") return NextResponse.json({ error: "err.unauthorized" }, { status: 403 });
    const users = await User.find().select("name email role side canManageVendors").sort({ createdAt: 1 }).lean();
    sheets = [
      {
        name: t("nav.users"),
        columns: [
          { header: t("users.name"), width: 26 },
          { header: t("auth.email"), width: 32 },
          { header: t("users.role"), width: 14 },
          { header: t("users.side"), width: 18 },
          { header: t("xl.vendorAccess"), width: 16 },
        ],
        rows: users.map((u) => [
          u.name,
          u.email,
          t(`role.${u.role === "admin" ? "admin" : "editor"}`),
          t(`side.${u.side ?? "bride"}`),
          u.role === "admin" || u.canManageVendors ? yes : no,
        ]),
      },
    ];
  } else {
    return NextResponse.json({ error: "err.notFound" }, { status: 404 });
  }

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" });
  const body = buildXlsx(sheets);
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": XLSX_MIME,
      "Content-Disposition": `attachment; filename="${kind}-${today}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
