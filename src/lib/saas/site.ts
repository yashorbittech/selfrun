/**
 * Structure of the SelfRun AI product website: navigation, feature groups, roadmap and legal copy.
 * Everything is drawn from what the product really does (see `content.ts`); where the product has no genuine data yet
 * (releases, posts, customer stories) the list is empty and the page shows its structure with an honest empty state.
 */
import type { IconKey } from "@/lib/saas/content";

export interface NavLink {
  href: string;
  label: string;
  hint: string;
}

/** The header's links: no dropdowns, one click to each place. */
export const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Home", hint: "What SelfRun AI is and why companies use it" },
  { href: "/features", label: "Features", hint: "Every panel and feature, with a details page for each" },
  { href: "/pricing", label: "Pricing", hint: "Plans, allowances and a details page for each plan" },
  { href: "/docs", label: "Documentation", hint: "A guide for every panel and every feature" },
  { href: "/about", label: "About Us", hint: "Who we are, our mission, what we do and success stories" },
  { href: "/contact", label: "Contact Us", hint: "Sales, support and security" },
];

/** Legal pages, shown at the bottom of every page. */
export const LEGAL_LINKS: NavLink[] = [
  { href: "/privacy", label: "Privacy Policy", hint: "How personal information is handled" },
  { href: "/terms", label: "Terms of Service", hint: "The agreement for using the service" },
  { href: "/cookies", label: "Cookie Policy", hint: "Cookies and similar storage we use" },
  { href: "/data-policy", label: "Data Policy", hint: "Ownership, isolation, AI and export" },
  { href: "/refund-policy", label: "Refund & Cancellation Policy", hint: "The free plan, cancelling and billing issues" },
];

/** The feature groups of the Features page: each lists the module keys (Panel Registry keys) it holds. */
export interface FeatureGroup {
  id: string;
  title: string;
  lead: string;
  icon: IconKey;
  modules: string[];
}
export const FEATURE_GROUPS: FeatureGroup[] = [
  { id: "sales-marketing", title: "Sales & marketing", lead: "Capture demand, run the pipeline and publish everywhere your customers look.", icon: "target", modules: ["lms", "smms", "seo", "cms", "website"] },
  { id: "people-training", title: "People & training", lead: "Hire, onboard, pay, assess and train — one record per person.", icon: "users", modules: ["hrms", "tms", "ots"] },
  { id: "finance-operations", title: "Finance & operations", lead: "Deliver projects, control spend and keep the books closed.", icon: "wallet", modules: ["fms", "pms", "prms"] },
  { id: "documents-knowledge", title: "Documents & knowledge", lead: "Procedures, agreements and credentials that stay current and protected.", icon: "file", modules: ["sop", "lpms", "dlms"] },
  { id: "ai-intelligence", title: "AI & intelligence", lead: "Ask your business anything and build assistants on your own knowledge.", icon: "brain", modules: ["intelligence", "aibots"] },
  { id: "collaboration-portals", title: "Collaboration, portals & support", lead: "Keep teams, clients and students in the loop without another tool.", icon: "chat", modules: ["messenger", "portal", "support"] },
  { id: "control-center", title: "Control center", lead: "One home for analytics, users, roles, audit and automations.", icon: "bolt", modules: ["workspace"] },
];

/** Example automations, each phrased from the automations the product lists for its modules. */
export interface Flow {
  id: string;
  area: string;
  trigger: string;
  condition: string;
  action: string[];
}
export const FLOWS: Flow[] = [
  { id: "lead", area: "Sales", trigger: "A new lead is created", condition: "Matches your assignment rule", action: ["Assign the lead to its owner", "Notify the owner", "Send a welcome message"] },
  { id: "deal", area: "Sales → Projects", trigger: "A deal is won", condition: "Always", action: ["Create the client record", "Notify the account team"] },
  { id: "leave", area: "People", trigger: "A leave request is filed", condition: "Needs approval", action: ["Notify the manager", "Track the approval"] },
  { id: "invoice", area: "Finance", trigger: "An invoice goes overdue", condition: "Past the reminder date", action: ["Send a payment reminder", "Notify finance"] },
  { id: "task", area: "Projects", trigger: "A task is assigned or overdue", condition: "Always", action: ["Notify the assignee"] },
];

