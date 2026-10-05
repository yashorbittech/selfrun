/**
 * LMS (Lead & Learning Management System) role model.
 * Access is gated on the shared `admin_users.roles` array.
 */

import { resolvePermission, type RoleContext } from "@/lib/permission-overrides";

export const LMS_ROLES = ["super_admin", "lms_admin", "lms_manager", "lms_agent"] as const;

export type LmsRole = (typeof LMS_ROLES)[number];

export const LMS_ROLE_META: Record<LmsRole, { label: string; description: string }> = {
  super_admin: {
    label: "Super Admin",
    description: "Full access to leads, campaigns, courses, and CRM analytics.",
  },
  lms_admin: {
    label: "LMS Admin",
    description: "Full control over leads, marketing campaigns, courses, and sales analytics.",
  },
  lms_manager: {
    label: "LMS Manager",
    description: "Manage lead assignments, sales stages, student enrollments, and reports.",
  },
  lms_agent: {
    label: "LMS Executive / Counselor",
    description: "Manage assigned leads, track call activities, and update status.",
  },
};

export function isLmsRole(value: unknown): value is LmsRole {
  return typeof value === "string" && (LMS_ROLES as readonly string[]).includes(value);
}

export function normalizeLmsRoles(value: unknown): LmsRole[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter(isLmsRole)));
}

export function hasLmsAccess(roles: readonly string[] | undefined | null): boolean {
  return normalizeLmsRoles(roles).length > 0;
}

export function isLmsAdmin(user: RoleContext): boolean {
  return resolvePermission(user, "lms.isLmsAdmin", () =>
    user.roles.includes("super_admin") || user.roles.includes("lms_admin")
  );
}

export function canManageLeads(user: RoleContext): boolean {
  return resolvePermission(user, "lms.canManageLeads", () =>
    user.roles.includes("super_admin") || user.roles.includes("lms_admin") || user.roles.includes("lms_manager")
  );
}

export function canManageCampaigns(user: RoleContext): boolean {
  return resolvePermission(user, "lms.canManageCampaigns", () =>
    user.roles.includes("super_admin") || user.roles.includes("lms_admin") || user.roles.includes("lms_manager")
  );
}

export function canViewLmsAnalytics(user: RoleContext): boolean {
  return resolvePermission(user, "lms.canViewAnalytics", () =>
    user.roles.includes("super_admin") || user.roles.includes("lms_admin") || user.roles.includes("lms_manager")
  );
}
