/**
 * The Workspace navigation — the one definition of what a company's Workspace
 * contains and who may open each part. Pure data + pure rules (safe to import
 * anywhere); the server side that loads a user's context and guards pages is
 * `access.ts`.
 *
 * An item is available when ALL of these hold:
 *   1. `allow(user)` — a rule built from the existing role files
 *      (`*-roles.ts`) and the permission catalog (`permissionOverrides`,
 *      resolved by `resolvePermission`). No new role model lives here.
 *   2. `module` (when set) is in the company's plan and switched on.
 *   3. `platform` items: the Platform Panel's own access check passed.
 *
 * A panel that the user's roles allow but the plan doesn't include is returned
 * as `locked` (the Staff Hub shows it as an upgrade tile); it is not accessible.
 */
import { normalizeRoles } from "@/lib/hrms-roles";
import { normalizePmsRoles } from "@/lib/pms-roles";
import { normalizePrmsRoles } from "@/lib/prms-roles";
import { normalizeTmsRoles } from "@/lib/tms-roles";
import { normalizeFmsRoles } from "@/lib/fms-roles";
import { normalizeChatRoles } from "@/lib/messenger-roles";
import { hasAdminAccess } from "@/lib/admin-roles";
import { hasSopAccess, sopCan } from "@/lib/sop-roles";
import { hasLpmsAccess, isLpmsManagerTier, lpmsCan } from "@/lib/lpms-roles";
import { hasSeoAccess, seoCan } from "@/lib/seo-roles";
import { hasDlmsAccess, isDlmsManagerTier } from "@/lib/dlms-roles";
import { hasAibotsAccess, isAibotsManagerTier } from "@/lib/aibots-roles";
import { hasIntelligenceAccess } from "@/lib/intelligence-roles";
import { hasSmmsAccess, smmsCan } from "@/lib/smms-roles";
import { hasOtsAccess, otsCan } from "@/lib/ots-roles";
import { cmsCan, hasCmsAccess } from "@/lib/cms-roles";
import { canViewLmsAnalytics } from "@/lib/lms-roles";
import { canViewWorkspaceAnalytics } from "@/lib/workspace-roles";
import { resolvePermission, type RoleContext } from "@/lib/permission-overrides";

export type NavSectionKey = "dashboard" | "panels" | "analytics" | "manage" | "company" | "account" | "platform";

export type NavIcon =
  | "dashboard"
  | "users"
  | "projects"
  | "cart"
  | "training"
  | "finance"
  | "book"
  | "search"
  | "vault"
  | "bot"
  | "megaphone"
  | "test"
  | "chat"
  | "grid"
  | "website"
  | "shield"
  | "chart"
  | "globe"
  | "building"
  | "card"
  | "receipt"
  | "gauge"
  | "palette"
  | "bank"
  | "plug"
  | "zap"
  | "upload"
  | "history"
  | "lock"
  | "bell"
  | "key"
  | "file"
  | "platform"
  | "help";

interface NavItemDef {
  key: string;
  section: NavSectionKey;
  /** Sidebar label. */
  label: string;
  /** Card title on the settings hub, when it differs from the sidebar label. */
  title?: string;
  description?: string;
  href: string;
  icon: NavIcon;
  /** Sub-heading inside a section (Company admin). */
  group?: string;
  /** Panel key (`onboarding/catalog.ts` MODULES): must be in the plan and switched on. */
  module?: string;
  /** Panel Registry key for items that aren't plan-gated modules (e.g. Help & Support). */
  panel?: string;
  /** Opens in a new tab (panels have their own shell). */
  external?: boolean;
  /** Needs the Platform Panel access check instead of a company role. */
  platform?: boolean;
  allow: (user: RoleContext) => boolean;
}

