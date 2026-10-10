/**
 * Catalog of every fine-grained, Super-Admin-overridable capability. Mirrors
 * `role-catalog.ts`'s shape but one level more granular: where `role-catalog.ts`
 * lets a super_admin grant a whole predefined role, this lets them dial in
 * individual capabilities on top of (or instead of) that role.
 *
 * Each entry's `key` is exactly the string a module's converted predicate
 * function checks via `resolvePermission()` (see `permission-overrides.ts`) —
 * e.g. `"messenger.canPostAnnouncements"` matches `canPostAnnouncements()` in
 * `messenger-roles.ts`. Keys are added here module-by-module as each module's
 * predicates are converted (see the phased plan) — a key with no matching
 * converted predicate yet would be accepted by the UI but have no effect, so
 * only add a row once its predicate is actually override-aware.
 *
 * Deliberately excluded from every module: the coarse tier-gate functions
 * (`hasXAccess`, `hasXStaffRole`) — overrides only fine-tune capabilities for
 * someone who already clears those via an existing role; see the comment on
 * each module's `(staff)/layout.tsx`.
 */

import { SOP_PERMISSIONS, SOP_PERMISSION_KEY, SOP_PERMISSION_META } from "@/lib/sop-roles";
import { DLMS_PERMISSIONS, DLMS_PERMISSION_KEY, DLMS_PERMISSION_META } from "@/lib/dlms-roles";
import { AIBOTS_PERMISSIONS, AIBOTS_PERMISSION_KEY, AIBOTS_PERMISSION_META } from "@/lib/aibots-roles";
import { INTELLIGENCE_PERMISSIONS, INTELLIGENCE_PERMISSION_KEY, INTELLIGENCE_PERMISSION_META } from "@/lib/intelligence-roles";
import { SMMS_PERMISSIONS, SMMS_PERMISSION_KEY, SMMS_PERMISSION_META } from "@/lib/smms-roles";
import { OTS_PERMISSIONS, OTS_PERMISSION_KEY, OTS_PERMISSION_META } from "@/lib/ots-roles";
import { SEO_PERMISSIONS, SEO_PERMISSION_KEY, SEO_PERMISSION_META } from "@/lib/seo-roles";
import { CMS_PERMISSIONS, CMS_PERMISSION_KEY, CMS_PERMISSION_META } from "@/lib/cms-roles";
import { LPMS_PERMISSIONS, LPMS_PERMISSION_KEY, LPMS_PERMISSION_META } from "@/lib/lpms-roles";

export interface PermissionOption {
  key: string;
  label: string;
  description: string;
}

