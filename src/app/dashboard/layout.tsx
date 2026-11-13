import { requireUserPage } from "@/lib/auth";
import { getI18n } from "@/lib/i18n-server";
import { LangToggle } from "@/components/LangToggle";
import { DashShell, type NavItem } from "./DashShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUserPage();
  const { t } = await getI18n();

  const items: NavItem[] = [
    { href: "/dashboard", label: t("nav.dashboard"), icon: "chart", exact: true },
    { href: "/dashboard/budget", label: t("nav.budget"), icon: "wallet" },
    { href: "/dashboard/guests", label: t("nav.guests"), icon: "users" },
    { href: "/dashboard/vendors", label: t("nav.vendors"), icon: "store" },
    ...(user.role === "admin" ? [{ href: "/dashboard/users", label: t("nav.users"), icon: "user" } as NavItem] : []),
  ];

  return (
    <DashShell
      items={items}
      appName={t("app.name")}
      userName={user.name}
      roleLabel={t(`role.${user.role}`)}
      menuLabel={t("nav.menu")}
      closeLabel={t("common.close")}
      logoutLabel={t("auth.logout")}
      viewSiteLabel={t("nav.viewSite")}
      langToggle={<LangToggle />}
    >
      {children}
    </DashShell>
  );
}