const anyone = () => true;
/** `super_admin` only (`admin-roles.ts`) — what every company-settings page (`/workspace/settings/*`) checks. */
const superAdmin = (u: RoleContext) => hasAdminAccess(u.roles);
const has = (normalize: (roles: unknown) => unknown[]) => (u: RoleContext) => normalize([...u.roles]).length > 0;
const orAdmin = (rule: (u: RoleContext) => boolean) => (u: RoleContext) => superAdmin(u) || rule(u);

// ── Panels: the same role test each panel's own sign-in uses ────────────────
const PANELS: NavItemDef[] = (
  [
    ["hrms", "Human Resources", "users", has(normalizeRoles)],
    ["pms", "Projects", "projects", has(normalizePmsRoles)],
    ["lms", "CRM & Leads", "grid", anyone], // the CRM has no role gate (see role-catalog.ts)
    ["fms", "Finance", "finance", has(normalizeFmsRoles)],
    ["prms", "Procurement & Expenses", "cart", has(normalizePrmsRoles)],
    ["tms", "Training", "training", has(normalizeTmsRoles)],
    ["messenger", "Team Chat", "chat", has(normalizeChatRoles)],
    ["sop", "SOP Library", "book", (u) => hasSopAccess(u.roles)],
    ["lpms", "Legal & Documents", "file", (u) => hasLpmsAccess(u.roles)],
    ["dlms", "Digi Locker", "vault", (u) => hasDlmsAccess(u.roles)],
    ["ots", "Online Tests", "test", (u) => hasOtsAccess(u.roles)],
    ["aibots", "AI Bots", "bot", (u) => hasAibotsAccess(u.roles)],
    ["intelligence", "AI Intelligence", "chart", (u) => hasIntelligenceAccess(u.roles)],
    ["smms", "Social Media", "megaphone", (u) => hasSmmsAccess(u.roles)],
    ["seo", "SEO", "search", (u) => hasSeoAccess(u.roles)],
    ["cms", "Website", "website", (u) => hasCmsAccess(u.roles)],
  ] as [string, string, NavIcon, NavItemDef["allow"]][]
).map(([key, label, icon, allow]) => ({ key: `panel.${key}`, section: "panels", label, href: `/${key}`, icon, module: key, allow }));

// ── Analytics: /workspace/analytics/[panel] ─────────────────────────────────
// Each page shows COMPANY-WIDE numbers, so a panel whose own screens are scoped
// per person (SOP readers, Digi Locker and AI Bots users, test takers) opens its
// analytics only to the people who already see the whole panel: its report /
// analytics permission where it has one, otherwise its see-everything tier.
const ANALYTICS: NavItemDef[] = (
  [
    ["aibots", "AI Bots Analytics", "bot", (u) => hasAibotsAccess(u.roles) && isAibotsManagerTier(u)],
    ["cms", "Website Analytics", "website", (u) => hasCmsAccess(u.roles) && cmsCan(u, "VIEW")],
    ["dlms", "Digi Locker Analytics", "vault", (u) => hasDlmsAccess(u.roles) && isDlmsManagerTier(u)],
    ["fms", "Finance Analytics", "finance", orAdmin(has(normalizeFmsRoles))],
    ["hrms", "HR Analytics", "users", orAdmin(has(normalizeRoles))],
    ["lms", "Lead Analytics", "grid", canViewLmsAnalytics],
    ["messenger", "Messenger Analytics", "chat", orAdmin(has(normalizeChatRoles))],
    ["ots", "Online Tests Analytics", "test", (u) => hasOtsAccess(u.roles) && otsCan(u, "VIEW_REPORTS")],
    ["pms", "Project Analytics", "projects", orAdmin(has(normalizePmsRoles))],
    ["portal", "Portal Analytics", "globe", (u) => resolvePermission(u, "portal.isPortalAdmin", () => u.roles.includes("portal_admin"))],
    ["prms", "Procurement Analytics", "cart", orAdmin(has(normalizePrmsRoles))],
    ["seo", "SEO Analytics", "search", (u) => hasSeoAccess(u.roles) && seoCan(u, "VIEW")],
    ["smms", "Social Media Analytics", "megaphone", (u) => hasSmmsAccess(u.roles) && smmsCan(u, "VIEW_ANALYTICS")],
    ["sop", "SOP Analytics", "book", (u) => hasSopAccess(u.roles) && sopCan(u, "EXPORT")],
    ['lpms', 'LPMS Analytics', 'file', (u) => hasLpmsAccess(u.roles) && isLpmsManagerTier(u)],
    ["tms", "Training Analytics", "training", orAdmin(has(normalizeTmsRoles))],
    ["workspace", "Workspace Analytics", "chart", canViewWorkspaceAnalytics],
  ] as [string, string, NavIcon, NavItemDef["allow"]][]
).map(([key, label, icon, allow]) => ({
  key: `analytics.${key}`,
  section: "analytics",
  label,
  href: `/workspace/analytics/${key}`,
  icon,
  module: key,
  // The Command Center permission includes every panel's (full) analytics.
  allow: (u: RoleContext) => canViewCommandCenter(u) || allow(u),
}));

