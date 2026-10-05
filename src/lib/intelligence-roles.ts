/**
 * AI Intelligence (AI Data Analyst) role model. Like every other panel, access
 * is gated on the shared `admin_users.roles` array — there is no separate
 * user store. Opening the panel needs an explicit `intelligence_*` role (or
 * super_admin).
 *
 * IMPORTANT: this decides only WHO MAY OPEN THE PANEL. What data a question
 * may touch is decided per business entity, from the roles of each panel the
 * data belongs to (`lib/intelligence/catalog/access.ts`, built on
 * `lib/platform/access.ts`) — an Intelligence role grants no data by itself.
 *
 * Pure file (no server-only imports) so the Workspace catalogs can use it.
 */

import { resolvePermission, type RoleContext } from "@/lib/permission-overrides";

export const INTELLIGENCE_ROLES = ["super_admin", "intelligence_admin", "intelligence_user"] as const;
export type IntelligenceRole = (typeof INTELLIGENCE_ROLES)[number];

export const INTELLIGENCE_ROLE_META: Record<IntelligenceRole, { label: string; description: string }> = {
  super_admin: {
    label: "Super Admin",
    description: "Opens AI Intelligence and can ask about every part of the company's data.",
  },
  intelligence_admin: {
    label: "AI Intelligence Admin",
    description: "Opens AI Intelligence. Answers still only use data this person may already see in the other panels.",
  },
  intelligence_user: {
    label: "AI Intelligence User",
    description: "Ask business questions in plain language. Answers only use data this person may already see in the other panels.",
  },
};

export const INTELLIGENCE_PERMISSIONS = ["USE"] as const;
export type IntelligencePermission = (typeof INTELLIGENCE_PERMISSIONS)[number];

/** Key under which the Super Admin stores an override — matches `permission-catalog.ts`. */
export const INTELLIGENCE_PERMISSION_KEY: Record<IntelligencePermission, string> = {
  USE: "intelligence.canUse",
};

export const INTELLIGENCE_PERMISSION_META: Record<IntelligencePermission, { label: string; description: string }> = {
  USE: { label: "Use AI Intelligence", description: "Open the panel and ask questions. Which records an answer may use is decided by the person's access in the other panels, not by this." },
};

export function isIntelligenceRole(value: unknown): value is IntelligenceRole {
  return typeof value === "string" && (INTELLIGENCE_ROLES as readonly string[]).includes(value);
}

export function normalizeIntelligenceRoles(value: unknown): IntelligenceRole[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter(isIntelligenceRole)));
}

/** Can open the AI Intelligence panel at `/intelligence/*`. */
export function hasIntelligenceAccess(roles: readonly string[] | undefined | null): boolean {
  return normalizeIntelligenceRoles(roles).length > 0;
}

/** The single permission check every page, action and route uses. Super Admin overrides are honoured (a denial removes the panel). */
export function intelligenceCan(user: RoleContext, permission: IntelligencePermission): boolean {
  return resolvePermission(user, INTELLIGENCE_PERMISSION_KEY[permission], () => hasIntelligenceAccess(user.roles));
}

export function primaryIntelligenceRoleLabel(roles: readonly string[]): string {
  if (roles.includes("super_admin")) return INTELLIGENCE_ROLE_META.super_admin.label;
  const eff = normalizeIntelligenceRoles(roles);
  for (const r of ["intelligence_admin", "intelligence_user"] as const) if (eff.includes(r)) return INTELLIGENCE_ROLE_META[r].label;
  return "No Access";
}
