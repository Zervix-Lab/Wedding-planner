import { requireUserPage } from "@/lib/auth";
import { getCategories } from "@/lib/categories";
import { getAllVendors } from "@/lib/data";
import { canManagePlans } from "@/lib/permissions";
import { getConfirmedCounts, getPlans } from "@/lib/plans-data";
import { BudgetClient } from "./BudgetClient";

export default async function BudgetPage() {
  const user = await requireUserPage();
  const [vendors, plans, confirmed, categories] = await Promise.all([getAllVendors(), getPlans(), getConfirmedCounts(), getCategories()]);
  return <BudgetClient vendors={vendors} plans={plans} confirmed={confirmed} categories={categories} canManage={canManagePlans(user)} />;
}
