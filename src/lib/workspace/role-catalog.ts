import { HRMS_ROLES, HRMS_ROLE_META } from "@/lib/hrms-roles";
import { PMS_ROLES, PMS_ROLE_META } from "@/lib/pms-roles";
import { PRMS_ROLES, PRMS_ROLE_META } from "@/lib/prms-roles";
import { TMS_ROLES, TMS_ROLE_META } from "@/lib/tms-roles";
import { CHAT_ROLES, CHAT_ROLE_META } from "@/lib/messenger-roles";
import { FMS_ROLES, FMS_ROLE_META } from "@/lib/fms-roles";
import { SOP_ROLES, SOP_ROLE_META } from "@/lib/sop-roles";
import { SEO_ROLES, SEO_ROLE_META } from "@/lib/seo-roles";
import { DLMS_ROLES, DLMS_ROLE_META } from "@/lib/dlms-roles";
import { AIBOTS_ROLES, AIBOTS_ROLE_META } from "@/lib/aibots-roles";
import { INTELLIGENCE_ROLES, INTELLIGENCE_ROLE_META } from "@/lib/intelligence-roles";
import { SMMS_ROLES, SMMS_ROLE_META } from "@/lib/smms-roles";
import { OTS_ROLES, OTS_ROLE_META } from "@/lib/ots-roles";
import { CMS_ROLES, CMS_ROLE_META } from "@/lib/cms-roles";

/**
 * Every real role literal that can appear in `admin_users.roles`, grouped by
 * the module that defines it — pulled directly from each module's own
 * `*-roles.ts` (the actual source of truth every login check reads), not a
 * separate/parallel list. `super_admin` is the one literal shared by every
 * module (it already implicitly grants full access everywhere — see each
 * module's own role file) so it's shown once, not repeated per group.
 *
 * `/lms` (CRM) has no role gate at all — any `admin_users` account can sign
 * in there, so it isn't a group here.
 */

export interface RoleOption {
  value: string;
  label: string;
  description: string;
}

export interface RoleGroup {
  /** Fallback label; screens show the Panel Registry name for `panel` instead. */
  module: string;
  /** Panel Registry key this group's roles belong to. */
  panel: string;
  roles: RoleOption[];
}

function group<T extends string>(
  moduleLabel: string,
  all: readonly T[],
  meta: Record<T, { label: string; description: string }>,
  panel: string
): RoleGroup {
  return {
    module: moduleLabel,
    panel,
    roles: all.filter((r) => r !== "super_admin").map((r) => ({ value: r, ...meta[r] })),
  };
}

export const LMS_ROLES = ["lms_admin", "lms_manager", "lms_agent"] as const;
export const PORTAL_ADMIN_ROLES = ["portal_admin", "portal_manager"] as const;
export const WORKSPACE_ROLES = ["workspace_admin", "workspace_member"] as const;

export const ROLE_GROUPS: RoleGroup[] = [
  group("HRMS", HRMS_ROLES, HRMS_ROLE_META, "hrms"),
  group("PMS (Projects)", PMS_ROLES, PMS_ROLE_META, "pms"),
  group("Procurement (PRMS)", PRMS_ROLES, PRMS_ROLE_META, "prms"),
  group("Training (TMS)", TMS_ROLES, TMS_ROLE_META, "tms"),
  group("Team Chat (Messenger)", CHAT_ROLES, CHAT_ROLE_META, "messenger"),
  group("Finance (FMS)", FMS_ROLES, FMS_ROLE_META, "fms"),
  group("SOP Panel", SOP_ROLES, SOP_ROLE_META, "sop"),
  group("SEO Panel", SEO_ROLES, SEO_ROLE_META, "seo"),
  group("Digi Locker (DLMS)", DLMS_ROLES, DLMS_ROLE_META, "dlms"),
  group("AI Bots", AIBOTS_ROLES, AIBOTS_ROLE_META, "aibots"),
  group("AI Intelligence", INTELLIGENCE_ROLES, INTELLIGENCE_ROLE_META, "intelligence"),
  group("Social Media (SMMS)", SMMS_ROLES, SMMS_ROLE_META, "smms"),
  group("Online Tests (OTS)", OTS_ROLES, OTS_ROLE_META, "ots"),
  group("Website CMS", CMS_ROLES, CMS_ROLE_META, "cms"),
  {
    module: "LMS (CRM & Learning)",
    panel: "lms",
    roles: [
      { value: "lms_admin", label: "LMS Admin", description: "Full control over leads, marketing campaigns, courses, and sales analytics." },
      { value: "lms_manager", label: "LMS Manager", description: "Manage lead assignments, sales stages, student enrollments, and reports." },
      { value: "lms_agent", label: "LMS Executive / Counselor", description: "Manage assigned leads, track call activities, and update status." },
    ],
  },
  {
    module: "External Portal",
    panel: "portal",
    roles: [
      { value: "portal_admin", label: "Portal Admin", description: "Full administration of applicant, student, and client portal experiences." },
      { value: "portal_manager", label: "Portal Manager", description: "Manage job applications, student batches, and client document sharing." },
    ],
  },
  {
    module: "Workspace Panel",
    panel: "workspace",
    roles: [
      { value: "workspace_admin", label: "Workspace Admin", description: "Manage workspace settings, department analytics, and employee panel access." },
      { value: "workspace_member", label: "Workspace Member", description: "Access to workspace dashboard, employee self-service, and department KPIs." },
    ],
  },
];

export const ALL_KNOWN_ROLES: string[] = [
  "super_admin",
  ...ROLE_GROUPS.flatMap((g) => g.roles.map((r) => r.value)),
];

export function moduleLabelsForRoles(roles: string[]): string[] {
  if (roles.includes("super_admin")) return ["Super Admin (all modules)"];
  const labels: string[] = [];
  for (const g of ROLE_GROUPS) {
    if (g.roles.some((r) => roles.includes(r.value))) labels.push(g.module);
  }
  return labels;
}

const ROLE_LABEL_BY_VALUE: Record<string, string> = {
  super_admin: "Super Admin",
  ...Object.fromEntries(ROLE_GROUPS.flatMap((g) => g.roles.map((r) => [r.value, r.label]))),
};

export function roleLabel(value: string): string {
  return ROLE_LABEL_BY_VALUE[value] ?? value;
}

/** Each held role's own label, module-qualified when the label alone would be
 * ambiguous across modules (e.g. two modules both have a role labelled "Admin"). */
export function roleLabelsForRoles(roles: string[]): string[] {
  if (roles.includes("super_admin")) return ["Super Admin"];
  const labelCounts = new Map<string, number>();
  for (const label of Object.values(ROLE_LABEL_BY_VALUE)) {
    labelCounts.set(label, (labelCounts.get(label) ?? 0) + 1);
  }
  const out: string[] = [];
  for (const g of ROLE_GROUPS) {
    for (const r of g.roles) {
      if (!roles.includes(r.value)) continue;
      out.push((labelCounts.get(r.label) ?? 0) > 1 ? `${r.label} (${g.module})` : r.label);
    }
  }
  return out;
}
