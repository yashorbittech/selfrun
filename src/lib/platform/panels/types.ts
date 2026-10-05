import type { NavIcon } from "@/lib/workspace/nav";

/**
 * The Panel Registry: the one place the platform keeps what each panel is called, how it is described, where it lives and
 * whether it is switched on. Every listing (Workspace, onboarding, plan editors, panel headers, search, back links …)
 * reads from it; the Platform Panel (Panels) is where it is edited.
 */

export interface PanelRecord {
  /** Route segment and stable id: `hrms` → `/hrms`. */
  key: string;
  /** The one name used everywhere (listings, headers, back link, search). */
  name: string;
  /** Short label for tight spaces (chips, breadcrumbs). */
  shortName: string;
  /** The one description used everywhere. */
  description: string;
  /**
   * Other names this panel is known by in screens that still carry the old wording ("HRMS", "Standard Operating
   * Procedures"). Wherever one appears in a panel screen it is shown as the panel's current registry name instead:
   * an acronym becomes `shortName`, anything longer becomes `name`.
   */
  aliases: string[];
  /** Panel header overrides; blank = use `name` / `description`. */
  headerTitle: string;
  headerDescription: string;
  icon: NavIcon;
  route: string;
  order: number;
  /** Core panels can't be switched off (the Workspace itself). */
  core: boolean;
  /** Global switch: off = hidden and inaccessible for EVERY company. */
  active: boolean;
}

/** What the browser needs for one panel (no admin fields). */
export interface PanelMeta {
  key: string;
  name: string;
  shortName: string;
  description: string;
  headerTitle: string;
  headerDescription: string;
  icon: NavIcon;
  route: string;
  order: number;
  core: boolean;
  aliases: string[];
  /** Active globally AND not switched off for this company. */
  available: boolean;
}

/**
 * Old wording per panel (unambiguous panel names only — never a word that also names a feature, like "SEO" or "SOP").
 * These seed each panel's `aliases`; the Platform Panel can change them.
 */
const ALIASES: Record<string, string[]> = {
  hrms: ["HRMS", "Human Resource Management System"],
  pms: ["PMS", "Project Management System"],
  prms: ["PRMS", "Procurement Management System", "Procurement & Expense"],
  tms: ["TMS", "Training Management System"],
  fms: ["FMS", "Financial Management System", "Finance Management"],
  lms: ["LMS", "Lead Management System", "Lead Management"],
  messenger: ["Team Chat", "Team Messenger", "Team Communication"],
  sop: ["Standard Operating Procedures"],
  lpms: ["LPMS", "Legal & Document Automation"],
  dlms: ["DLMS"],
  ots: ["OTS", "Online Test System"],
  aibots: ["AI Bots"],
  smms: ["SMMS", "Social Media Marketing"],
  seo: ["Search Engine Optimization"],
  cms: ["Website CMS"],
  portal: ["External Portal"],
  workspace: ["Staff Hub"],
};
/** The built-in aliases for a panel key (used for registry rows saved before aliases existed). */
export const defaultAliases = (key: string): string[] => ALIASES[key] ?? [];

const P = (key: string, name: string, shortName: string, description: string, icon: NavIcon, order: number, core = false): PanelRecord => ({
  key,
  name,
  shortName,
  description,
  aliases: ALIASES[key] ?? [],
  headerTitle: "",
  headerDescription: "",
  icon,
  route: `/${key}`,
  order,
  core,
  active: true,
});

/** The starter registry written by `npm run db:seed-panels` (and used as a fallback until it has run). */
export const DEFAULT_PANELS: PanelRecord[] = [
  P("workspace", "Workspace", "Workspace", "Your panels, analytics and company settings", "dashboard", 0, true),
  P("hrms", "HR & Payroll", "HR", "Employees, attendance, leave, payroll and recruitment", "users", 10),
  P("pms", "Projects", "Projects", "Clients, projects, tasks, timesheets and costing", "projects", 20),
  P("lms", "CRM & Sales", "CRM", "Leads, pipeline, campaigns and offers", "grid", 30),
  P("fms", "Finance", "Finance", "Invoices, payments, accounting and financial reports", "finance", 40),
  P("prms", "Procurement & Assets", "Procurement", "Vendors, purchase orders, assets and expenses", "cart", 50),
  P("tms", "Training", "Training", "Programs, batches, students and certificates", "training", 60),
  P("messenger", "Team Chat", "Chat", "Channels, direct messages, meetings and calls", "chat", 70, true),
  P("sop", "SOPs & Policies", "SOPs", "Standard operating procedures and acknowledgements", "book", 80),
  P("lpms", "Legal & Documents", "Legal", "Policies, agreements, certificates and document automation", "file", 90),
  P("dlms", "Digi Locker", "Digi Locker", "Company and client documents, credentials and expiry alerts", "vault", 100),
  P("ots", "Online Tests", "Tests", "Assessments for hiring and training", "test", 110),
  P("aibots", "AI Assistants", "AI Bots", "Build, train and deploy AI bots for your team", "bot", 120),
  P("intelligence", "AI Intelligence", "Intelligence", "Ask questions about your business data", "chart", 130),
  P("smms", "Social Media", "Social", "Posts, campaigns, ads and approvals", "megaphone", 140),
  P("seo", "SEO", "SEO", "Search visibility, audits and rankings", "search", 150),
  P("cms", "Website", "Website", "Your public website, pages and content", "website", 160),
  P("portal", "Client & Student Portal", "Portal", "External portal for clients, students and applicants", "globe", 170),
  P("support", "Help & Support", "Support", "AI help, guides and requests to the platform support team", "help", 180),
  // The public website each company publishes (switching it off takes that company's public pages offline).
  { ...P("website", "Public Website", "Website", "Your company's public website, served at your domain", "globe", 190), route: "/" },
];

/**
 * Not a company panel: the Platform Panel belongs to the SaaS provider alone (it only exists on the platform owner's
 * own host and is gated by platform roles), so it is never listed in the registry or offered to companies.
 */
export const PLATFORM_ONLY_KEYS: readonly string[] = ["platform"];

export const PANEL_KEY_RE = /^[a-z][a-z0-9-]{1,29}$/;