export type RoadmapStatus = "Completed" | "In Progress" | "Planned" | "Future";
export interface RoadmapItem {
  title: string;
  body: string;
  status: RoadmapStatus;
}
/** Only genuine roadmap information: items the product itself marks as upcoming. */
export const ROADMAP: RoadmapItem[] = [
  { status: "Planned", title: "SMS for OTP and alerts", body: "SMS is listed as a plan allowance in the product and marked “coming soon”." },
];

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  changes: { type: "New" | "Improved" | "Fixed"; text: string }[];
}
/** No versioned releases are published yet. Entries added here appear on /changelog, newest first. */
export const CHANGELOG: ChangelogEntry[] = [];

export interface BlogPost {
  slug: string;
  title: string;
  summary: string;
  date: string;
  readMinutes: number;
  /** Photo under /public/selfrun/photos and the real screen shown with the post. */
  photo: string;
  shot: string;
  tag: string;
  sections: { heading: string; body: string[] }[];
}
/** No blog posts are published yet. Posts added here appear on /blog and get their own page. */
export const POSTS: BlogPost[] = [];

export interface SuccessStory {
  slug: string;
  company: string;
  summary: string;
  results: string[];
}
/** Only real, permitted customer stories belong here. None are published yet. */
export const STORIES: SuccessStory[] = [];

export interface LegalDoc {
  slug: string;
  title: string;
  description: string;
  intro: string;
  sections: { heading: string; body?: string[]; list?: string[] }[];
  /** Three short points shown "at a glance" above the document. */
  highlights?: { title: string; text: string; icon: IconKey }[];
}

const SERVICE = "SelfRun AI";

