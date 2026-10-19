/**
 * Structure of the SelfRun AI product website: navigation, feature groups, roadmap and legal copy.
 * Everything is drawn from what the product really does (see `content.ts`); where the product has no genuine data yet
 * (releases, posts, customer stories) the list is empty and the page shows its structure with an honest empty state.
 */
import type { IconKey } from "@/lib/platform/saas/content";

export interface NavLink {
  href: string;
  label: string;
  hint: string;
}

/** The header's links: no dropdowns, one click to each place. */
export const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Home", hint: "What SelfRun AI is and why companies use it" },
  { href: "/products", label: "Products", hint: "Every product and feature, with a details page for each" },
  { href: "/pricing", label: "Pricing", hint: "Plans, allowances and a details page for each plan" },
  { href: "/docs", label: "Documentation", hint: "A guide for every product and every feature" },
  { href: "/about", label: "About Us", hint: "Who we are, our mission, what we do and success stories" },
  { href: "/contact", label: "Contact Us", hint: "Sales, support and security" },
];

/** Legal pages, shown at the bottom of every page. */
export const LEGAL_LINKS: NavLink[] = [
  { href: "/privacy", label: "Privacy Policy", hint: "How personal information is handled" },
  { href: "/terms", label: "Terms of Service", hint: "The agreement for using the service" },
  { href: "/cookies", label: "Cookie Policy", hint: "Cookies and similar storage we use" },
  { href: "/security", label: "Security & Trust", hint: "Isolation, access, AI safety, reliability and data ownership" },
  { href: "/sla", label: "Uptime SLA", hint: "99.9% monthly uptime, how it is measured and service credits" },
  { href: "/status", label: "System status", hint: "A live check of the website and the database" },
  { href: "/data-policy", label: "Data Policy", hint: "Ownership, isolation, AI and export" },
  { href: "/refund-policy", label: "Refund & Cancellation Policy", hint: "The free plan, cancelling and billing issues" },
];

/** The feature groups of the Features page: each lists the module keys (Product Registry keys) it holds. */
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
  { id: "lead", area: "SelfRun DealFlow AI", trigger: "A new lead is created", condition: "Matches your assignment rule", action: ["Assign the lead to its owner", "Notify the owner", "Send a welcome message"] },
  { id: "deal", area: "SelfRun DealFlow AI → SelfRun SprintOS", trigger: "A deal is won", condition: "Always", action: ["Create the client record", "Notify the account team"] },
  { id: "leave", area: "SelfRun TalentOS", trigger: "A leave request is filed", condition: "Needs approval", action: ["Notify the manager", "Track the approval"] },
  { id: "invoice", area: "SelfRun CashFlow AI", trigger: "An invoice goes overdue", condition: "Past the reminder date", action: ["Send a payment reminder", "Notify finance"] },
  { id: "task", area: "SelfRun SprintOS", trigger: "A task is assigned or overdue", condition: "Always", action: ["Notify the assignee"] },
];

export type RoadmapStatus = "Completed" | "In Progress" | "Planned" | "Future";
export interface RoadmapItem {
  title: string;
  body: string;
  status: RoadmapStatus;
}
/** Only genuine roadmap information: items the product itself marks as upcoming. */
export const ROADMAP: RoadmapItem[] = [
];

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  changes: { type: "New" | "Improved" | "Fixed"; text: string }[];
}
/** No versioned releases are published yet. Entries added here appear on /changelog, newest first. */
export const CHANGELOG: ChangelogEntry[] = [];

export type { BlogPost } from "./blog-posts";
export { POSTS } from "./blog-posts";

export interface SuccessStory {
  slug: string;
  company: string;
  summary: string;
  results: string[];
  /** Optional approved story details; only add facts the featured customer has approved for publication. */
  industry?: string;
  quote?: string;
  challenge?: string;
  approach?: string[];
}
/** Only real, permitted customer stories belong here. */
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

