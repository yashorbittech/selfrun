import "server-only";
import { randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { escapeRegExp } from "@/lib/text-search";
import { hashPassword } from "@/lib/lms-auth";
import { newAccountBlockReason, rollbackIfOverSeats, rolesUseSeat, seatBlockReason } from "@/lib/platform/billing/enforce";

/**
 * Super Admin management of the shared `admin_users` collection — the
 * identity store every internal panel (HRMS/PMS/PRMS/TMS/Team Chat/LMS/Admin)
 * reads its login and `roles` array from. There is no existing in-app
 * surface for this anywhere: role grants are currently CLI-only
 * (`scripts/grant-*-role.mjs`). This is the first — treat it carefully:
 * every write here changes who can access what, across the whole ERP.
 */

import { ROLE_GROUPS } from "@/lib/workspace/role-catalog";
import { destroySessionsEverywhere } from "@/lib/cross-module-sso";
import { computeEffective, effectiveUpdate, getCustomRoles, resolveAssignableIds } from "@/lib/workspace/custom-roles";
import { type AdminUserRow, type PanelAccessSummaryItem, getPanelAccessSummary } from "@/lib/workspace/admin-users-shared";

export type { AdminUserRow, PanelAccessSummaryItem };
export { getPanelAccessSummary };

export const ADMIN_USERS_COLLECTION = "admin_users";
const SCRYPT_TEMP_PASSWORD_LENGTH = 12;

export interface AdminUserDoc {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  roles?: string[];
  /**
   * Per-capability overrides on top of `roles`, keyed `"<module>.<predicateName>"`
   * (e.g. `"pms.canManageProjects"`) — see `src/lib/permission-overrides.ts`.
   * `true` = explicit grant, `false` = explicit deny, key absent = default
   * role-based behavior. Inert on any account holding `super_admin`.
   */
  permissionOverrides?: Record<string, boolean>;
  employeeId?: string | null;
  mustChangePassword?: boolean;
  failedLoginAttempts?: number;
  lockedUntil?: Date | null;
  createdAt: Date;
  lastLoginAt?: Date | null;
  savedRoles?: string[];
  /** Inputs of the computed `roles` / `permissionOverrides` — see `custom-roles.ts`. */
  manualRoles?: string[];
  manualOverrides?: Record<string, boolean>;
  customRoleIds?: string[];
  userType?: "employee" | "contractor" | "partner" | "system";
  notes?: string;
}

function serialize(u: AdminUserDoc): AdminUserRow {
  const roles = u.roles ?? [];
  return {
    _id: u._id.toString(),
    email: u.email,
    roles,
    permissionOverrides: u.permissionOverrides ?? {},
    customRoleIds: u.customRoleIds ?? [],
    manualRoles: u.manualRoles ?? ((u.customRoleIds ?? []).length === 0 ? roles : []),
    manualOverrides: u.manualOverrides ?? ((u.customRoleIds ?? []).length === 0 ? u.permissionOverrides ?? {} : {}),
    employeeId: u.employeeId ?? null,
    mustChangePassword: u.mustChangePassword === true,
    locked: Boolean(u.lockedUntil && u.lockedUntil > new Date()),
    createdAt: u.createdAt.toISOString(),
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    status: roles.length > 0 ? "active" : "deactivated",
    savedRoles: u.savedRoles ?? [],
    userType: u.userType ?? "employee",
    notes: u.notes ?? "",
  };
}

async function collection() {
  const db = await getDb();
  return db.collection<AdminUserDoc>(ADMIN_USERS_COLLECTION);
}

function generateTempPassword(): string {
  return randomBytes(9).toString("base64url").slice(0, SCRYPT_TEMP_PASSWORD_LENGTH);
}

export interface AdminUserFilter {
  search?: string;
  role?: string;
  panel?: string;
  status?: "active" | "deactivated";
  userType?: "employee" | "contractor" | "partner" | "system";
}

function getRolesForPanel(panel: string): string[] {
  const p = panel.toLowerCase();
  if (p === "admin") return ["super_admin"];
  // OTS access is also implied by HRMS employee/hr and TMS roles (see `ots-roles.ts`).
  const extra = p === "ots" ? ["employee", "hr", "training_student", "tms_admin", "tms_manager", "mentor"] : [];
  // Derived from the role catalog (the roles each panel really checks) so a panel can never be left out of the filter.
  const group = ROLE_GROUPS.find((g) => g.panel === p);
  return group ? ["super_admin", ...group.roles.map((r) => r.value), ...extra] : ["super_admin"];
}

function buildFilter(opts: AdminUserFilter): Record<string, unknown> {
  const filter: Record<string, unknown> = {};

  if (opts.search?.trim()) {
    const rx = new RegExp(escapeRegExp(opts.search.trim()), "i");
    filter.$or = [{ email: rx }, { notes: rx }, { employeeId: rx }];
  }

  if (opts.role) {
    filter.roles = opts.role;
  } else if (opts.panel && opts.panel !== "all") {
    const panelRoles = getRolesForPanel(opts.panel);
    if (opts.panel === "lms" || opts.panel === "workspace") {
      filter.$and = [
        { roles: { $exists: true, $not: { $size: 0 } } },
        { $or: [{ roles: { $in: panelRoles } }, { roles: { $exists: true } }] },
      ];
    } else {
      filter.roles = { $in: panelRoles };
    }
  }

  if (opts.status === "active") {
    filter.roles = filter.roles
      ? { $all: filter.roles, $not: { $size: 0 } }
      : { $exists: true, $not: { $size: 0 } };
  } else if (opts.status === "deactivated") {
    filter.$or = [{ roles: { $exists: false } }, { roles: { $size: 0 } }];
  }

  if (opts.userType) {
    if (opts.userType === "employee") {
      filter.$or = [{ userType: "employee" }, { userType: { $exists: false } }];
    } else {
      filter.userType = opts.userType;
    }
  }

  return filter;
}

export interface SearchAdminUsersOptions extends AdminUserFilter {
  page?: number;
  pageSize?: number;
  sortBy?: "createdAt" | "email" | "lastLoginAt";
  sortDir?: "asc" | "desc";
}

export async function searchAdminUsers(opts: SearchAdminUsersOptions = {}) {
  const col = await collection();
  const page = Math.max(opts.page ?? 1, 1);
  const pageSize = Math.min(Math.max(opts.pageSize ?? 20, 1), 100);
  const filter = buildFilter(opts);
  const sortField = opts.sortBy ?? "createdAt";
  const sortDir = opts.sortDir === "asc" ? 1 : -1;

  const [docs, total, activeCount, deactivatedCount] = await Promise.all([
    col.find(filter).sort({ [sortField]: sortDir }).skip((page - 1) * pageSize).limit(pageSize).toArray(),
    col.countDocuments(filter),
    col.countDocuments({ roles: { $exists: true, $not: { $size: 0 } } }),
    col.countDocuments({ $or: [{ roles: { $exists: false } }, { roles: { $size: 0 } }] }),
  ]);

  return {
    items: docs.map(serialize),
    total,
    activeCount,
    deactivatedCount,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  };
}

export async function exportAdminUsers(opts: AdminUserFilter & { ids?: string[] } = {}): Promise<AdminUserRow[]> {
  const col = await collection();
  const filter =
    opts.ids && opts.ids.length > 0
      ? { _id: { $in: opts.ids.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id)) } }
      : buildFilter(opts);
  const docs = await col.find(filter).sort({ createdAt: -1 }).limit(5000).toArray();
  return docs.map(serialize);
}