export const LEGAL_EXTRA: Record<"cookies" | "data-policy" | "refund-policy", LegalDoc> = {
  cookies: {
    slug: "cookies",
    title: "Cookie Policy",
    description: `The cookies and similar browser storage ${SERVICE} uses, and why.`,
    intro: `This page explains what is stored in your browser when you use the ${SERVICE} website and your workspace, and the choices you have.`,
    highlights: [
      { icon: "shield", title: "No advertising cookies", text: "We keep only what is needed to run and secure the service." },
      { icon: "lock", title: "Sign-in and device protection", text: "Cookies keep you signed in and keep your device list and sign-in history accurate." },
      { icon: "check", title: "Your choice", text: "Delete or block cookies in your browser any time; clearing preferences resets your interface." },
    ],
    sections: [
      { heading: "What we store", body: ["We keep this to what is needed to run and secure the service. We do not use advertising cookies."] },
      {
        heading: "Cookies we use",
        list: [
          "Sign-in cookies: keep you signed in to your workspace or panel and protect your session. They are removed when you sign out or the session ends.",
          "Device cookie: recognises your browser so your list of signed-in devices and your sign-in history are accurate. It is kept for up to a year.",
          "Referral cookie: if you arrive through a referral link, the referral code is remembered for 30 days so a later sign-up is credited correctly.",
          "Preference storage: your chosen theme and similar interface choices are kept in your browser's local storage.",
        ],
      },
      { heading: "Analytics", body: ["We use first-party analytics only to understand how the website is used. We do not sell this information."] },
      { heading: "Your choices", body: ["You can delete or block cookies in your browser settings. Blocking the sign-in cookies means you will not be able to sign in. Clearing stored preferences resets your interface choices."] },
      { heading: "Questions", body: ["Contact us through the contact page if you want to know more."] },
    ],
  },
  "data-policy": {
    slug: "data-policy",
    title: "Data Policy",
    description: `How ${SERVICE} treats the data stored in a workspace: ownership, isolation, AI processing and export.`,
    intro: `This policy describes what happens to the business data a customer keeps in ${SERVICE}. It complements the Privacy Policy, which covers personal information about website visitors and account holders.`,
    highlights: [
      { icon: "shield", title: "Isolated per company", text: "Every record belongs to one company and every query is confined to it by the platform itself." },
      { icon: "brain", title: "AI is read-only", text: "AI answers use read-only queries with the asker's permissions and show how they were calculated." },
      { icon: "check", title: "Yours to export", text: "Export your records any time; import leads, clients and employees from CSV." },
    ],
    sections: [
      { heading: "You own your data", body: ["The records, files and content a company puts into its workspace belong to that company. We process them only to provide the service."] },
      { heading: "Isolation between companies", body: ["Every record belongs to one company and every database query is confined to that company by the platform itself. One company cannot read another company's data."] },
      { heading: "Access inside your company", body: ["Administrators control who can see and do what through roles and fine-grained permissions per module and action. Sign-ins, changes, exports and administrative actions are recorded in an audit log."] },
      { heading: "AI and your data", body: ["AI features run against the requesting company's own workspace, with the permissions of the person asking. Questions are answered with read-only queries, so the AI cannot change your data, and answers show how they were calculated. AI usage is metered according to your plan."] },
      { heading: "Secrets", body: ["Credentials, API keys and vault documents are encrypted at rest with keys held outside the database."] },
      { heading: "Export and portability", body: ["You can export your records at any time. Leads, clients and employees can also be imported from CSV."] },
      { heading: "When a plan ends", body: ["After a plan ends, the workspace stays readable for a period so you can export what you need. You can ask us to delete your data."] },
    ],
  },
  "refund-policy": {
    slug: "refund-policy",
    title: "Refund & Cancellation Policy",
    description: `The free plan, cancelling a subscription and how billing questions are handled for ${SERVICE}.`,
    intro: `This policy explains how the free plan and cancellation work and what to do if something on a bill looks wrong. Plans, prices and limits are always the ones shown on the pricing page and in your billing settings.`,
    highlights: [
      { icon: "wallet", title: "Free plan, no card", text: "Free forever for one person, with every panel and every feature." },
      { icon: "check", title: "Cancel from billing", text: "Cancel any time from your billing page; your workspace stays readable so you can export." },
      { icon: "chat", title: "Billing mistakes fixed", text: "Charged in error or twice? Tell us and we will review and correct it." },
    ],
    sections: [
      { heading: "Free plan", body: ["The Free plan is free forever for one person, with every panel and every feature, and needs no card. Paid plans add people and bigger allowances."] },
      { heading: "Subscriptions", body: ["A paid subscription renews each billing period until it is cancelled. Prices exclude applicable taxes."] },
      { heading: "Cancelling", body: ["You can cancel at any time from your billing page. Your workspace then stays readable for a period so you can export your data."] },
      { heading: "Failed payments", body: ["If a payment fails we give a grace period before restricting your workspace, and your data remains available to export."] },
      { heading: "Refunds and billing mistakes", body: ["If you were charged in error, charged twice or were billed after cancelling, contact us and we will review the case and correct it. Include your workspace address and the invoice number so we can find it quickly."] },
      { heading: "Contact", body: ["Write to us through the contact page for any billing or cancellation question."] },
    ],
  },
};

