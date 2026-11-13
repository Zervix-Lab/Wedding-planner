import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserPage } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import type { UserDTO } from "@/lib/types";
import { UsersManager } from "./UsersManager";

/** Member list, cached with tag "users" (refreshed by every create / edit / delete). */
const getUsers = unstable_cache(
  async (): Promise<UserDTO[]> => {
    await connectDB();
    const docs = await User.find().select("name email role side canManageVendors").sort({ createdAt: 1 }).lean();
    return docs.map((u) => ({
      _id: String(u._id),
      name: u.name,
      email: u.email,
      role: u.role === "admin" ? "admin" : "editor",
      side: u.side ?? "bride",
      canManageVendors: Boolean(u.canManageVendors),
    }));
  },
  ["users-all"],
  { tags: ["users"], revalidate: 120 },
);

export default async function UsersPage() {
  const me = await requireUserPage();
  if (me.role !== "admin") redirect("/dashboard");
  return <UsersManager users={await getUsers()} meId={me.id} />;
}