// ── Management: the company-wide registers (formerly the separate admin panel) ──
/**
 * Company-management capabilities, in the permission catalog
 * (`permission-catalog.ts`, group "Workspace management"). `super_admin`
 * holds all of them; nobody else does by default, and a Super Admin can grant
 * any single one to a person through permission overrides in Users & roles.
 */
export const MANAGE_PERMISSIONS = {
  commandCenter: "workspace.viewCommandCenter",
  users: "workspace.manageUsers",
  auditLog: "workspace.viewAuditLog",
  documents: "workspace.manageDocuments",
  crm: "workspace.manageCrm",
  projects: "workspace.manageProjects",
  procurement: "workspace.manageProcurement",
  training: "workspace.manageTraining",
  chat: "workspace.manageChat",
  portalUsers: "workspace.managePortalUsers",
  careers: "workspace.manageCareers",
  chatbot: "workspace.manageChatbot",
} as const;
const may = (permission: string) => (u: RoleContext) => resolvePermission(u, permission, () => false);

/**
 * The executive sections of the dashboard (`/workspace`: financial position,
 * KPIs by area, panel performance) — the former Command Center. Not a nav item
 * any more (the dashboard is one page for everybody), so this is the one rule
 * every caller asks: the dashboard loader, the analytics pages, the bell.
 */
export const canViewCommandCenter = (u: RoleContext): boolean => may(MANAGE_PERMISSIONS.commandCenter)(u);

/** Who may open the Audit log page, and which of its two sources each reader gets. */
export const canViewAuditLog = (u: RoleContext): boolean => may(MANAGE_PERMISSIONS.auditLog)(u);
/** Workspace events (`platform_events`, the event bus) — company Super Admin only, as `/settings/activity` always was. */
export const canViewWorkspaceEvents = (u: RoleContext): boolean => superAdmin(u);