/** White label: everything a customer's team, clients and visitors see carries the customer's brand. Each item is a real setting. */
export interface BrandPoint {
  key: string;
  title: string;
  text: string;
  icon: IconKey;
  /** Screenshot under /public/selfrun/screens. */
  shot: string;
}
export const YOUR_BRAND: BrandPoint[] = [
  { key: "branding", title: "Your logo, name & colours", text: "Set once — applied across every panel, email and PDF your company sends.", icon: "target", shot: "branding" },
  { key: "apps", title: "Your own apps", text: "Your company's own apps for phones and for Windows, macOS and Linux — generated automatically, with your name and icon.", icon: "rocket", shot: "apps" },
  { key: "domains", title: "Your own domain", text: "Your website and workspace on your domain, with automatic SSL.", icon: "globe", shot: "domains" },
  { key: "themes", title: "Multiple themes", text: "Pick and customise website themes with live preview — colours, fonts and layouts.", icon: "layers", shot: "cms-theme" },
  { key: "push", title: "Your push notifications", text: "Reach your team and your website visitors on their devices, in your name.", icon: "megaphone", shot: "cms-push" },
  { key: "website", title: "Your website", text: "A complete website builder with pages, blog, forms and SEO — published under your brand.", icon: "book", shot: "cms" },
];

/** SelfRun AI against the usual way of running a business: a separate tool for each job. No competitor is named or priced. */
export const COMPARISON: { row: string; us: string; them: string }[] = [
  { row: "Software", us: "One platform for every department", them: "A different tool for every job" },
  { row: "Logins", us: "One login, single sign-on across panels", them: "A separate login for each tool" },
  { row: "Your data", us: "One database shared by every panel", them: "Data split across tools, copied by hand" },
  { row: "AI", us: "Ask AI in every panel, answering from all your data", them: "AI, if any, sees only its own tool" },
  { row: "Automation", us: "Workflows across sales, HR, finance and projects", them: "Connectors to buy and maintain between tools" },
  { row: "Website", us: "AI-powered website builder: themes, AI chatbot, voice AI, SEO", them: "A separate website builder, host and plug-ins" },
  { row: "Mobile apps", us: "Your own Android and iOS apps, generated for you", them: "Each vendor's app, in their name" },
  { row: "Desktop apps", us: "Your own Windows, macOS and Linux apps", them: "Usually browser only" },
  { row: "Installable app (PWA)", us: "Install on any device in one tap, with your icon", them: "Varies by tool" },
  { row: "Push notifications", us: "To your team and your website visitors, in your name", them: "Per tool, under the vendor's brand" },
  { row: "Your brand", us: "Your logo, colours, domain, emails and PDFs", them: "Each vendor's brand in front of your people" },
  { row: "Control", us: "Switch panels on/off, roles and per-action permissions", them: "Different admin settings in every tool" },
  { row: "Audit", us: "One audit log and sign-in history for everything", them: "Scattered logs, if available" },
  { row: "Client portal", us: "Built in for clients, students and applicants", them: "Another product to buy" },
  { row: "Features", us: "Every panel and every feature on every plan", them: "Features locked behind higher tiers per tool" },
  { row: "Pricing", us: "Free forever for one; one plan by team size after", them: "Many subscriptions to track and renew" },
  { row: "Setup", us: "Guided setup in minutes, CSV import built in", them: "Separate setup, training and support for each" },
];

/** Everything included, grouped: the platform-wide capabilities a customer gets on day one. All of them exist in the product. */
export const CAPABILITIES: { title: string; icon: IconKey; items: string[] }[] = [
  { title: "AI", icon: "brain", items: ["Ask AI in every panel", "Business intelligence in plain language", "AI assistants on your knowledge", "AI website chatbot", "Voice AI conversations", "AI social content & images", "AI-assisted SEO", "AI help assistant"] },
  { title: "Automation", icon: "workflow", items: ["Trigger → Condition → Action workflows", "Ready-made templates", "Email and in-app notifications", "Approvals and reminders", "Signed webhooks", "Run history for every workflow"] },
  { title: "Your brand", icon: "target", items: ["Logo, name and colours", "Custom domains with SSL", "Branded emails and PDFs", "Multiple website themes", "Your own push notifications", "Your own app icon and name"] },
  { title: "Every device", icon: "rocket", items: ["Web app on any browser", "Installable PWA", "Android and iOS apps", "Windows, macOS and Linux apps", "Push notifications", "Works on phone, tablet and desktop"] },
  { title: "Control", icon: "shield", items: ["Switch panels on or off", "Roles and per-action permissions", "Audit log across every panel", "Sessions and sign-in history", "Strict company data isolation", "Encrypted secrets"] },
  { title: "Data & insight", icon: "chart", items: ["Live dashboards in every panel", "Company-wide executive view", "Saved filters", "CSV import with validation", "CSV export", "Search across every panel (⌘K)"] },
  { title: "Website & growth", icon: "globe", items: ["Drag-and-drop page builder", "Blog, careers and products", "Forms straight into your CRM", "Offers, coupons and referrals", "Wallet and reward credits", "SEO audits and rank tracking"] },
  { title: "People & portals", icon: "users", items: ["Employee self-service", "Client & student portal", "Team chat and meetings", "Announcements", "Help center and support desk", "Online tests and certificates"] },
];

