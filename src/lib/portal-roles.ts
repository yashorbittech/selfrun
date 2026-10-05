/**
 * External User Portal (`/portal`) role model. Unlike the internal panels, portal
 * users live in their **own** `external_users` collection — never `admin_users` —
 * and each account has exactly one role that decides which of the four completely
 * separate portal experiences they get.
 *
 * The whole portal UI (sidebar, dashboard, available modules) is generated from
 * `PORTAL_NAV` + the dashboard switch — there is no shared screen with hidden
 * sections.
 */

export const PORTAL_ROLES = ["job_applicant", "intern", "trainee", "client"] as const;
export type PortalRole = (typeof PORTAL_ROLES)[number];

export const PORTAL_ROLE_META: Record<PortalRole, { label: string; portalName: string; description: string }> = {
  job_applicant: {
    label: "Job Applicant",
    portalName: "Applicant Portal",
    description: "Track your application status, hiring progress, interviews and offer.",
  },
  intern: {
    label: "Intern",
    portalName: "Internship Portal",
    description: "Your internship progress, mentor, batch, projects, assignments, attendance and certificate.",
  },
  trainee: {
    label: "Trainee",
    portalName: "Industrial Training Portal",
    description: "Your training program, classes, mentor, attendance, projects, certificates and fees.",
  },
  client: {
    label: "Client",
    portalName: "Client Portal",
    description: "Your projects, milestones, meetings, shared documents and invoice summary.",
  },
};

export function isPortalRole(v: unknown): v is PortalRole {
  return typeof v === "string" && (PORTAL_ROLES as readonly string[]).includes(v);
}

/** Both learner roles share the same module set (differ only in dashboard layout + labels). */
export function isLearner(role: PortalRole): boolean {
  return role === "intern" || role === "trainee";
}

// ---------------------------------------------------------------------------
// Dynamic navigation — the sidebar is `PORTAL_NAV[user.role]`, nothing else.
// `icon` is a lucide-react icon name resolved in `PortalSidebar`.
// ---------------------------------------------------------------------------

export interface PortalNavItem {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
  /** Sidebar category label. Items with the same `group` sit under one heading (like the other panels); no group = top-level. */
  group?: string;
}

const inGroup = (group: string, items: PortalNavItem[]): PortalNavItem[] => items.map((i) => ({ ...i, group }));

const DASHBOARD: PortalNavItem = { href: "/portal", label: "Dashboard", icon: "LayoutDashboard", exact: true };

const OVERVIEW_NAV = inGroup("Overview", [
  { href: "/portal/journey", label: "My Journey", icon: "Route" },
  { href: "/portal/messages", label: "Messages", icon: "MessagesSquare" },
]);

const REWARDS_NAV = inGroup("Rewards", [
  { href: "/portal/referrals", label: "Refer & Earn", icon: "Gift" },
  { href: "/portal/rewards/daily", label: "Daily Rewards", icon: "Flame" },
  { href: "/portal/rewards/journey", label: "Journey Rewards", icon: "Trophy" },
  { href: "/portal/rewards/tasks", label: "Bonus Tasks", icon: "ListChecks" },
]);

const ACCOUNT_NAV = inGroup("Account", [
  { href: "/portal/documents", label: "Documents", icon: "FolderOpen" },
  { href: "/portal/profile", label: "Profile", icon: "CircleUser" },
]);

const WALLET_ITEM: PortalNavItem = { href: "/portal/wallet", label: "Wallet", icon: "Coins" };

function learnerNav(programLabel: string, scheduleLabel: string): PortalNavItem[] {
  return [
    DASHBOARD,
    ...OVERVIEW_NAV,
    ...inGroup("Learning", [
      { href: "/portal/program", label: programLabel, icon: "GraduationCap" },
      { href: "/portal/schedule", label: scheduleLabel, icon: "CalendarClock" },
      { href: "/portal/projects", label: "Projects", icon: "FolderKanban" },
      { href: "/portal/assignments", label: "Assignments", icon: "ClipboardList" },
      { href: "/portal/tests", label: "Tests & Exams", icon: "FileCheck2" },
      { href: "/portal/attendance", label: "Attendance", icon: "CalendarCheck" },
      { href: "/portal/certificates", label: "Certificates", icon: "Award" },
    ]),
    ...inGroup("Finance", [{ href: "/portal/payments", label: "Payments", icon: "Wallet" }, WALLET_ITEM]),
    ...REWARDS_NAV,
    ...ACCOUNT_NAV,
  ];
}

export const PORTAL_NAV: Record<PortalRole, PortalNavItem[]> = {
  job_applicant: [
    DASHBOARD,
    ...OVERVIEW_NAV,
    ...inGroup("Recruitment", [
      { href: "/portal/application", label: "My Application", icon: "FileText" },
      { href: "/portal/interviews", label: "Interview Schedule", icon: "CalendarClock" },
      { href: "/portal/tests", label: "Assessments", icon: "FileCheck2" },
    ]),
    ...inGroup("Finance", [WALLET_ITEM]),
    ...REWARDS_NAV,
    ...ACCOUNT_NAV,
  ],
  intern: learnerNav("My Internship", "Batch Schedule"),
  trainee: learnerNav("My Program", "Class Schedule"),
  client: [
    DASHBOARD,
    ...OVERVIEW_NAV,
    ...inGroup("Projects", [
      { href: "/portal/projects", label: "My Projects", icon: "FolderKanban" },
      { href: "/portal/milestones", label: "Milestones", icon: "Flag" },
      { href: "/portal/meetings", label: "Meetings", icon: "CalendarClock" },
    ]),
    ...inGroup("Finance", [{ href: "/portal/invoices", label: "Invoices", icon: "ReceiptText" }, WALLET_ITEM]),
    ...REWARDS_NAV,
    ...ACCOUNT_NAV,
  ],
};

/** Route-group access — which roles may open a `(learner)` / `(applicant)` / `(client)` page. */
/** Portal roles that can take Online Test System tests (`/portal/tests`, `/portal/exam`). */
export const TEST_TAKER_ROLES: PortalRole[] = ["job_applicant", "intern", "trainee"];

export const ROUTE_GROUP_ROLES = {
  applicant: ["job_applicant"] as PortalRole[],
  learner: ["intern", "trainee"] as PortalRole[],
  client: ["client"] as PortalRole[],
};

export function roleHome(): string {
  return "/portal";
}