export const LEGAL_EXTRA: Record<"cookies" | "data-policy" | "refund-policy" | "security" | "sla", LegalDoc> = {
  sla: {
    slug: "sla",
    title: "Uptime SLA",
    description: `${SERVICE}'s availability commitment: 99.9% monthly uptime on paid plans, how it is measured, what is excluded and the service credits if we miss it.`,
    intro: `This page states how available ${SERVICE} will be for paying customers, how that is measured, and what we give you if we fall short. It is the same commitment most business software makes: 99.9% of each month.`,
    highlights: [
      { icon: "clock", title: "99.9% monthly uptime", text: "About 43 minutes of downtime allowed in a 30-day month, on every paid plan." },
      { icon: "wallet", title: "Service credits", text: "Miss the target and you get 10%, 25% or 50% of that month's fee back as a credit." },
      { icon: "check", title: "Live status", text: "The System status page checks the website and the database whenever it is opened." },
    ],
    sections: [
      {
        heading: "Our commitment",
        body: [`${SERVICE} will be available for at least 99.9% of the minutes in each calendar month (the "Monthly Uptime Percentage"). This applies to the web app, every product and the APIs of a workspace on a paid plan (Starter, Growth and Business). Enterprise customers can agree different terms in writing. The Free plan is provided on a best-effort basis and is not covered by credits.`],
      },
      {
        heading: "What 99.9% allows",
        list: [
          "99.9% in a 30-day month: about 43 minutes of downtime.",
          "99.0%: about 7 hours 12 minutes. 95.0%: about 36 hours.",
          "Every minute below the target counts, whether it comes in one outage or many.",
        ],
      },
      {
        heading: "How it is measured",
        body: ["Monthly Uptime Percentage = (minutes in the month − minutes of downtime) ÷ minutes in the month × 100."],
        list: [
          "Downtime: a minute in which a paid workspace cannot be opened or signed in to because of a fault on our side, as shown by our monitoring and the System status page.",
          "Partial problems: a fault in one product counts as downtime for that workspace when it stops the product from loading at all.",
          "Records: our monitoring and the incident history on the System status page are the source of truth; if you disagree you can send us your own logs with a claim and we will look at both.",
        ],
      },
      {
        heading: "What is not counted",
        list: [
          "Planned maintenance: announced in the product at least 24 hours ahead and kept within 4 hours a month.",
          "Outside services: failures of your own network, device, DNS or custom domain, of payment gateways, email and messaging providers, social networks, and of the AI provider. When the AI service is down, AI features are paused with a message; that is not website downtime.",
          "Your own account state: a workspace that is suspended, read-only for an unpaid renewal, or over a plan limit.",
          "Misuse and abuse: traffic or actions that break the Terms of Service, and attacks we have to block to protect other customers.",
          "Beta features and anything we label as such.",
          "Events beyond our reasonable control: natural disaster, war, government action, and failures of the internet backbone or of our hosting and database providers' own regions.",
        ],
      },
      {
        heading: "Service credits",
        body: ["If the Monthly Uptime Percentage of your workspace is below 99.9%, you can claim a credit on that month's subscription fee, excluding taxes:"],
        list: [
          "Below 99.9% but at least 99.0%: a credit of 10%.",
          "Below 99.0% but at least 95.0%: a credit of 25%.",
          "Below 95.0%: a credit of 50%.",
          "Credits are applied to your next invoice or added as free time on your subscription. They are never paid out in cash, and they are your sole remedy for downtime.",
        ],
      },
      {
        heading: "How to claim",
        list: [
          "Open a request in the Help & Support product (type Other) with the title \"SLA credit\", the dates and times you saw the problem, and what you could not do.",
          "Send it within 30 days after the end of the month in which the downtime happened.",
          "We review it against our records and answer in the request. If we confirm the downtime we apply the credit.",
        ],
      },
      {
        heading: "Changes",
        body: ["We may improve this SLA at any time. If a change makes it less favourable to you we will tell you at least 30 days before it applies, and it never applies to a month that has already started."],
      },
    ],
  },
  security: {
    slug: "security",
    title: "Security & Trust",
    description: `How ${SERVICE} separates every company's data, controls access, keeps AI and automation inside your permissions, and lets you export your data or leave.`,
    intro: `This page describes how ${SERVICE} works today: how each company's data is kept apart, who can see what, how the AI and automations are held in check, what happens when something fails, and how you take your data with you. It is written for the person who has to answer "is it safe to run the business on this?"`,
    highlights: [
      { icon: "shield", title: "Separate per company", text: "The platform scopes every database query to one company, so a page cannot ask for another company's data." },
      { icon: "brain", title: "AI proposes, you approve", text: "Assistants work with the asker's permissions; any change they propose waits for approval and is logged." },
      { icon: "check", title: "Your data stays yours", text: "Export tables, import from CSV, cancel and still read your workspace, or ask for permanent deletion." },
    ],
    sections: [
      {
        heading: "Each company's data is separate",
        list: [
          "Isolation: every record belongs to one company, and the platform adds that company to every database query itself. A page, report or export cannot ask for another company's rows by mistake.",
          "Own address: a company works on its own workspace address or custom domain. Signing in on one company's address never opens another's.",
          "Own settings and keys: branding, domains, plan limits, integrations and API keys are kept per company.",
          "Platform staff: the Platform Console is separate from company workspaces, and what platform staff do is recorded in a platform audit log.",
        ],
      },
      {
        heading: "Who can see and do what",
        list: [
          "Roles per product: each product has its own roles, and on top of a role you can grant or remove a single permission for one person.",
          "Custom roles: build a role from the permissions you choose and give it to people, instead of making everyone an administrator.",
          "Sensitive areas: payroll, salaries, bank details, finance statements and stored credentials need their own permission, even for managers.",
          "Delegated administrators: an administrator who is not a Super Admin cannot grant a role they do not hold themselves, cannot raise their own access and cannot change a Super Admin's account.",
          "Checked on the server: permissions are enforced on pages, actions, APIs and exports, not only by hiding buttons.",
          "Plans: a product opens only if the company's plan includes it, and a suspended or unpaid workspace becomes read-only instead of being switched off.",
          "Audit log: sign-ins and failed sign-ins are recorded with their device and place, changes are recorded in each product's activity log, and the central Audit log brings the products' activity and the company's business events together for administrators to filter.",
        ],
      },
      {
        heading: "Sign-in and account protection",
        list: [
          "Passwords: stored only as salted hashes. Five wrong attempts lock the account for 15 minutes.",
          "Two-step sign-in: anyone can turn on a second step with an authenticator app (Google Authenticator, Microsoft Authenticator, Authy, 1Password). A password alone then does not sign in: the six-digit code is needed too. Codes work once, wrong codes count towards the same lock-out, ten single-use recovery codes cover a lost phone, and a Super Admin can reset it for someone who lost both.",
          "Sessions: a signed-in session is tied to the browser and network it started on. If the session token is copied somewhere else it is revoked and the owner signs in again.",
          "Devices: each person can see their signed-in devices and sign-in history, and sign a device out.",
          "Abuse protection: sign-in, forms, AI calls and exports are rate-limited, scripted clients are refused on the API, and requests from other websites are rejected.",
          "Browser protection: pages are served over HTTPS only with strict transport security, clickjacking protection and a content policy on API responses.",
        ],
      },
      {
        heading: "Encryption and files",
        list: [
          "Secrets: credentials, API keys, bank details and vault documents are encrypted at rest with keys that are held outside the database.",
          "Files: uploads are kept in private storage and served only to people who are allowed to open them.",
          "Upload safety check: every file is checked before it is stored. Programs and scripts (even renamed), documents with macros, web pages, images that carry script, archives that hold them or are built to blow up, and PDFs that launch programs are refused with the reason shown. Optionally a file's fingerprint is checked against VirusTotal's database of known malware. This is a safety check, not a full antivirus scan.",
          "Payments: payment webhooks must carry a valid signature, and each payment is recorded once, so a repeated delivery cannot create a second invoice.",
        ],
      },
      {
        heading: "AI that stays inside your permissions",
        list: [
          "Your data only: assistants answer from your own company's workspace, with the permissions of the person asking. An assistant cannot read what that person cannot open.",
          "Read-only questions: business questions are answered with read-only queries. The numbers in an answer come from the query result, not from the model's memory, and the answer shows how it was calculated.",
          "Changes need approval: when an assistant proposes to create, edit or delete something, nothing happens until the person approves it. Deletes ask for a second confirmation. A proposal expires after 30 minutes, can be used once and only by the person it was made for.",
          "Documents are data: instructions found inside documents, files or records are treated as content, never as commands.",
          "Logged: every action an assistant takes on someone's behalf is recorded with who asked, what changed and when.",
          "No cost surprises: AI use is metered against the plan. When the allowance is used up, AI pauses with a clear message and the rest of the product keeps working; the same happens if the AI service itself is unavailable.",
        ],
      },
      {
        heading: "Automations you can follow",
        list: [
          "Run history: every automation run is recorded with its outcome and kept for 90 days.",
          "No loops or floods: an automation cannot set off another automation, and a bulk CSV import is recorded but never runs automations, so a 1,000-row file cannot send 1,000 emails.",
          "Failure alerts: administrators are told once when an automation starts failing, not on every failed run.",
          "Test before you trust: \"Send test\" runs an automation's actions once with sample data, so you can see what it would do.",
          "Safe messages: values from your records are escaped before they are placed in an email.",
        ],
      },
      {
        heading: "Finance and payroll",
        list: [
          "Finance: invoices, credit notes, bills, receipts, payment links, bank and cash accounts with reconciliation, and a chart of accounts. Changes are kept in a finance audit trail.",
          "Restricted views: financial statements, banking and payroll figures are limited by role, so a project manager does not see them by default.",
          "Payroll rules: PF and ESI rates and wage ceilings are configurable, and income tax follows the Indian new-regime slabs for FY 2025-26 with the standard deduction, the section 87A rebate and cess. A manual TDS override is available where a case needs one.",
          "Your tax rates: tax rates used on invoices are a list you maintain, so a change in a rate is a setting, not a software update.",
        ],
      },
      {
        heading: "Reliability",
        list: [
          "Managed infrastructure: the product runs on managed cloud hosting with a managed MongoDB Atlas database, not on a single server.",
          "Availability commitment: 99.9% monthly uptime on paid plans, with service credits if we miss it. See the Uptime SLA.",
          "Live status and history: the System status page checks the website and the database each time it is opened, lists open and past incidents of the last 90 days with every update, and shows uptime worked out from that record.",
          "Scheduled jobs: renewals, reminders, expiry checks and other recurring work run on schedule without anyone clicking.",
          "Failed payments: a failed renewal starts a grace period; after it the workspace becomes read-only. Your data is not deleted, and paying brings everything straight back.",
          "AI outages: if the AI service is unavailable, AI screens say so in plain words and the rest of the product keeps working.",
        ],
      },
      {
        heading: "Your data is yours: export, import and leave",
        list: [
          "Ownership: the records, files and content a company puts in its workspace belong to that company.",
          "Backups: every week the platform saves a backup of each workspace (the last eight are kept) and the Super Admin can make one any time. Every backup stays in a history you can download from, and what you download is the very file that is stored (Settings → Backups & data). Passwords, tokens and saved API keys are never in a backup, and uploaded files stay in their products.",
          "Restore: the workspace can be put back to any backup, after a multi-step confirmation (the exact company name, a phrase, your password and your two-step code). The system first saves a safety copy of what you have, kept for 30 days, and every restore is recorded in its own history.",
          "Export by table: tables in the products can be exported to CSV or Excel, and documents such as invoices and payslips can be downloaded as PDF.",
          "Import: leads, clients and employees can be imported from CSV, with a sample file and a preview before anything is saved.",
          "Cancelling: you can cancel any time. The workspace then stays readable so you can download what you need.",
          "Delete all my data: removes every record and file in the workspace but keeps the company, its accounts and its subscription so you can start again. A safety copy of the records is kept for 30 days.",
          "Delete the company: schedules permanent deletion of the whole company and all its data in 30 days. It is read-only meanwhile, and until the last day you can cancel and bring the account back. Both deletions need the same multi-step confirmation as a restore, and both are recorded.",
        ],
      },
      {
        heading: "Support",
        list: [
          "Help & Support: a help center, an AI help assistant that knows the product, and support requests that you can follow from open to resolved, with attachments and notifications.",
          "Contact: write to us through the contact page for billing, migration or security questions.",
        ],
      },
      {
        heading: "Privacy and compliance",
        list: [
          "Published policies: the Privacy Policy, Data Policy, Terms of Service and Cookie Policy are public and linked from every page.",
          "No advertising cookies and no selling of data.",
          "Tools for your own duties: role-based access, an audit log, export and deletion on request help a company meet its own obligations under the laws that apply to it.",
          "Security questions: if your organisation needs a security questionnaire answered, send it through the contact page.",
        ],
      },
      {
        heading: "Questions teams ask before they switch",
        list: [
          "Too many products for us?: Use only the products you need. Each product runs independently with its own sign-in and database, and the suite gives you one place to find product links, guides and help.",
          "Hard for new people to learn?: Company setup walks through the profile, departments and invitations, and the documentation has step-by-step walkthroughs for the common jobs.",
          "Same on a phone and a laptop?: Yes. The installable web app and the Android, iOS, Windows, macOS and Linux apps open the same workspace, so every screen and feature is the same everywhere. Each app carries your company's name and icon and is always current.",
          "Will one busy company slow the others?: Each company's AI, storage, email and voice use is capped by its plan, requests are rate-limited per session and address, and the product runs on hosting that scales out.",
          "Will AI costs run away?: No. AI is metered against the plan, shown per person and per feature on the Usage page, and paused with a clear message when the allowance is used up.",
          "Can people abuse the free plan?: The Free plan is limited to one person and has its own AI, storage, email and voice allowances, enforced on the server.",
          "What if an outside service fails?: Connections under Settings → Integrations have a test button, automations alert administrators when they start failing, and if the AI service is unavailable the AI screens say so while everything else keeps working.",
          "How do I move in from other tools?: Import leads, clients and employees from CSV with a sample file and a preview, then connect your own domain, payment account, email and social accounts with your own keys.",
          "Are we locked in?: No. You can export every table to CSV or Excel, download documents as PDF, and take one archive of the whole workspace at any time.",
          "What if we stop using it?: Cancel from billing. The workspace stays readable so you can export, and you can ask for permanent deletion of the company's data.",
          "Is the website builder enough?: It has pages, a blog, products, forms, themes with live preview, menus, SEO tools, tracking and verification scripts, your own domain with automatic SSL, and an AI chatbot, all under your brand.",
          "How deep is the SEO product?: Site audits, technical and on-page checks, keywords, rankings, competitors, internal links, backlinks, sitemap, robots.txt and structured data, with Google Search Console and PageSpeed connections.",
          "How does social media work?: Campaigns, scheduled posts with an approval workflow, a media library, AI drafting and analytics for the Facebook, Instagram, LinkedIn and YouTube accounts you connect.",
          "How are documents protected?: Digi Locker keeps credentials and documents encrypted at rest with per-record access, expiry alerts and an activity log. Legal & Documents adds approvals, signatures, document history and an audit trail, and SOPs keep version history and acknowledgement tracking.",
          "Can a mistake in the AI hit our books?: An assistant cannot change a record until the person approves its proposal, and finance, payroll and bank views are limited by role.",
        ],
      },
      {
        heading: "Moving in and connecting other services",
        list: [
          "Moving in: bring leads, clients and employees in from CSV. Your own website and domain connect with automatic SSL.",
          "Connections: payments (Razorpay), email (SMTP, Resend, SendGrid), messaging (Twilio, WhatsApp Business), AI and voice (OpenAI, ElevenLabs) and your social accounts are connected per company in Settings → Integrations, with your own keys.",
          "Devices: web, installable app, and apps for Android, iOS, Windows, macOS and Linux that carry your company's name and icon.",
        ],
      },
    ],
  },
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
          "Sign-in cookies: keep you signed in to your workspace or product and protect your session. They are removed when you sign out or the session ends.",
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
      { icon: "brain", title: "AI stays in your permissions", text: "AI answers use read-only queries with the asker's permissions, and any change an assistant proposes waits for approval." },
      { icon: "check", title: "Yours to export", text: "Export your records any time; import leads, clients and employees from CSV." },
    ],
    sections: [
      { heading: "You own your data", body: ["The records, files and content a company puts into its workspace belong to that company. We process them only to provide the service."] },
      { heading: "Isolation between companies", body: ["Every record belongs to one company and every database query is confined to that company by the platform itself. One company cannot read another company's data."] },
      { heading: "Access inside your company", body: ["Administrators control who can see and do what through roles and fine-grained permissions per module and action. Sign-ins, changes and administrative actions are recorded in an audit log."] },
      { heading: "AI and your data", body: ["AI features run against the requesting company's own workspace, with the permissions of the person asking. Business questions are answered with read-only queries, and answers show how they were calculated. When an AI assistant in a product proposes a change, nothing happens until the person approves it. AI usage is metered according to your plan."] },
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
      { icon: "wallet", title: "Free plan, no card", text: "Free forever for one person, with every product and every feature." },
      { icon: "check", title: "Cancel from billing", text: "Cancel any time from your billing page; your workspace stays readable so you can export." },
      { icon: "chat", title: "Billing mistakes fixed", text: "Charged in error or twice? Tell us and we will review and correct it." },
    ],
    sections: [
      { heading: "Free plan", body: ["The Free plan is free forever for one person, with every product and every feature, and needs no card. Paid plans add people and bigger allowances."] },
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
  { key: "branding", title: "Your logo, name & colours", text: "Set once — applied across every product, email and PDF your company sends.", icon: "target", shot: "branding" },
  { key: "apps", title: "Your own apps", text: "Your company's own apps for phones and for Windows, macOS and Linux — generated with one button each, with your name and icon.", icon: "rocket", shot: "apps" },
  { key: "domains", title: "Your own domain", text: "Your website and workspace on your domain, with automatic SSL.", icon: "globe", shot: "domains" },
  { key: "themes", title: "Multiple themes", text: "Pick and customise website themes with live preview — colours, fonts and layouts.", icon: "layers", shot: "cms-theme" },
  { key: "push", title: "Your push notifications", text: "Reach your team and your website visitors on their devices, in your name.", icon: "megaphone", shot: "cms-push" },
  { key: "website", title: "Your website", text: "A complete website builder with pages, blog, forms and SEO — published under your brand.", icon: "book", shot: "cms" },
];