/** What an AI-powered business gains, in the platform's own terms. */
export const AI_BENEFITS: { title: string; text: string; icon: IconKey }[] = [
  { title: "Hours back every week", text: "Follow-ups, reminders, approvals and notifications run on their own.", icon: "clock" },
  { title: "Decisions from live data", text: "Ask a question, get the answer from your real records — with the working shown.", icon: "brain" },
  { title: "Nothing slips through", text: "Overdue leads, invoices, leaves and tasks are chased automatically.", icon: "check" },
  { title: "Grow without the busywork", text: "Add people and panels without adding admin. The platform scales with you.", icon: "rocket" },
  { title: "Always on", text: "Automations and AI assistants keep working nights, weekends and holidays.", icon: "bolt" },
  { title: "Safe by design", text: "AI reads only what the asker may see, and every action is in the audit log.", icon: "shield" },
];

/** The kinds of software a business usually buys separately, and the panel that replaces each one. */
export const REPLACES: { software: string; panel: string; icon: IconKey }[] = [
  { software: "CRM & lead management", panel: "lms", icon: "target" },
  { software: "HR & payroll software", panel: "hrms", icon: "users" },
  { software: "Accounting & invoicing", panel: "fms", icon: "wallet" },
  { software: "Project management", panel: "pms", icon: "layers" },
  { software: "Procurement & assets", panel: "prms", icon: "cart" },
  { software: "Training / LMS", panel: "tms", icon: "graduation" },
  { software: "Team chat & meetings", panel: "messenger", icon: "chat" },
  { software: "SOP & policy manager", panel: "sop", icon: "book" },
  { software: "Document & e-signature", panel: "lpms", icon: "file" },
  { software: "Password & document vault", panel: "dlms", icon: "lock" },
  { software: "Online assessments", panel: "ots", icon: "check" },
  { software: "AI chatbot builder", panel: "aibots", icon: "bot" },
  { software: "Business intelligence", panel: "intelligence", icon: "brain" },
  { software: "Social media scheduler", panel: "smms", icon: "megaphone" },
  { software: "SEO tools", panel: "seo", icon: "search" },
  { software: "Website builder & hosting", panel: "cms", icon: "globe" },
  { software: "Client & student portal", panel: "portal", icon: "building" },
  { software: "Helpdesk", panel: "support", icon: "chat" },
  { software: "Workflow automation", panel: "workspace", icon: "workflow" },
];

/** Every way a company's people can use its workspace — each one carrying the company's own name and icon. */
export const DEVICES: { title: string; text: string; platforms: string[] }[] = [
  { title: "Web app", text: "Works in any modern browser, on any device — nothing to install.", platforms: ["Chrome", "Safari", "Edge", "Firefox"] },
  { title: "Installable app (PWA)", text: "Install from the browser in one tap, with your icon and push notifications.", platforms: ["Android", "iOS", "iPadOS", "Windows", "macOS", "Linux", "ChromeOS"] },
  { title: "Mobile apps", text: "Your company's own Android and iOS apps, generated from your branding — ready for Google Play and the App Store.", platforms: ["Android", "iOS"] },
  { title: "Desktop apps", text: "Your own desktop app with native notifications and a tray icon.", platforms: ["Windows", "macOS", "Linux"] },
];