const P = MANAGE_PERMISSIONS;
const MANAGE_PAGES: [group: string, path: string, label: string, icon: NavIcon, permission: string, module?: string][] = [
  ["CRM", "crm/leads", "Leads", "grid", P.crm, "lms"],
  ["CRM", "crm/clients", "Clients", "grid", P.crm, "pms"],
  ["Projects", "pms/projects", "Projects", "projects", P.projects, "pms"],
  ["Projects", "pms/tasks", "Tasks", "projects", P.projects, "pms"],
  ["Projects", "pms/milestones", "Milestones", "projects", P.projects, "pms"],
  ["Projects", "pms/timesheets", "Timesheets", "projects", P.projects, "pms"],
  ["Procurement", "prms/vendors", "Vendors", "cart", P.procurement, "prms"],
  ["Procurement", "prms/requisitions", "Requisitions", "cart", P.procurement, "prms"],
  ["Procurement", "prms/rfqs", "RFQs", "cart", P.procurement, "prms"],
  ["Procurement", "prms/purchase-orders", "Purchase orders", "cart", P.procurement, "prms"],
  ["Procurement", "prms/invoices", "Vendor invoices", "cart", P.procurement, "prms"],
  ["Procurement", "prms/payments", "Vendor payments", "cart", P.procurement, "prms"],
  ["Procurement", "prms/expenses", "Expenses", "cart", P.procurement, "prms"],
  ["Procurement", "prms/assets", "Assets", "cart", P.procurement, "prms"],
  ["Procurement", "prms/inventory", "Inventory", "cart", P.procurement, "prms"],
  ["Procurement", "prms/infrastructure", "Infrastructure", "cart", P.procurement, "prms"],
  ["Procurement", "prms/subscriptions", "Software subscriptions", "cart", P.procurement, "prms"],
  ["Training", "tms/programs", "Programs", "training", P.training, "tms"],
  ["Training", "tms/batches", "Batches", "training", P.training, "tms"],
  ["Training", "tms/students", "Students", "training", P.training, "tms"],
  ["Training", "tms/certificates", "Certificates", "training", P.training, "tms"],
  ["Training", "tms/payments", "Fee payments", "training", P.training, "tms"],
  ["Team chat", "teamchat/channels", "Channels", "chat", P.chat, "messenger"],
  ["Team chat", "teamchat/direct-messages", "Direct messages", "chat", P.chat, "messenger"],
  ["Team chat", "teamchat/meetings", "Meetings", "chat", P.chat, "messenger"],
  ["People", "portal/users", "Portal users", "users", P.portalUsers, "portal"],
  ["People", "careers/applicants", "Job applicants", "users", P.careers],
  ["Website chatbot", "chatbot/conversations", "Conversations", "bot", P.chatbot],
  ["Website chatbot", "chatbot/voice-conversations", "Voice conversations", "bot", P.chatbot],
];
/** Management groups that ARE a panel: their heading is that panel's Panel Registry name. */
const GROUP_PANEL: Record<string, string> = { CRM: "lms", Projects: "pms", Procurement: "prms", Training: "tms", "Team chat": "messenger" };

const MANAGE: NavItemDef[] = MANAGE_PAGES.map(([group, path, label, icon, permission, module]) => ({
  key: `manage.${path.replace(/\//g, ".")}`,
  section: "manage",
  group,
  label,
  href: `/workspace/${path}`,
  icon,
  module,
  allow: may(permission),
}));

// ── Company: the company managing itself ────────────────────────────────────
const COMPANY_GROUPS: Record<string, string> = {
  setup: "Organization", profile: "Organization", users: "Organization",
  billing: "Billing & plan", invoices: "Billing & plan", usage: "Billing & plan",
  branding: "Branding & domains", domains: "Branding & domains",
  payments: "Connections & automation", integrations: "Connections & automation", automations: "Connections & automation", import: "Connections & automation",
  audit: "Security & logs", security: "Security & logs",
};
const company = (key: string, href: string, icon: NavIcon, label: string, description: string, title?: string): NavItemDef => ({ key: `company.${key}`, section: "company", group: COMPANY_GROUPS[key], label, title, description, href, icon, allow: superAdmin });
const COMPANY: NavItemDef[] = [
  company("setup", "/workspace/onboarding", "building", "Company setup", "Profile, departments, invitations and which panels your team uses."),
  company("profile", "/workspace/settings/profile", "building", "Organization profile", "Company name, legal name, industry, country, currency, time zone and contact details."),
  { ...company("users", "/workspace/users", "users", "Users, roles & seats", "Who can sign in, which panels and permissions each person has, and seats used.", "Users & roles"), allow: may(P.users) },
  company("billing", "/workspace/settings/billing", "card", "Plan & billing", "Your plan, payments, coupon codes and GST billing details."),
  company("invoices", "/workspace/settings/billing/invoices", "receipt", "Invoices & payments", "Tax invoices, credit notes and every payment made for your subscription."),
  company("usage", "/workspace/settings/usage", "gauge", "Usage", "Seats, AI tokens and file storage used against your plan's limits."),
  company("branding", "/workspace/settings/branding", "palette", "Branding", "Logo, name and colour across panels, emails and PDFs."),
  company("domains", "/workspace/settings/domains", "globe", "Custom domains", "Your workspace address and your own custom domains, with automatic SSL.", "Domains"),
  company("payments", "/workspace/settings/payments", "bank", "Payment account", "Connect your own Razorpay account to collect invoice payments and pay salaries.", "Payments & payouts"),
  company("integrations", "/workspace/settings/integrations", "plug", "Integrations", "What your workspace is connected to: payment gateway, webhooks and your own domain."),
  company("automations", "/workspace/settings/automations", "zap", "Automations", "When something happens, notify people, send an email or call a webhook."),
  company("import", "/workspace/settings/import", "upload", "Import data", "Bring leads, clients and employees in from CSV files."),
  {
    ...company("audit", "/workspace/settings/audit-log", "history", "Audit log", "Who did what across your workspace and its panels, and when: workspace events and panel activity in one place."),
    // Same rule as the old Management → Activity log; the Super Admin's workspace events source is checked on the page itself.
    allow: canViewAuditLog,
  },
  company("security", "/workspace/settings/security", "lock", "Security", "Your sign-in, password, active sessions and accounts that need attention."),
];

