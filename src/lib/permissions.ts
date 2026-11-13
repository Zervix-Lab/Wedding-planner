// One place that says who may do what. Used by server actions (enforcement) and by pages (what to show).
import type { Role } from "./types";

export interface Actor {
  id: string;
  role: Role;
  canManageVendors: boolean;
}

export const isAdmin = (u: Actor) => u.role === "admin";

/** Admin always; an editor only when the admin switched "can add vendors" on for them. */
export const canManageVendors = (u: Actor) => u.role === "admin" || u.canManageVendors;

/** Create / edit / delete saved plans, mark one Final. Editors can view and use the calculator only. */
export const canManagePlans = isAdmin;
export const canManageUsers = isAdmin;
export const canManageSettings = isAdmin;

/** Any signed-in user may add and edit guests. */
export const canEditGuests = (_u: Actor) => true;

/** Admin can delete any guest; an editor only the ones they added themselves. */
export const canDeleteGuest = (u: Pick<Actor, "id" | "role">, addedById: string) => u.role === "admin" || (addedById !== "" && addedById === u.id);