/** How the whole business runs itself, in four layers. */
export const RUNS_ITSELF: { title: string; text: string; icon: IconKey; points: string[] }[] = [
  { title: "Capture", text: "Work enters once.", icon: "target", points: ["Website forms and campaigns", "CSV imports", "Client & student portal", "Apps on every device"] },
  { title: "Connect", text: "Every panel shares one record.", icon: "layers", points: ["Deal → client → project", "Milestone → invoice → ledger", "Employee → payroll → finance", "Request → order → payment"] },
  { title: "Automate", text: "The platform does the follow-up.", icon: "workflow", points: ["Triggers from every panel", "Notifications and emails", "Approvals and reminders", "Signed webhooks"] },
  { title: "Decide", text: "AI turns records into answers.", icon: "brain", points: ["Ask in plain language", "Answers with the working shown", "AI content and assistants", "Live dashboards everywhere"] },
];

/** Extra screens captured per panel (desktop, tablet and mobile), shown under the panel's feature list. */
export const EXTRA_SCREENS: Record<string, { key: string; title: string }[]> = {
  lms: [{ key: "lms-leads", title: "Leads" }],
  hrms: [{ key: "hrms-employees", title: "Employee directory" }, { key: "hrms-payroll", title: "Payroll" }],
  fms: [{ key: "fms-invoices", title: "Invoices" }, { key: "fms-profit-and-loss", title: "Profit & loss" }],
  pms: [{ key: "pms-projects", title: "Projects" }],
  prms: [{ key: "prms-purchase-orders", title: "Purchase orders" }],
  tms: [{ key: "tms-students", title: "Students" }],
  sop: [{ key: "sop-library", title: "SOP library" }],
  seo: [{ key: "seo-keywords", title: "Keywords" }],
  smms: [{ key: "smms-posts", title: "Social media posts" }],
  cms: [{ key: "cms-pages", title: "Pages" }, { key: "cms-theme", title: "Themes" }],
  messenger: [{ key: "messenger-channels", title: "Team channels" }],
  dlms: [{ key: "dlms-credentials", title: "Credential vault" }],
  ots: [{ key: "ots-tests", title: "Tests" }],
  aibots: [{ key: "aibots-bots", title: "AI assistants" }],
  lpms: [{ key: "lpms-documents", title: "Document library" }],
  workspace: [{ key: "workspace-users", title: "Users, roles & seats" }, { key: "workspace-audit", title: "Audit log" }],
};

/**
 * A suggested growth path for a company using the platform, phase by phase. It is a guide, not a promise: every company moves at its own
 * pace and switches on only the panels it needs. Each phase names real panels and what they change; no figures are claimed.
 */