const NAV_ITEMS: NavItemDef[] = [
  { key: "dashboard", section: "dashboard", label: "Dashboard", href: "/workspace", icon: "dashboard", allow: anyone },
  ...PANELS,
  // Help & Support is the platform's own service for every company: no role gate and no plan module.
  { key: "panel.support", section: "panels", label: "Help & Support", href: "/support", icon: "help", panel: "support", allow: anyone },
  // The external portal and the company's public website are panels in the registry too, so they are listed like the rest.
  { key: "panel.portal", section: "panels", label: "Client & Student Portal", href: "/portal", icon: "globe", module: "portal", allow: (u: RoleContext) => resolvePermission(u, "portal.isPortalAdmin", () => u.roles.includes("portal_admin")) },
  { key: "panel.website", section: "panels", label: "Public Website", href: "/", icon: "website", panel: "website", external: true, allow: anyone },
  ...ANALYTICS,
  ...MANAGE,
  ...COMPANY,
  { key: "account.documents", section: "account", label: "Documents", description: "Documents uploaded across Projects, HR and the External Portal.", href: "/workspace/account/documents", icon: "file", allow: may(P.documents) },
  { key: "account.notifications", section: "account", label: "Notifications", href: "/workspace/notifications", icon: "bell", allow: anyone },
  { key: "account.password", section: "account", label: "Change Password", href: "/workspace/change-password", icon: "key", allow: anyone },
  {
    key: "platform.panel",
    section: "platform",
    label: "Platform Panel",
    description: "The SaaS control centre: companies, sign-ups, plans, billing, tax and platform settings.",
    href: "/platform",
    icon: "platform",
    platform: true,
    allow: anyone,
  },
];

export const NAV_SECTIONS: { key: NavSectionKey; label: string; href?: string; /** `false`: resolved and guarded like any section, but not listed in the sidebar. */ sidebar?: boolean }[] = [
  { key: "dashboard", label: "" },
  // The panels are opened from the Staff Hub tiles (which also show the locked ones), not from the sidebar.
  { key: "panels", label: "Panels", sidebar: false },
  { key: "analytics", label: "Analytics", sidebar: false },
  { key: "manage", label: "Management", sidebar: false },
  { key: "company", label: "Company", href: "/workspace/settings" },
  { key: "account", label: "Account", sidebar: false },
  { key: "platform", label: "Platform", sidebar: false },
];

export const NAV_KEYS: string[] = NAV_ITEMS.map((i) => i.key);