export async function getAdminUserRow(id: string): Promise<AdminUserRow | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await collection();
  const doc = await col.findOne({ _id: new ObjectId(id) });
  return doc ? serialize(doc) : null;
}

/**
 * Limits for someone who manages users through the `workspace.manageUsers`
 * permission without being a Super Admin: they can't hand out `super_admin`,
 * can't change a Super Admin's account, and can't edit permission overrides
 * (any of which would let them raise their own access). Returns the reason,
 * or null when the action is allowed. Super Admins are never limited.
 */
export async function delegatedManagerBlock(
  actor: { id?: string; roles: readonly string[] },
  action: { targetId?: string; roles?: readonly string[]; overrides?: boolean }
): Promise<string | null> {
  if (actor.roles.includes("super_admin")) return null;
  // Nobody raises their own access: a delegated manager can't change their own account's roles or permissions.
  if (actor.id && action.targetId && action.targetId === actor.id && (action.roles || action.overrides)) return "You can't change your own access.";
  // An admin-tier role can only be handed on by someone who holds it themselves.
  const escalating = (action.roles ?? []).filter((r) => /_admin$/.test(r) && !actor.roles.includes(r));
  if (escalating.length > 0) return "You can only grant an admin role that you hold yourself.";
  if (action.overrides) return "Only a Super Admin can change permission overrides.";
  if (action.roles?.includes("super_admin")) return "Only a Super Admin can grant the Super Admin role.";
  if (action.targetId) {
    const target = ObjectId.isValid(action.targetId) ? await (await collection()).findOne({ _id: new ObjectId(action.targetId) }, { projection: { roles: 1, savedRoles: 1 } }) : null;
    if (target?.roles?.includes("super_admin") || target?.savedRoles?.includes("super_admin")) return "Only a Super Admin can change a Super Admin's account.";
  }
  return null;
}

