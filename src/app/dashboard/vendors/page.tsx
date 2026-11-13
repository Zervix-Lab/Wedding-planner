import { requireUserPage } from "@/lib/auth";
import { getCategories } from "@/lib/categories";
import { getAllVendors } from "@/lib/data";
import { canManageVendors } from "@/lib/permissions";
import { VendorsManager } from "./VendorsManager";

export default async function VendorsPage() {
  const user = await requireUserPage();
  const [vendors, categories] = await Promise.all([getAllVendors(), getCategories()]);
  return (
    <VendorsManager
      vendors={vendors}
      categories={categories}
      me={{ id: user.id, role: user.role, canManageVendors: user.canManageVendors }}
      canAdd={canManageVendors(user)}
    />
  );
}