export interface GrowthPhase {
  id: string;
  when: string;
  title: string;
  goal: string;
  icon: IconKey;
  /** Panel keys (Panel Registry keys) to switch on in this phase. */
  panels: string[];
  /** Screen shown beside the phase. */
  screen: string;
  actions: string[];
  /** How the business changes by the end of the phase. */
  outcomes: string[];
  before: string;
  after: string;
}
export const GROWTH: GrowthPhase[] = [
  {
    id: "launch", when: "Day 1", title: "Launch your company workspace", goal: "Be live, branded and ready for your team — in minutes, for free.", icon: "rocket", panels: ["workspace"], screen: "workspace",
    actions: ["Register with your work email and start on the free-forever plan", "Complete the guided setup: profile, departments, the panels you want", "Add your logo, name and colours so everything carries your brand", "Invite your team with roles and permissions", "Import your leads, clients and employees from CSV"],
    outcomes: ["A branded workspace your team can sign in to today", "One login and one set of permissions for everyone", "Existing data already inside, not in a spreadsheet"],
    before: "Spreadsheets, email threads and a different login for every tool.", after: "One workspace, your brand, your people, your data.",
  },
  {
    id: "organise", when: "Week 1", title: "Capture and organise", goal: "Stop losing enquiries and keep every person and record in one place.", icon: "target", panels: ["lms", "hrms", "cms"], screen: "lms",
    actions: ["Connect your website forms so enquiries become leads with an owner and a due date", "Set up your pipeline and assign leads by rule", "Build the employee directory with departments and documents", "Publish your website on your own domain with SSL"],
    outcomes: ["No enquiry without an owner", "A people directory HR and managers both trust", "A live website that feeds your CRM"],
    before: "Enquiries in inboxes, staff details in files, a website that needs a developer.", after: "Every lead owned, every person on record, a website your team edits.",
  },
  {
    id: "automate", when: "Month 1", title: "Automate the busywork", goal: "Let the platform do the follow-ups, approvals and reminders.", icon: "workflow", panels: ["workspace", "fms", "pms", "hrms"], screen: "automations",
    actions: ["Switch on automations: new-lead alerts, overdue follow-ups, leave routing, payment reminders", "Raise invoices with payment links and let customers pay online", "Run projects with tasks, timesheets and milestone billing", "Move attendance, leave and payroll onto the platform"],
    outcomes: ["Follow-ups and reminders happen without anyone chasing", "Invoices get paid faster, with receipts and the ledger updating on their own", "Payroll and project money post to Finance without re-entry"],
    before: "Someone remembers to chase, approve and re-type.", after: "The platform notifies, approves, reminds and posts — and logs every run.",
  },
  {
    id: "see", when: "Quarter 1", title: "See everything and decide faster", goal: "Turn connected records into answers.", icon: "brain", panels: ["intelligence", "prms", "sop", "workspace"], screen: "intelligence",
    actions: ["Ask AI questions in plain language and read the working it shows", "Put procurement on approvals and track assets and subscriptions", "Publish SOPs and track who has acknowledged them", "Review the audit log, sessions and role permissions"],
    outcomes: ["Leadership gets answers in seconds, not after a report is built", "Spend is approved and matched before it is paid", "A documented way of working, with proof it is followed"],
    before: "Decisions wait for someone to build a report.", after: "Ask the business a question and get a verifiable answer.",
  },
  {
    id: "grow", when: "Months 4–6", title: "Grow your reach", goal: "Bring in customers and keep them engaged.", icon: "megaphone", panels: ["smms", "seo", "cms", "portal", "aibots"], screen: "smms",
    actions: ["Plan campaigns and let AI draft platform-specific posts, with approval", "Fix SEO issues from a prioritised list and track rankings", "Run offers, coupons, referrals and reward credits from your website", "Give clients, students and applicants their own portal", "Put an AI chatbot on your site, trained on your knowledge"],
    outcomes: ["A steady, on-brand presence without a large content team", "Visitors answered around the clock and enquiries captured", "Clients who check the portal instead of emailing for updates"],
    before: "Marketing disconnected from sales; customers waiting on email.", after: "Campaigns measured against real leads; customers served by portal and AI.",
  },
  {
    id: "scale", when: "Year 1 and beyond", title: "Scale with your own apps and team", goal: "Grow the team and the company without growing the admin.", icon: "bolt", panels: ["tms", "ots", "lpms", "dlms", "workspace"], screen: "apps",
    actions: ["Roll out your own Android, iOS, desktop and installable apps in your name", "Hire and train at scale with online tests and training programs", "Generate and sign documents from templates; keep credentials in the vault", "Move up a plan only when your team size or allowances need it"],
    outcomes: ["Your team and clients use apps that carry your brand", "Hiring, assessment and training run on one record", "More people and more panels — without more tools or more admin"],
    before: "Every new hire or department means another tool to buy and manage.", after: "The same platform, with more people on it — still one login, one bill.",
  },
];