/** SelfRun AI against the usual way of running a business: a separate tool for each job. No competitor is named or priced. */
export const COMPARISON: { row: string; us: string; them: string }[] = [
  { row: "Software", us: "A suite of independent products for every department", them: "A different vendor for every job" },
  { row: "Logins", us: "Each product has its own sign-in", them: "Separate accounts across unrelated vendors" },
  { row: "Your data", us: "Each product keeps its own database", them: "Data spread across unrelated vendors" },
  { row: "AI", us: "AI built into each product, working with its available data", them: "AI, if any, bolted on separately" },
  { row: "Automation", us: "Configure workflows and integrations for the handoffs you choose", them: "Connectors to buy and maintain between tools" },
  { row: "Website", us: "AI-powered website builder: themes, AI chatbot, voice AI, SEO", them: "A separate website builder, host and plug-ins" },
  { row: "Mobile apps", us: "Your own Android and iOS apps, generated for you", them: "Each vendor's app, in their name" },
  { row: "Desktop apps", us: "Your own Windows, macOS and Linux apps", them: "Usually browser only" },
  { row: "Installable app (PWA)", us: "Install on any device in one tap, with your icon", them: "Varies by tool" },
  { row: "Push notifications", us: "To your team and your website visitors, in your name", them: "Per tool, under the vendor's brand" },
  { row: "Your brand", us: "Your logo, colours, domain, emails and PDFs", them: "Each vendor's brand in front of your people" },
  { row: "Control", us: "Switch products on/off, roles and per-action permissions", them: "Different admin settings in every tool" },
  { row: "Audit", us: "Product-specific audit logs and sign-in histories", them: "Scattered logs, if available" },
  { row: "Client portal", us: "Built in for clients, students and applicants", them: "Another product to buy" },
  { row: "Features", us: "Every product and every feature on every plan", them: "Features locked behind higher tiers per tool" },
  { row: "Pricing", us: "Free forever to start; one plan by team size after", them: "Many subscriptions to track and renew" },
  { row: "Setup", us: "Guided setup in minutes, CSV import built in", them: "Separate setup, training and support for each" },
];