/** Everything a rule may look at. Loaded on the server by `access.ts`. */
export interface NavContext {
  user: RoleContext;
  /** Panels in the company's plan; `null` = every panel (unlimited plan, platform owner). */
  planModules: ReadonlySet<string> | null;
  /** Panels the company switched on; `null` = no choice recorded → all on. */
  enabledModules: ReadonlySet<string> | null;
  /** Result of the Platform Panel's own access check (owner company + platform role). */
  platformAccess: boolean;
  /** Panels the platform switched off (for everyone, or for this company): their items are hidden. */
  unavailablePanels?: ReadonlySet<string>;
  /** Panel Registry names / descriptions, so every listing says the same thing. */
  panels?: Readonly<Record<string, { name: string; description: string }>>;
}

export type NavState = "open" | "locked" | "hidden";

function stateOf(item: NavItemDef, ctx: NavContext): NavState {
  if (item.platform) return ctx.platformAccess ? "open" : "hidden";
  if (!item.allow(ctx.user)) return "hidden";
  const panelKey = item.module ?? item.panel;
  if (panelKey && ctx.unavailablePanels?.has(panelKey)) return "hidden";
  if (item.module) {
    if (ctx.enabledModules && !ctx.enabledModules.has(item.module)) return "hidden";
    if (ctx.planModules && !ctx.planModules.has(item.module)) return item.section === "panels" ? "locked" : "hidden";
  }
  return "open";
}

/** Serialisable — handed to the client sidebar. */
export interface NavItem {
  key: string;
  label: string;
  title: string;
  description: string | null;
  href: string;
  icon: NavIcon;
  group: string | null;
  external: boolean;
}

export interface NavSection {
  key: NavSectionKey;
  label: string;
  href: string | null;
  /** Whether the sidebar lists this section (the Panels section is reached from the Staff Hub tiles instead). */
  sidebar: boolean;
  items: NavItem[];
}

export interface ResolvedNav {
  /** Sections with at least one item the user may open, in display order. */
  sections: NavSection[];
  /** Keys of every item the user may open. */
  allowed: string[];
  /** Panel keys (e.g. "fms") the user's roles allow but the plan doesn't include. */
  lockedPanels: string[];
}

/** Pure: what `ctx` may open. */
export function resolveNav(ctx: NavContext): ResolvedNav {
  const open: NavItemDef[] = [];
  const lockedPanels: string[] = [];
  for (const item of NAV_ITEMS) {
    const state = stateOf(item, ctx);
    if (state === "open") open.push(item);
    else if (state === "locked" && item.module) lockedPanels.push(item.module);
  }
  const sections = NAV_SECTIONS.map((s) => ({
    key: s.key,
    label: s.label,
    href: s.href ?? null,
    sidebar: s.sidebar !== false,
    items: open
      .filter((i) => i.section === s.key)
      .map((i) => {
        // Panel tiles and analytics entries take their name / description from the Panel Registry.
        const meta = ctx.panels?.[i.module ?? i.panel ?? ""];
        const named = meta && i.section === "panels" ? meta.name : meta && i.section === "analytics" ? `${meta.name} Analytics` : null;
        const label = named ?? i.label;
        const description = meta && i.section === "panels" ? meta.description : (i.description ?? null);
        return { key: i.key, label, title: named ?? i.title ?? i.label, description, href: i.href, icon: i.icon, group: (i.group && ctx.panels?.[GROUP_PANEL[i.group] ?? ""]?.name) || i.group || null, external: i.external === true };
      }),
  })).filter((s) => s.items.length > 0);
  return { sections, allowed: open.map((i) => i.key), lockedPanels };
}

/** Pure: may `ctx` open the item `key`? Unknown keys are refused. */
export function navAllows(ctx: NavContext, key: string): boolean {
  const item = NAV_ITEMS.find((i) => i.key === key);
  return item ? stateOf(item, ctx) === "open" : false;
}
