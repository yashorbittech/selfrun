"use server";

import { checkSeatUsage } from "@/lib/notify/triggers/usage";
import { countSeatsUsed } from "@/lib/platform/billing/enforce";
import { workspaceEvents } from "@/lib/notify/triggers/workspace";
import { revalidatePath } from "next/cache";
import { requireWorkspaceAction } from "@/lib/products/commandos/access";
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
} from "@/lib/products/commandos/admin-users";
import { ObjectId } from "mongodb";
import { resetTwoFactor } from "@/lib/security/two-factor";
import { ALL_KNOWN_ROLES } from "@/lib/products/commandos/role-catalog";
import { ALL_PERMISSION_KEYS } from "@/lib/products/commandos/permission-catalog";
import { searchActivityLog, type AdminActivityRow } from "@/lib/products/commandos/activity-log";
import { customRolesCarryPermissions, getCustomRoles, recordAccessAudit } from "@/lib/products/commandos/custom-roles";

/** Why `actor` may not hand out these custom roles, or null. Roles that carry permission grants are Super-Admin-only; plain bundles follow the same escalation rules as built-in roles. */
async function customRoleBlock(actor: { id?: string; roles: readonly string[] }, targetId: string | undefined, ids: string[] | undefined): Promise<string | null> {
  if (!ids || ids.length === 0) return null;
  if (actor.roles.includes("super_admin")) return null;
  if (await customRolesCarryPermissions(ids)) return "Only a Super Admin can give a custom role that carries permission rules.";
  const roles = (await getCustomRoles(ids)).flatMap((r) => r.baseRoles);
  return delegatedManagerBlock(actor, { targetId, roles });
}

function revalidate() {
  revalidatePath("/commandos/users");
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
  notes?: string,
  customRoleIds?: string[],
): Promise<CreateAdminUserResult> {
  const actor = await requireWorkspaceAction("company.users");
  const blocked = (await delegatedManagerBlock(actor, { roles })) ?? (await customRoleBlock(actor, undefined, customRoleIds));
  if (blocked) return { ok: false, error: blocked };
  const result = await createAdminUser(email, sanitizeRoles(roles), userType, notes, customRoleIds ?? []);
  if (result.ok) {
    await recordAccessAudit({ actorId: actor.id, action: "user.created", target: email.trim().toLowerCase(), detail: `roles: ${sanitizeRoles(roles).join(", ") || "none"}; custom roles: ${(customRoleIds ?? []).length}` }); revalidate(); await workspaceEvents.userAdded(email.trim().toLowerCase(), sanitizeRoles(roles), actor.id); await checkSeatUsage(await countSeatsUsed()); }
  return result;
}

export async function updateAdminUserRolesAction(
  id: string,
  roles: string[],
  customRoleIds?: string[],
): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireWorkspaceAction("company.users");
  const blocked = (await delegatedManagerBlock(admin, { targetId: id, roles })) ?? (await customRoleBlock(admin, id, customRoleIds));
  if (blocked) return { ok: false, error: blocked };
  const result = await updateAdminUserRoles(id, sanitizeRoles(roles), admin.id, customRoleIds);
  if (result.ok) {
    await recordAccessAudit({ actorId: admin.id, action: "user.roles_changed", target: id, detail: `roles: ${sanitizeRoles(roles).join(", ") || "none"}${customRoleIds ? `; custom roles: ${customRoleIds.length}` : ""}` }); revalidate(); await workspaceEvents.rolesChanged(id, sanitizeRoles(roles), admin.id); }
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
  if (result.ok) {
    await recordAccessAudit({ actorId: actor.id, action: "user.permissions_changed", target: id, detail: `${Object.keys(sanitizeOverrides(overrides)).length} individual rule(s)` }); revalidate(); await workspaceEvents.overridesChanged(id, actor.id); }
  return result;
}

export async function resetAdminUserPasswordAction(id: string): Promise<ResetPasswordResult> {
  const actor = await requireWorkspaceAction("company.users");
  const blocked = await delegatedManagerBlock(actor, { targetId: id });
  if (blocked) return { ok: false, error: blocked };
  const result = await resetAdminUserPassword(id);
  if (result.ok) { revalidate(); await workspaceEvents.passwordReset(id, actor.id); }
  return result;
}

export async function deactivateAdminUserAction(id: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireWorkspaceAction("company.users");
  const blocked = await delegatedManagerBlock(admin, { targetId: id });
  if (blocked) return { ok: false, error: blocked };
  const result = await deactivateAdminUser(id, admin.id);
  if (result.ok) {
    await recordAccessAudit({ actorId: admin.id, action: "user.deactivated", target: id }); revalidate(); await workspaceEvents.deactivated(id, admin.id); }
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
  if (result.ok) { revalidate(); await workspaceEvents.reactivated(id, actor.id); }
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

/** Switches two-step sign-in off for someone who lost their device (Super Admin only); they can set it up again. */
export async function resetAdminUserTwoFactorAction(id: string): Promise<{ ok: boolean; error?: string }> {
  const actor = await requireWorkspaceAction("company.users");
  if (!actor.roles.includes("super_admin")) return { ok: false, error: "Only a Super Admin can reset two-step sign-in." };
  if (!ObjectId.isValid(id)) return { ok: false, error: "Unknown user." };
  await resetTwoFactor(new ObjectId(id));
  await recordAccessAudit({ actorId: actor.id, action: "user.two_factor_reset", target: id });
  revalidate();
  return { ok: true };
}