/** Everything included, grouped: the platform-wide capabilities a customer gets on day one. All of them exist in the product. */
export const CAPABILITIES: { title: string; icon: IconKey; items: string[] }[] = [
  { title: "AI", icon: "brain", items: ["Ask AI in every product", "Business intelligence in plain language", "AI assistants on your knowledge", "AI website chatbot", "Voice AI conversations", "AI social content & images", "AI-assisted SEO", "AI help assistant"] },
  { title: "Automation", icon: "workflow", items: ["Trigger → Condition → Action workflows", "Ready-made templates", "Email and in-app notifications", "Approvals and reminders", "Signed webhooks", "Run history for every workflow"] },
  { title: "Your brand", icon: "target", items: ["Logo, name and colours", "Custom domains with SSL", "Branded emails and PDFs", "Multiple website themes", "Your own push notifications", "Your own app icon and name"] },
  { title: "Every device", icon: "rocket", items: ["Web app on any browser", "Installable PWA", "Android and iOS apps", "Windows, macOS and Linux apps", "Push notifications", "Works on phone, tablet and desktop"] },
  { title: "Control", icon: "shield", items: ["Choose products separately", "Product-specific roles and permissions", "Audit logs within each product", "Separate product sessions and sign-in histories", "Company data isolation in each product", "Encrypted secrets"] },
  { title: "Data & insight", icon: "chart", items: ["Live dashboards in every product", "Insights based on each product's own records", "Saved filters", "CSV import with validation", "CSV export", "Search within each product"] },
  { title: "Website & growth", icon: "globe", items: ["Drag-and-drop page builder", "Blog, careers and products", "Forms straight into SelfRun DealFlow AI", "Offers, coupons and referrals", "Wallet and reward credits", "SEO audits and rank tracking"] },
  { title: "People & portals", icon: "users", items: ["Employee self-service", "Client & student portal", "Team chat and meetings", "Announcements", "Help center and support desk", "Online tests and certificates"] },
];