export interface CreateAdminUserResult {
  ok: boolean;
  error?: string;
  id?: string;
  tempPassword?: string;
}

export async function createAdminUser(
  email: string,
  roles: string[],
  userType?: "employee" | "contractor" | "partner" | "system",
  notes?: string,
  customRoleIds: string[] = [],
): Promise<CreateAdminUserResult> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return { ok: false, error: "Enter a valid email address." };

  const col = await collection();
  const existing = await col.findOne({ email: normalizedEmail });
  if (existing) return { ok: false, error: "An account with this email already exists." };
  const assigned = await resolveAssignableIds(customRoleIds);
  if (!assigned.ok) return { ok: false, error: assigned.error };
  const custom = await getCustomRoles(assigned.ids);
  const eff = computeEffective(roles, {}, custom);
  if (eff.roles.length === 0) return { ok: false, error: "Choose at least one role." };
  const seatBlock = await newAccountBlockReason(eff.roles);
  if (seatBlock) return { ok: false, error: seatBlock };

  const tempPassword = generateTempPassword();
  const doc: AdminUserDoc = {
    _id: new ObjectId(),
    email: normalizedEmail,
    passwordHash: hashPassword(tempPassword),
    roles: eff.roles,
    permissionOverrides: eff.overrides,
    manualRoles: roles,
    manualOverrides: {},
    customRoleIds: assigned.ids,
    userType: userType ?? "employee",
    notes: notes?.trim() || undefined,
    employeeId: null,
    mustChangePassword: true,
    failedLoginAttempts: 0,
    lockedUntil: null,
    createdAt: new Date(),
    lastLoginAt: null,
  };
  await col.insertOne(doc);
  const rolledBack = await rollbackIfOverSeats(doc._id);
  if (rolledBack) return { ok: false, error: rolledBack };
  return { ok: true, id: doc._id.toString(), tempPassword };
}

/**
 * `actorId` is always the calling super_admin's own id, checked here so a
 * super_admin can never strip their own `super_admin` role through this UI —
 * the one way to lock every Super Admin out of company management for good.
 */
export async function updateAdminUserRoles(
  id: string,
  roles: string[],
  actorId: string,
  customRoleIds?: string[],
): Promise<{ ok: boolean; error?: string }> {
  if (!ObjectId.isValid(id)) return { ok: false, error: "Unknown account." };
  if (id === actorId && !roles.includes("super_admin")) {
    return { ok: false, error: "You can't remove your own Super Admin role." };
  }
  const col = await collection();
  const current = await col.findOne({ _id: new ObjectId(id) });
  if (!current) return { ok: false, error: "Unknown account." };
  let ids = current.customRoleIds ?? [];
  if (customRoleIds) {
    const assigned = await resolveAssignableIds(customRoleIds);
    if (!assigned.ok) return { ok: false, error: assigned.error };
    ids = assigned.ids;
  }
  const update = await effectiveUpdate(current, { manualRoles: roles, customRoleIds: ids });
  const effective = (update.roles as string[] | undefined) ?? [];
  if (effective.length > 0 && !rolesUseSeat(current.roles) && rolesUseSeat(effective)) {
    const seatBlock = await seatBlockReason(1);
    if (seatBlock) return { ok: false, error: seatBlock };
  }
  const res = await col.updateOne({ _id: new ObjectId(id) }, { $set: update });
  return { ok: res.matchedCount === 1 };
}

/**
 * Full-replace write for `permissionOverrides`, mirroring `updateAdminUserRoles`'s
 * shape. Key validation against the known permission catalog happens one layer
 * up, in the admin server action (same "filter against the known-good list"
 * precedent `sanitizeRoles()` uses for roles) — this function trusts its input.
 * No self-protection guard is needed here: overrides are inert on any account
 * holding `super_admin` (see `resolvePermission` in `permission-overrides.ts`),
 * so a super_admin can never lock themselves — or another super_admin — out via
 * a bad override.
 */
