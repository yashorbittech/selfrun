"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceAction } from "@/lib/workspace/access";
import {
  createAdminUser,
  updateAdminUserRoles,
  updateAdminUserPermissionOverrides,
  resetAdminUserPassword,
  deactivateAdminUser,
  reactivateAdminUser,
  setUserTypeAndNotes,
  delegatedManagerBlock,
  type CreateAdminUserResult,
  type ResetPasswordResult,
} from "@/lib/workspace/admin-users";
import { ALL_KNOWN_ROLES } from "@/lib/workspace/role-catalog";
import { ALL_PERMISSION_KEYS } from "@/lib/workspace/permission-catalog";
import { searchActivityLog, type AdminActivityRow } from "@/lib/workspace/activity-log";

function revalidate() {
  revalidatePath("/workspace/users");
}

function sanitizeRoles(roles: string[]): string[] {
  return Array.from(new Set(roles.filter((r) => ALL_KNOWN_ROLES.includes(r))));
}

function sanitizeOverrides(overrides: Record<string, boolean>): Record<string, boolean> {
  const clean: Record<string, boolean> = {};
  for (const key of ALL_PERMISSION_KEYS) {
    if (key in overrides) clean[key] = overrides[key];
  }
  return clean;
}

export async function createAdminUserAction(
  email: string,
  roles: string[],
  userType?: "employee" | "contractor" | "partner" | "system",
  notes?: string
): Promise<CreateAdminUserResult> {
  const actor = await requireWorkspaceAction("company.users");
  const blocked = await delegatedManagerBlock(actor, { roles });
  if (blocked) return { ok: false, error: blocked };
  const result = await createAdminUser(email, sanitizeRoles(roles), userType, notes);
  if (result.ok) revalidate();
  return result;
}

export async function updateAdminUserRolesAction(
  id: string,
  roles: string[]
): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireWorkspaceAction("company.users");
  const blocked = await delegatedManagerBlock(admin, { targetId: id, roles });
  if (blocked) return { ok: false, error: blocked };
  const result = await updateAdminUserRoles(id, sanitizeRoles(roles), admin.id);
  if (result.ok) revalidate();
  return result;
}

export async function updateAdminUserPermissionOverridesAction(
  id: string,
  overrides: Record<string, boolean>
): Promise<{ ok: boolean; error?: string }> {
  const actor = await requireWorkspaceAction("company.users");
  const blocked = await delegatedManagerBlock(actor, { targetId: id, overrides: true });
  if (blocked) return { ok: false, error: blocked };
  const result = await updateAdminUserPermissionOverrides(id, sanitizeOverrides(overrides));
  if (result.ok) revalidate();
  return result;
}

export async function resetAdminUserPasswordAction(id: string): Promise<ResetPasswordResult> {
  const actor = await requireWorkspaceAction("company.users");
  const blocked = await delegatedManagerBlock(actor, { targetId: id });
  if (blocked) return { ok: false, error: blocked };
  const result = await resetAdminUserPassword(id);
  if (result.ok) revalidate();
  return result;
}

export async function deactivateAdminUserAction(id: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireWorkspaceAction("company.users");
  const blocked = await delegatedManagerBlock(admin, { targetId: id });
  if (blocked) return { ok: false, error: blocked };
  const result = await deactivateAdminUser(id, admin.id);
  if (result.ok) revalidate();
  return result;
}

export async function reactivateAdminUserAction(
  id: string,
  rolesToRestore?: string[]
): Promise<{ ok: boolean; error?: string }> {
  const actor = await requireWorkspaceAction("company.users");
  const blocked = await delegatedManagerBlock(actor, { targetId: id, roles: rolesToRestore });
  if (blocked) return { ok: false, error: blocked };
  const result = await reactivateAdminUser(id, rolesToRestore ? sanitizeRoles(rolesToRestore) : undefined);
  if (result.ok) revalidate();
  return result;
}

export async function setUserTypeAndNotesAction(
  id: string,
  userType: "employee" | "contractor" | "partner" | "system",
  notes?: string
): Promise<{ ok: boolean; error?: string }> {
  const actor = await requireWorkspaceAction("company.users");
  const blocked = await delegatedManagerBlock(actor, { targetId: id });
  if (blocked) return { ok: false, error: blocked };
  const result = await setUserTypeAndNotes(id, userType, notes);
  if (result.ok) revalidate();
  return result;
}

export async function bulkDeactivateAdminUsersAction(ids: string[]): Promise<{ deactivated: number; skipped: number }> {
  const admin = await requireWorkspaceAction("company.users");
  let deactivated = 0;
  for (const id of ids) {
    if (await delegatedManagerBlock(admin, { targetId: id })) continue;
    const result = await deactivateAdminUser(id, admin.id);
    if (result.ok) deactivated += 1;
  }
  revalidate();
  return { deactivated, skipped: ids.length - deactivated };
}

export async function bulkReactivateAdminUsersAction(ids: string[]): Promise<{ reactivated: number }> {
  const actor = await requireWorkspaceAction("company.users");
  let reactivated = 0;
  for (const id of ids) {
    if (await delegatedManagerBlock(actor, { targetId: id })) continue;
    const result = await reactivateAdminUser(id);
    if (result.ok) reactivated += 1;
  }
  revalidate();
  return { reactivated };
}

export async function getUserActivityAction(actorEmail: string): Promise<AdminActivityRow[]> {
  await requireWorkspaceAction("company.users");
  if (!actorEmail) return [];
  const result = await searchActivityLog({ search: actorEmail, pageSize: 50 });
  return result.items;
}