/** What an AI-powered business gains, in the platform's own terms. */
export const AI_BENEFITS: { title: string; text: string; icon: IconKey }[] = [
  { title: "Hours back every week", text: "Follow-ups, reminders, approvals and notifications run on their own.", icon: "clock" },
  { title: "Decisions from live data", text: "Ask a question, get the answer from your real records — with the working shown.", icon: "brain" },
  { title: "Nothing slips through", text: "Overdue leads, invoices, leaves and tasks are chased automatically.", icon: "check" },
  { title: "Grow without the busywork", text: "Add people and products without adding admin. The platform scales with you.", icon: "rocket" },
  { title: "Always on", text: "Automations and AI assistants keep working nights, weekends and holidays.", icon: "bolt" },
  { title: "Safe by design", text: "AI reads only what the asker may see, and every action is in the audit log.", icon: "shield" },
];

/** The kinds of software a business usually buys separately, and the product that replaces each one. */
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
  { title: "Choose handoffs", text: "Products stay independent; connect only the workflows you need.", icon: "layers", points: ["Configure a deal-to-client handoff", "Trigger an invoice from a milestone", "Connect approved payroll workflows", "Send signed webhooks to your tools"] },
  { title: "Automate", text: "Configured workflows handle follow-up.", icon: "workflow", points: ["Triggers from enabled products", "Notifications and emails", "Approvals and reminders", "Signed webhooks"] },
  { title: "Decide", text: "AI turns records into answers.", icon: "brain", points: ["Ask in plain language", "Answers with the working shown", "AI content and assistants", "Live dashboards everywhere"] },
];