export interface PermissionGroup {
  module: string;
  permissions: PermissionOption[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    module: "Team Chat",
    permissions: [
      {
        key: "messenger.hasChatStaffRole",
        label: "Elevated reach",
        description: "Org-wide channel creation, moderation, and full workspace analytics.",
      },
      {
        key: "messenger.isChatAdmin",
        label: "Workspace admin actions",
        description: "Moderate any channel or message, change member roles, manage private channels.",
      },
      {
        key: "messenger.canCreateTeamChannel",
        label: "Create team channels",
        description: "Create organization-wide team channels and group chats.",
      },
      {
        key: "messenger.canPostAnnouncements",
        label: "Post announcements",
        description: "Author and publish broadcast announcements.",
      },
      {
        key: "messenger.canViewWorkspaceAnalytics",
        label: "View workspace analytics",
        description: "See the full workspace dashboard analytics, not just a personal summary.",
      },
      {
        key: "messenger.canViewAuditLog",
        label: "View audit log",
        description: "Read the Team Chat audit trail.",
      },
    ],
  },
  {
    module: "Training (TMS)",
    permissions: [
      {
        key: "tms.isTmsAdmin",
        label: "TMS admin actions",
        description: "Everything a TMS Admin can do — the broadest single grant in this module.",
      },
      {
        key: "tms.canManageTraining",
        label: "Manage training delivery",
        description: "Full delivery-operations access: programs, batches, applications, students, classes, projects.",
      },
      {
        key: "tms.canManageProgramsBatches",
        label: "Manage programs & batches",
        description: "Create, edit and archive any program or batch.",
      },
      {
        key: "tms.canManageStudents",
        label: "Manage students",
        description: "Create / edit students and move applications through the pipeline.",
      },
      {
        key: "tms.canIssueCertificates",
        label: "Issue certificates",
        description: "Issue, reissue and revoke certificates.",
      },
      {
        key: "tms.canManagePayments",
        label: "Manage payments",
        description: "Record payments, edit fee structures and view revenue analytics.",
      },
      {
        key: "tms.canManageSettings",
        label: "Manage TMS settings",
        description: "Edit categories, technology suggestions and institute identity.",
      },
      {
        key: "tms.canViewAuditLog",
        label: "View audit log",
        description: "Read the TMS audit trail.",
      },
    ],
  },
  {
    module: "HRMS",
    permissions: [
      {
        key: "hrms.canRunPayroll",
        label: "Run payroll",
        description: "Run payroll, approve runs, mark paid, download the bank file.",
      },
      {
        key: "hrms.canManageEmployeeDocuments",
        label: "Manage employee documents",
        description: "Upload, replace and delete documents on any employee.",
      },
      {
        key: "hrms.canManagePayrollConfig",
        label: "Manage payroll config",
        description: "Edit statutory payroll rates and tax configuration. Denied to every role by default — even HR.",
      },
      {
        key: "hrms.canManageEmployees",
        label: "Manage employees",
        description: "Create, edit and delete employees; change employment status.",
      },
      {
        key: "hrms.canManageMasters",
        label: "Manage master data",
        description: "Create, edit and delete departments, designations and teams.",
      },
      {
        key: "hrms.canManagePayroll",
        label: "Manage payroll data",
        description: "View and edit salary structure and bank details.",
      },
      {
        key: "hrms.canViewAllEmployees",
        label: "View all employees",
        description: "See every employee, not just the signed-in manager's reporting line.",
      },
      {
        key: "hrms.canViewAuditLog",
        label: "View audit log",
        description: "Read the HRMS audit trail. Denied to every role by default — even HR.",
      },
      {
        key: "hrms.canManageAttendance",
        label: "Manage attendance",
        description: "Record and correct attendance.",
      },
      {
        key: "hrms.canApproveLeave",
        label: "Approve leave",
        description: "File and decide leave requests.",
      },
      {
        key: "hrms.canManageHolidays",
        label: "Manage holidays",
        description: "Create, edit and delete holidays.",
      },
      {
        key: "hrms.canManageSettings",
        label: "Manage HRMS settings",
        description: "Edit the org-wide work schedule and leave-type configuration. Denied to every role by default.",
      },
    ],
  },
  {
    module: "Projects (PMS)",
    permissions: [
      {
        key: "pms.isPmsAdmin",
        label: "PMS admin actions",
        description: "Everything a PMS Admin can do — the broadest single grant in this module.",
      },
      {
        key: "pms.canViewCosting",
        label: "View costing",
        description: "View the project-costing / financial dashboards and project reports.",
      },
      {
        key: "pms.canReviewTimesheets",
        label: "Review timesheets",
        description: "Review, approve and reject submitted timesheets.",
      },
      {
        key: "pms.canManageClients",
        label: "Manage clients",
        description: "Create, edit and archive any client.",
      },
      {
        key: "pms.canManageProjects",
        label: "Manage projects",
        description: "Create, edit and delete any project, task and milestone; manage any project's team.",
      },
      {
        key: "pms.canViewAllProjects",
        label: "View all projects",
        description: "See every project, not just ones the user manages or is a member of.",
      },
      {
        key: "pms.canManageSettings",
        label: "Manage PMS settings",
        description: "Edit categories, default currency and technology suggestions.",
      },
      {
        key: "pms.canViewActivityLog",
        label: "View activity log",
        description: "Read the PMS activity log.",
      },
    ],
  },
  {
    module: "Procurement (PRMS)",
    permissions: [
      {
        key: "prms.isPrmsAdmin",
        label: "PRMS admin actions",
        description: "Everything a PRMS Admin can do — the broadest single grant in this module.",
      },
      {
        key: "prms.canManageProcurement",
        label: "Manage procurement",
        description: "Vendors, requisitions, RFQ, purchase orders, goods receipt, assets, inventory, subscriptions, contracts.",
      },
      {
        key: "prms.canManageFinance",
        label: "Manage finance",
        description: "Invoices, payments, budgets, expense approvals and financial reports.",
      },
      {
        key: "prms.canApproveRequisitions",
        label: "Approve requisitions",
        description: "Act on any level of the requisition approval chain (thresholds and per-level roles still apply).",
      },
      {
        key: "prms.canManageExpenses",
        label: "Manage expenses",
        description: "Create and approve operational expenses.",
      },
      {
        key: "prms.canManageSettings",
        label: "Manage PRMS settings",
        description: "Edit company identity, approval thresholds and category suggestions.",
      },
      {
        key: "prms.canViewAuditLog",
        label: "View audit log",
        description: "Read the PRMS audit trail.",
      },
      {
        key: "prms.canViewReports",
        label: "View reports",
        description: "View PRMS reports and analytics.",
      },
    ],
  },
  {
    module: "Finance (FMS)",
    permissions: [
      {
        key: "fms.isFmsAdmin",
        label: "FMS admin actions",
        description: "Everything a Finance Admin can do — the broadest single grant in this module.",
      },
      {
        key: "fms.canManageTransactions",
        label: "Manage transactions",
        description: "Create and edit transactions, customers-side and vendors-side financial records.",
      },
      {
        key: "fms.canApproveTransactions",
        label: "Approve transactions",
        description: "Move a transaction through pending approval to approved or rejected.",
      },
      {
        key: "fms.canManageAccounts",
        label: "Manage chart of accounts",
        description: "Create and edit Chart of Accounts entries and other FMS settings.",
      },
      {
        key: "fms.canViewAuditLog",
        label: "View audit log",
        description: "Read the FMS audit trail.",
      },
      {
        key: "fms.canReconcile",
        label: "Reconcile bank & cash",
        description: "Enter/match bank statement lines and record cash counts.",
      },
      {
        key: "fms.canManageBanking",
        label: "Manage bank & cash accounts",
        description: "Create/edit bank and cash accounts and record transfers between them.",
      },
      {
        key: "fms.canViewReports",
        label: "View reports",
        description: "View the full FMS dashboard detail and reports.",
      },
      {
        key: "fms.canManageTaxConfig",
        label: "Manage tax configuration",
        description: "Edit the tax-rate list used when entering taxable transactions and invoices.",
      },
      {
        key: "fms.canManageFiscalPeriods",
        label: "Manage fiscal periods",
        description: "Define fiscal periods and close/reopen them — closing posts a real journal entry.",
      },
    ],
  },
  {
    module: "LMS (CRM & Learning)",
    permissions: [
      {
        key: "lms.isLmsAdmin",
        label: "LMS admin actions",
        description: "Everything an LMS Admin can do — full control over leads, campaigns, and courses.",
      },
      {
        key: "lms.canManageLeads",
        label: "Manage leads & sales pipeline",
        description: "Create, edit, assign, and update status of leads across campaigns.",
      },
      {
        key: "lms.canManageCampaigns",
        label: "Manage marketing campaigns",
        description: "Create, edit, and launch marketing lead campaigns and import leads.",
      },
      {
        key: "lms.canViewAnalytics",
        label: "View sales & lead analytics",
        description: "Access conversion rates, pipeline velocity, and team performance reports.",
      },
    ],
  },
  {
    module: "External Portal",
    permissions: [
      {
        key: "portal.isPortalAdmin",
        label: "Portal admin actions",
        description: "Manage applicant, student, and client portal access and configurations.",
      },
      {
        key: "portal.canManageApplications",
        label: "Manage applications",
        description: "Review and process incoming job and training applications.",
      },
      {
        key: "portal.canManageDocuments",
        label: "Manage portal documents",
        description: "Upload and share official documents with applicants, trainees, or clients.",
      },
    ],
  },
  {
    module: "SOP Panel",
    // Derived from the SOP role model so the catalog can never drift from the
    // permissions `sopCan()` actually checks. There is no review/approve entry —
    // SOP publishing is a direct action.
    permissions: SOP_PERMISSIONS.map((p) => ({
      key: SOP_PERMISSION_KEY[p],
      label: SOP_PERMISSION_META[p].label,
      description: SOP_PERMISSION_META[p].description,
    })),
  },
  {
    module: "SEO Panel",
    // Derived from the SEO role model so the catalog can never drift from the
    // permissions `seoCan()` actually checks.
    permissions: SEO_PERMISSIONS.map((p) => ({
      key: SEO_PERMISSION_KEY[p],
      label: SEO_PERMISSION_META[p].label,
      description: SEO_PERMISSION_META[p].description,
    })),
  },
  {
    module: "Digi Locker (DLMS)",
    // Derived from the DLMS role model so the catalog can never drift from the
    // permissions `dlmsCan()` actually checks.
    permissions: DLMS_PERMISSIONS.map((p) => ({
      key: DLMS_PERMISSION_KEY[p],
      label: DLMS_PERMISSION_META[p].label,
      description: DLMS_PERMISSION_META[p].description,
    })),
  },
  {
    module: "AI Bots",
    // Derived from the AI Bots role model so the catalog can never drift from
    // the permissions `aibotsCan()` actually checks.
    permissions: AIBOTS_PERMISSIONS.map((p) => ({
      key: AIBOTS_PERMISSION_KEY[p],
      label: AIBOTS_PERMISSION_META[p].label,
      description: AIBOTS_PERMISSION_META[p].description,
    })),
  },
  {
    module: "AI Intelligence",
    // Derived from the AI Intelligence role model. Which records an answer may use
    // is decided by the person's access in each data panel, never by this.
    permissions: INTELLIGENCE_PERMISSIONS.map((p) => ({
      key: INTELLIGENCE_PERMISSION_KEY[p],
      label: INTELLIGENCE_PERMISSION_META[p].label,
      description: INTELLIGENCE_PERMISSION_META[p].description,
    })),
  },
  {
    module: "Social Media (SMMS)",
    // Derived from the SMMS role model so the catalog can never drift from
    // the permissions `smmsCan()` actually checks.
    permissions: SMMS_PERMISSIONS.map((p) => ({
      key: SMMS_PERMISSION_KEY[p],
      label: SMMS_PERMISSION_META[p].label,
      description: SMMS_PERMISSION_META[p].description,
    })),
  },
  {
    module: "Online Tests (OTS)",
    // Derived from the OTS role model so the catalog can never drift from
    // the permissions `otsCan()` actually checks.
    permissions: OTS_PERMISSIONS.map((p) => ({
      key: OTS_PERMISSION_KEY[p],
      label: OTS_PERMISSION_META[p].label,
      description: OTS_PERMISSION_META[p].description,
    })),
  },
  {
    module: "Website CMS",
    // Derived from the CMS role model so the catalog can never drift from
    // the permissions `cmsCan()` actually checks.
    permissions: CMS_PERMISSIONS.map((p) => ({
      key: CMS_PERMISSION_KEY[p],
      label: CMS_PERMISSION_META[p].label,
      description: CMS_PERMISSION_META[p].description,
    })),
  },
  {
    module: "Workspace Panel",
    permissions: [
      {
        key: "workspace.isWorkspaceAdmin",
        label: "Workspace admin actions",
        description: "Manage workspace panels, employee access rights, and executive dashboards.",
      },
      {
        key: "workspace.canViewAnalytics",
        label: "View workspace analytics",
        description: "Access cross-department analytics, team metrics, and workspace KPIs.",
      },
      {
        key: "workspace.canManageWorkspace",
        label: "Manage workspace configuration",
        description: "Customize employee workspace layout, widgets, and navigation permissions.",
      },
    ],
  },
  {
    // Company-wide management pages of the Workspace (`workspace/nav.ts` →
    // MANAGE_PERMISSIONS). Super Admins hold all of them; granting one here
    // opens that page, its actions and its exports to the person.
    module: "Workspace management",
    permissions: [
      { key: "workspace.viewCommandCenter", label: "Command Center", description: "The executive dashboard and the full company-wide panel analytics." },
      { key: "workspace.manageUsers", label: "Manage users & roles", description: "Create accounts, assign panel roles, reset passwords, deactivate. Cannot grant Super Admin or change permissions." },
      { key: "workspace.viewAuditLog", label: "View the audit log", description: "The cross-panel audit trail and its export." },
      { key: "workspace.manageDocuments", label: "Manage documents", description: "The company documents register across panels." },
      { key: "workspace.manageCrm", label: "Manage CRM records", description: "Company-wide leads and clients registers." },
      { key: "workspace.manageProjects", label: "Manage project records", description: "Company-wide projects, tasks, milestones and timesheets registers." },
      { key: "workspace.manageProcurement", label: "Manage procurement records", description: "Company-wide vendors, purchase orders, invoices, payments, expenses, assets and inventory registers." },
      { key: "workspace.manageTraining", label: "Manage training records", description: "Company-wide programs, batches, students, certificates and fee payments registers." },
      { key: "workspace.manageChat", label: "Manage team chat", description: "Channels, direct conversations and meetings registers." },
      { key: "workspace.managePortalUsers", label: "Manage portal users", description: "External portal accounts: status and forced sign-out." },
      { key: "workspace.manageCareers", label: "Manage job applicants", description: "Applicants register, statuses and resumes." },
      { key: "workspace.manageChatbot", label: "Manage chatbot conversations", description: "Website chatbot and voice conversation transcripts." },
    ],
  },
  {
    module: 'LPMS (Legal & Documents)',
    permissions: LPMS_PERMISSIONS.map((p) => ({
      key: LPMS_PERMISSION_KEY[p],
      label: LPMS_PERMISSION_META[p].label,
      description: LPMS_PERMISSION_META[p].description,
    })),
  },
];

export const ALL_PERMISSION_KEYS: string[] = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key));

export function permissionLabel(key: string): string {
  for (const g of PERMISSION_GROUPS) {
    const found = g.permissions.find((p) => p.key === key);
    if (found) return found.label;
  }
  return key;
}