export async function updateAdminUserPermissionOverrides(
  id: string,
  overrides: Record<string, boolean>
): Promise<{ ok: boolean; error?: string }> {
  if (!ObjectId.isValid(id)) return { ok: false, error: "Unknown account." };
  const col = await collection();
  const current = await col.findOne({ _id: new ObjectId(id) });
  if (!current) return { ok: false, error: "Unknown account." };
  const res = await col.updateOne({ _id: new ObjectId(id) }, { $set: await effectiveUpdate(current, { manualOverrides: overrides }) });
  return { ok: res.matchedCount === 1 };
}

export interface ResetPasswordResult {
  ok: boolean;
  error?: string;
  tempPassword?: string;
}

export async function resetAdminUserPassword(id: string): Promise<ResetPasswordResult> {
  if (!ObjectId.isValid(id)) return { ok: false, error: "Unknown account." };
  const col = await collection();
  const tempPassword = generateTempPassword();
  const res = await col.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        passwordHash: hashPassword(tempPassword),
        mustChangePassword: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    }
  );
  if (res.matchedCount !== 1) return { ok: false, error: "Unknown account." };
  return { ok: true, tempPassword };
}

/**
 * Clears every role and saves current roles to `savedRoles` for restoration.
 * Also immediately terminates all active sessions across all panels.
 */
export async function deactivateAdminUser(id: string, actorId: string): Promise<{ ok: boolean; error?: string }> {
  if (!ObjectId.isValid(id)) return { ok: false, error: "Unknown account." };
  if (id === actorId) return { ok: false, error: "You can't deactivate your own account." };
  const col = await collection();
  const existing = await col.findOne({ _id: new ObjectId(id) });
  if (!existing) return { ok: false, error: "Account not found." };

  const currentRoles = existing.roles ?? [];
  const updateData: Record<string, unknown> = { roles: [] };
  if (currentRoles.length > 0) {
    updateData.savedRoles = currentRoles;
  }

  const res = await col.updateOne({ _id: new ObjectId(id) }, { $set: updateData });
  if (res.matchedCount === 1) {
    try {
      await destroySessionsEverywhere(new ObjectId(id));
    } catch (e) {
      console.error("Failed to revoke sessions on deactivation:", e);
    }
  }
  return { ok: res.matchedCount === 1 };
}

export async function reactivateAdminUser(
  id: string,
  rolesToRestore?: string[]
): Promise<{ ok: boolean; error?: string }> {
  if (!ObjectId.isValid(id)) return { ok: false, error: "Unknown account." };
  const col = await collection();
  const existing = await col.findOne({ _id: new ObjectId(id) });
  if (!existing) return { ok: false, error: "Account not found." };

  const inputsRoles = existing.manualRoles ?? ((existing.customRoleIds ?? []).length === 0 ? existing.savedRoles ?? [] : []);
  let roles: string[];
  let manualRoles = inputsRoles;
  if (rolesToRestore && rolesToRestore.length > 0) {
    manualRoles = rolesToRestore;
    roles = computeEffective(rolesToRestore, {}, await getCustomRoles(existing.customRoleIds ?? [])).roles;
  } else if (existing.savedRoles && existing.savedRoles.length > 0) {
    roles = existing.savedRoles;
  } else {
    roles = ["employee"];
    manualRoles = ["employee"];
  }
  const seatBlock = rolesUseSeat(roles) && !rolesUseSeat(existing.roles) ? await seatBlockReason(1) : null;
  if (seatBlock) return { ok: false, error: seatBlock };

  const res = await col.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: { roles, manualRoles },
      $unset: { savedRoles: "" },
    }
  );
  return { ok: res.matchedCount === 1 };
}

export async function setUserTypeAndNotes(
  id: string,
  userType: "employee" | "contractor" | "partner" | "system",
  notes?: string
): Promise<{ ok: boolean; error?: string }> {
  if (!ObjectId.isValid(id)) return { ok: false, error: "Unknown account." };
  const col = await collection();
  const updatePayload: Record<string, unknown> = { userType };
  if (notes !== undefined) {
    updatePayload.notes = notes.trim();
  }
  const res = await col.updateOne({ _id: new ObjectId(id) }, { $set: updatePayload });
  return { ok: res.matchedCount === 1 };
}
