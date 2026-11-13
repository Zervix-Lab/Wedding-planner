import { requireUserPage } from "@/lib/auth";
import { getCategories } from "@/lib/categories";
import { getAllVendors } from "@/lib/data";
import { canManagePlans } from "@/lib/permissions";
import { getGuestCounts, getPlans } from "@/lib/plans-data";
import { BudgetClient } from "./BudgetClient";

export default async function BudgetPage() {
  const user = await requireUserPage();
  const [vendors, plans, guests, categories] = await Promise.all([getAllVendors(), getPlans(), getGuestCounts(), getCategories()]);
  return <BudgetClient vendors={vendors} plans={plans} guests={guests} categories={categories} canManage={canManagePlans(user)} />;
}
