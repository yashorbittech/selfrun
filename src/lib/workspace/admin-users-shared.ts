import { normalizeAdminRoles } from "@/lib/admin-roles";
import { normalizeRoles } from "@/lib/hrms-roles";
import { normalizePmsRoles } from "@/lib/pms-roles";
import { normalizePrmsRoles } from "@/lib/prms-roles";
import { normalizeFmsRoles } from "@/lib/fms-roles";
import { effectiveSopRoles, hasSopAccess } from "@/lib/sop-roles";
import { normalizeSeoRoles } from "@/lib/seo-roles";
import { normalizeDlmsRoles } from "@/lib/dlms-roles";
import { normalizeAibotsRoles } from "@/lib/aibots-roles";
import { normalizeIntelligenceRoles } from "@/lib/intelligence-roles";
import { normalizeSmmsRoles } from "@/lib/smms-roles";
import { effectiveOtsRoles, hasOtsAccess } from "@/lib/ots-roles";
import { normalizeTmsRoles } from "@/lib/tms-roles";
import { normalizeChatRoles } from "@/lib/messenger-roles";
import { normalizeLmsRoles } from "@/lib/lms-roles";
import { normalizeWorkspaceRoles } from "@/lib/workspace-roles";

export interface AdminUserRow {
  _id: string;
  email: string;
  roles: string[];
  permissionOverrides: Record<string, boolean>;
  employeeId: string | null;
  mustChangePassword: boolean;
  locked: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  status: "active" | "deactivated";
  savedRoles: string[];
  userType: "employee" | "contractor" | "partner" | "system";
  notes: string;
}

export interface PanelAccessSummaryItem {
  key: string;
  name: string;
  hasAccess: boolean;
  roles: string[];
  isSuperAdmin: boolean;
}

export function getPanelAccessSummary(user: AdminUserRow): PanelAccessSummaryItem[] {
  const roles = user.roles;
  const isSuperAdmin = roles.includes("super_admin");

  return [
    {
      key: "admin",
      name: "Super Admin Panel",
      hasAccess: isSuperAdmin || normalizeAdminRoles(roles).length > 0,
      roles: normalizeAdminRoles(roles),
      isSuperAdmin,
    },
    {
      key: "hrms",
      name: "HRMS Panel",
      hasAccess: isSuperAdmin || normalizeRoles(roles).length > 0,
      roles: normalizeRoles(roles),
      isSuperAdmin,
    },
    {
      key: "pms",
      name: "PMS Panel",
      hasAccess: isSuperAdmin || normalizePmsRoles(roles).length > 0,
      roles: normalizePmsRoles(roles),
      isSuperAdmin,
    },
    {
      key: "prms",
      name: "PRMS Panel",
      hasAccess: isSuperAdmin || normalizePrmsRoles(roles).length > 0,
      roles: normalizePrmsRoles(roles),
      isSuperAdmin,
    },
    {
      key: "tms",
      name: "TMS Panel",
      hasAccess: isSuperAdmin || normalizeTmsRoles(roles).length > 0,
      roles: normalizeTmsRoles(roles),
      isSuperAdmin,
    },
    {
      key: "fms",
      name: "FMS Panel",
      hasAccess: isSuperAdmin || normalizeFmsRoles(roles).length > 0,
      roles: normalizeFmsRoles(roles),
      isSuperAdmin,
    },
    {
      key: "sop",
      name: "SOP Panel",
      hasAccess: isSuperAdmin || hasSopAccess(roles),
      // Explicit sop_* roles plus what the account's HRMS role implies (employee → reader, manager/hr → manager).
      roles: effectiveSopRoles(roles),
      isSuperAdmin,
    },
    {
      key: "seo",
      name: "SEO Panel",
      hasAccess: isSuperAdmin || normalizeSeoRoles(roles).length > 0,
      roles: normalizeSeoRoles(roles),
      isSuperAdmin,
    },
    {
      key: "dlms",
      name: "Digi Locker (DLMS)",
      hasAccess: isSuperAdmin || normalizeDlmsRoles(roles).length > 0,
      roles: normalizeDlmsRoles(roles),
      isSuperAdmin,
    },
    {
      key: "aibots",
      name: "AI Bots",
      hasAccess: isSuperAdmin || normalizeAibotsRoles(roles).length > 0,
      roles: normalizeAibotsRoles(roles),
      isSuperAdmin,
    },
    {
      key: "intelligence",
      name: "AI Intelligence",
      hasAccess: isSuperAdmin || normalizeIntelligenceRoles(roles).length > 0,
      roles: normalizeIntelligenceRoles(roles),
      isSuperAdmin,
    },
    {
      key: "smms",
      name: "Social Media (SMMS)",
      hasAccess: isSuperAdmin || normalizeSmmsRoles(roles).length > 0,
      roles: normalizeSmmsRoles(roles),
      isSuperAdmin,
    },
    {
      key: "ots",
      name: "Online Tests (OTS)",
      hasAccess: isSuperAdmin || hasOtsAccess(roles),
      // Explicit ots_* roles plus what HRMS / TMS roles imply (employee → test taker, hr / TMS admin → manager, mentor → evaluator).
      roles: effectiveOtsRoles(roles),
      isSuperAdmin,
    },
    {
      key: "messenger",
      name: "Messenger Panel",
      hasAccess: isSuperAdmin || normalizeChatRoles(roles).length > 0,
      roles: normalizeChatRoles(roles),
      isSuperAdmin,
    },
    {
      key: "lms",
      name: "LMS Panel",
      hasAccess: isSuperAdmin || normalizeLmsRoles(roles).length > 0 || user.status === "active",
      roles: normalizeLmsRoles(roles).length > 0
        ? normalizeLmsRoles(roles)
        : (user.status === "active" ? ["lms_user"] : []),
      isSuperAdmin,
    },
    {
      key: "portal",
      name: "External Portal",
      hasAccess: isSuperAdmin || roles.some((r) => r.startsWith("portal_")),
      roles: roles.filter((r) => r.startsWith("portal_")),
      isSuperAdmin,
    },
    {
      key: "workspace",
      name: "Workspace Panel",
      hasAccess: isSuperAdmin || normalizeWorkspaceRoles(roles).length > 0 || user.status === "active",
      roles: normalizeWorkspaceRoles(roles).length > 0
        ? normalizeWorkspaceRoles(roles)
        : (user.status === "active" ? ["workspace_member"] : []),
      isSuperAdmin,
    },
  ];
}