/** Extra screens captured per product (desktop, tablet and mobile), shown under the product's feature list. */
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
 * pace and switches on only the products it needs. Each phase names real products and what they change; no figures are claimed.
 */
export interface GrowthPhase {
  id: string;
  when: string;
  title: string;
  goal: string;
  icon: IconKey;
  /** Product keys (Product Registry keys) to switch on in this phase. */
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
    actions: ["Register with your work email and start on the free-forever plan", "Complete the guided setup: profile, departments, the products you want", "Add your logo, name and colours so everything carries your brand", "Invite your team with roles and permissions", "Import your leads, clients and employees from CSV"],
    outcomes: ["A branded product suite your team can access today", "Separate sign-ins and permissions for each product", "Import existing data into the product that uses it"],
    before: "Spreadsheets, email threads and software from unrelated vendors.", after: "Independent products under your brand, managed as one suite.",
  },
  {
    id: "organise", when: "Week 1", title: "Capture and organise", goal: "Keep enquiries and people records organised in the products built for them.", icon: "target", panels: ["lms", "hrms", "cms"], screen: "lms",
    actions: ["Connect your website forms so enquiries become leads with an owner and a due date", "Set up your pipeline and assign leads by rule", "Build the employee directory with departments and documents", "Publish your website on your own domain with SSL"],
    outcomes: ["No enquiry without an owner", "A people directory HR and managers both trust", "A live website, with an optional configured handoff to your CRM"],
    before: "Enquiries in inboxes, staff details in files, a website that needs a developer.", after: "Every lead owned, every person on record, a website your team edits.",
  },
  {
    id: "automate", when: "Month 1", title: "Automate the busywork", goal: "Let the platform do the follow-ups, approvals and reminders.", icon: "workflow", panels: ["workspace", "fms", "pms", "hrms"], screen: "automations",
    actions: ["Switch on automations: new-lead alerts, overdue follow-ups, leave routing, payment reminders", "Raise invoices with payment links and let customers pay online", "Run projects with tasks, timesheets and milestone billing", "Move attendance, leave and payroll onto the platform"],
    outcomes: ["Follow-ups and reminders happen without anyone chasing", "Configured payment workflows can update the relevant finance records", "Automations reduce manual re-entry where you enable them"],
    before: "Someone remembers to chase, approve and re-type.", after: "Your configured automations notify, request approvals, remind and record each run.",
  },
  {
    id: "see", when: "Quarter 1", title: "See everything and decide faster", goal: "Use product-specific analytics and connect approved sources when you need a broader view.", icon: "brain", panels: ["intelligence", "prms", "sop", "workspace"], screen: "intelligence",
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
    outcomes: ["Your team and clients use apps that carry your brand", "Hiring, assessment and training run on one record", "More people and more products — without more tools or more admin"],
    before: "Every new hire or department means another tool to buy and manage.", after: "Choose independent products as you grow and manage the suite from one place.",
  },
];
