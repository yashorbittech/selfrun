/**
 * The documentation library: guides for running a company on SelfRun AI. Each guide is written from what the product really does
 * (its screens, settings and panels) and is tied to a real screenshot. No pricing figures, limits or dates are stated here: the
 * pricing page and the workspace's own billing screen are the source for those.
 */
import { RESOURCES } from "@/lib/saas/content";

export type DocCategory = "Getting started" | "Workspace & people" | "Your brand & apps" | "Automation & AI" | "Sales & marketing" | "People & finance" | "Operations" | "Security & admin";

export interface DocSection {
  heading: string;
  body?: string[];
  list?: string[];
  /** A real screen (key under /public/selfrun/screens) shown with this section. */
  shot?: string;
  tip?: string;
}
export interface Doc {
  slug: string;
  title: string;
  summary: string;
  category: DocCategory;
  readMinutes: number;
  /** The screen shown at the top of the guide. */
  shot: string;
  /** Panel key the guide belongs to, for linking to its feature page. */
  panel?: string;
  sections: DocSection[];
}

export const DOC_CATEGORIES: { name: DocCategory; blurb: string }[] = [
  { name: "Getting started", blurb: "From a new account to a working company workspace." },
  { name: "Workspace & people", blurb: "Users, roles, data import and the dashboard." },
  { name: "Your brand & apps", blurb: "Logo, domain, themes, push and your own apps." },
  { name: "Automation & AI", blurb: "Workflows, AI questions and AI assistants." },
  { name: "Sales & marketing", blurb: "Leads, website, social media and SEO." },
  { name: "People & finance", blurb: "HR, payroll, invoices and projects." },
  { name: "Operations", blurb: "Procurement, training, procedures and documents." },
  { name: "Security & admin", blurb: "Sessions, audit log, billing and integrations." },
];

const SHOT: Record<string, { shot: string; category: DocCategory; panel?: string }> = {
  "getting-started": { shot: "workspace", category: "Getting started", panel: "workspace" },
  "automation-basics": { shot: "automations", category: "Automation & AI", panel: "workspace" },
  "ask-your-business": { shot: "intelligence", category: "Automation & AI", panel: "intelligence" },
  "your-website": { shot: "cms", category: "Sales & marketing", panel: "cms" },
  "users-and-permissions": { shot: "workspace-users", category: "Workspace & people", panel: "workspace" },
};

const migrated: Doc[] = RESOURCES.map((r) => ({
  slug: r.slug,
  title: r.title,
  summary: r.summary,
  category: SHOT[r.slug]?.category ?? "Getting started",
  readMinutes: r.readMinutes,
  shot: SHOT[r.slug]?.shot ?? "workspace",
  panel: SHOT[r.slug]?.panel,
  sections: r.sections.map((s) => ({ heading: s.heading, body: s.body })),
}));

const d = (doc: Doc): Doc => doc;

const added: Doc[] = [
  d({
    slug: "brand-your-workspace", title: "Brand your workspace: logo, name and theme", summary: "Make every panel, email and PDF carry your company's identity.", category: "Your brand & apps", readMinutes: 4, shot: "branding", panel: "workspace",
    sections: [
      { heading: "Where branding lives", body: ["Open Workspace → Branding. One screen controls how your company appears across every panel, the emails the platform sends for you and the PDFs it generates."] },
      { heading: "Logo and name", body: ["Upload your logo (square images work best; PNG, JPG or WebP) and set your company name. The optional accent part lets you colour half of a two-part name, the way a wordmark often is."], list: ["The logo appears in the sidebar of every panel and in your installable and downloadable apps", "The name is used in page titles, emails and notifications", "A live preview shows how it will look before you save"] },
      { heading: "Choose a theme", body: ["Pick a theme from the library — colours, fonts and corner style apply to your website and to every panel. You can switch at any time and customise any theme further from the Website → Themes screen."], shot: "cms-theme", tip: "Branding changes apply to the whole company at once, so decide on them early and the rest of your setup inherits them." },
      { heading: "What it affects", list: ["All panels your team works in", "Your public website", "Emails, push notifications and PDFs", "Your installable app, mobile apps and desktop app"] },
    ],
  }),
  d({
    slug: "your-own-apps", title: "Your own apps: install, Android, iOS and desktop", summary: "Give your team a web app, phone apps and a desktop app — all with your name and icon.", category: "Your brand & apps", readMinutes: 6, shot: "apps", panel: "workspace",
    sections: [
      { heading: "Three ways to take the workspace with you", body: ["Workspace → Apps & downloads gives your company its own apps. Nothing about SelfRun is built into them: each app asks your workspace who it is — your name, icon and colours — every time it starts."] },
      { heading: "Installable app (PWA)", body: ["The fastest route. Open your workspace address in a browser and install it to the home screen or desktop. It works on Android, iPhone and iPad, Windows, macOS, Linux and ChromeOS, opens in its own window and supports push notifications."], list: ["Android and Chrome-based browsers: use the browser's Install or Add to Home screen option", "iPhone and iPad (Safari): Share → Add to Home Screen", "Desktop browsers: use the install icon in the address bar", "The Apps screen shows a QR code so people can open the address from their phone"] },
      { heading: "Mobile apps (Android and iOS)", body: ["For a presence in the stores, the platform generates your Android and iOS apps from your branding. Android produces an installable APK and an Android Studio project you can sign and publish to Google Play. iOS produces an Xcode project that you open in Xcode, sign with your own Apple Developer team and submit to the App Store — iPhone apps cannot be installed without Apple signing."] },
      { heading: "Desktop app (Windows, macOS, Linux)", body: ["The desktop app is the same workspace in its own window, with native notifications and a system-tray icon. Download the installer for each operating system from the Apps screen."] },
      { heading: "Keeping them current", body: ["Because the apps load your workspace, changes to branding, panels and features appear without reinstalling anything."], tip: "Start with the installable app for the whole team; add store apps when you want a store listing." },
    ],
  }),
  d({
    slug: "custom-domain", title: "Connect your own domain with automatic SSL", summary: "Put your website and workspace on your own address.", category: "Your brand & apps", readMinutes: 5, shot: "domains", panel: "website",
    sections: [
      { heading: "Your addresses", body: ["Every company starts with its own workspace address. Under Workspace → Custom domains you can also put your website on your own domain — for example www.yourcompany.com — and your panels on an app address such as app.yourcompany.com."] },
      { heading: "Connect a domain", list: ["Type your domain and choose Add domain", "Copy the DNS records the screen shows (a verification TXT record and the address records for your website and panels)", "Add them at your domain provider's DNS settings", "Return and verify — the platform checks ownership and issues the SSL certificate automatically"], shot: "domains", tip: "DNS changes can take a little while to spread. If verification does not succeed at once, try again later." },
      { heading: "Good to know", list: ["Your free workspace address keeps working while you set up", "One screen lists every domain with its status", "Certificates renew on their own"] },
    ],
  }),
  d({
    slug: "import-your-data", title: "Import leads, clients and employees from CSV", summary: "Bring existing records in with validation that tells you what to fix.", category: "Workspace & people", readMinutes: 4, shot: "workspace", panel: "workspace",
    sections: [
      { heading: "What you can import", body: ["Workspace → Import data brings leads, clients and employees in from CSV files — the fastest way to start with real records instead of an empty system."] },
      { heading: "How it works", list: ["Choose what you are importing and download the template", "Fill it in your spreadsheet and save as CSV", "Upload it — every row is validated before anything is saved", "Fix the rows the importer lists, then import the rest"] },
      { heading: "Safe by design", body: ["Imports never trigger workflows, so bringing in existing records will not flood anyone with notifications. Each import is recorded in the audit log."] },
    ],
  }),
  d({
    slug: "invite-your-team", title: "Invite your team and choose what each person can do", summary: "Roles per panel, fine-grained permissions and seat limits.", category: "Workspace & people", readMinutes: 4, shot: "workspace-users", panel: "workspace",
    sections: [
      { heading: "Invitations", body: ["From Workspace → Users, roles & seats, invite someone by email and give them a role. They accept the invitation, verify their email and sign in with the same login for every panel they are allowed to use."] },
      { heading: "Roles and permissions", body: ["Each panel has its own roles — for example administrator, manager and employee. On top of a role you can grant or remove a single permission for one person, such as exporting reports or approving payments."], shot: "workspace-users" },
      { heading: "Seats", body: ["The plan sets how many people your company can have. The Users screen and Usage show how many seats you have used."] },
      { heading: "Review regularly", body: ["The audit log shows who changed what, so you can review access as the team changes."] },
    ],
  }),
  d({
    slug: "first-automations", title: "Build your first three automations", summary: "Start from templates: new-lead alerts, invoice-paid emails and leave routing.", category: "Automation & AI", readMinutes: 5, shot: "automations", panel: "workspace",
    sections: [
      { heading: "Start from a template", body: ["Open Workspace → Automations. The “Start from a template” list holds ready-made workflows — new lead notifies sales, invoice paid emails finance, a completed task notifies project managers, a leave request notifies HR. Choose Add and adjust."], shot: "automations" },
      { heading: "Three to switch on first", list: ["New lead → notify the owner, so no enquiry waits", "Invoice paid → email finance, so receipts and the ledger are never forgotten", "Leave requested → notify HR or the manager, so approvals move"] },
      { heading: "Trigger, condition, action", body: ["Every workflow has a trigger (what happened), optional conditions (only when it matters) and actions (notify, email, call a signed webhook). Switch a workflow off without deleting it, and use the run history to see what happened and why."] },
      { heading: "Stay in control", body: ["Use approvals and notifications rather than automatic changes wherever a person should decide — especially for money and customer messages."] },
    ],
  }),
  d({
    slug: "leads-and-pipeline", title: "Capture leads and run your pipeline", summary: "From a website form to a won deal, with owners and due dates.", category: "Sales & marketing", readMinutes: 5, shot: "lms", panel: "lms",
    sections: [
      { heading: "Where leads come from", body: ["Leads arrive from your website forms, campaigns, manual entry and CSV import. Each one lands in the CRM & Sales panel with its source, so you can see what brings enquiries in."] },
      { heading: "Work the pipeline", list: ["Every lead has an owner, a status (New, In progress, Completed, Rejected) and a due date", "Notes and two-way messages keep the history on the lead", "Pending-task alerts flag leads untouched for several days", "Saved filters segment by category, status, source and date range"], shot: "lms-leads" },
      { heading: "Measure what works", body: ["The dashboard shows pipeline health, campaign spend, attributed leads, cost per lead, qualified leads, won deals, revenue and ROI. Export the current view to CSV at any time."] },
      { heading: "When a deal is won", body: ["Marking a lead won can create the client record, so projects and invoices start without re-entering details."] },
    ],
  }),
  d({
    slug: "publish-website", title: "Build and publish your website", summary: "Pages, blog, forms, themes, menus and the publish flow.", category: "Sales & marketing", readMinutes: 6, shot: "cms-pages", panel: "cms",
    sections: [
      { heading: "A site from minute one", body: ["Every new company starts with a neutral starter website that is already live. Website → Pages lists every page; edit them in the builder."] },
      { heading: "Pages and content", list: ["Compose pages from sections; changes are saved as drafts", "Blog posts, services, careers and products are managed as content", "Forms send enquiries straight to your CRM and to the inboxes you choose", "The media library keeps images and files"], shot: "cms-pages" },
      { heading: "Look and feel", body: ["Website → Themes shows the theme library with live preview. Customise colours, fonts and components, then set up Menus, the Footer and Site identity (brand, contact and social details)."], shot: "cms-theme" },
      { heading: "Publish safely", body: ["Review pages that are waiting, then publish. Maintenance mode lets you work on the site without visitors seeing half-finished changes."] },
    ],
  }),
  d({
    slug: "ai-chatbot-website", title: "Put an AI chatbot on your website", summary: "Answer visitors around the clock from your own knowledge base.", category: "Automation & AI", readMinutes: 5, shot: "chatbot", panel: "cms",
    sections: [
      { heading: "How it works", body: ["The website chatbot answers visitors from a knowledge base you control. Under Website → AI Chatbot you add your content, set the chatbot's behaviour in AI Config, and review every conversation."], shot: "chatbot" },
      { heading: "Set it up", list: ["Add your knowledge: the pages, FAQs and documents the chatbot may answer from", "Set tone and limits in AI Config", "Switch it on for your website", "Review conversations and improve the knowledge base from real questions"] },
      { heading: "Voice conversations", body: ["Conversation AI adds voice: choose a voice and behaviour in the voice configuration, and every call is logged alongside chats."] },
      { heading: "Stay in control", body: ["The chatbot answers only from what you gave it, every conversation is stored for review, and AI usage counts against your plan's allowance."] },
    ],
  }),
  d({
    slug: "ai-assistants", title: "Create AI assistants for your team and customers", summary: "Bots with your instructions and knowledge files, with access rules and cost tracking.", category: "Automation & AI", readMinutes: 5, shot: "aibots", panel: "aibots",
    sections: [
      { heading: "What an assistant is", body: ["An assistant is a bot with its own instructions and knowledge files. Use one for staff questions, another for customers — each answers from its own material."] },
      { heading: "Create and share", list: ["Create a bot: name, instructions and knowledge files", "Choose who can use it: the team, customers, or only certain people", "People start a chat from Start new chat or Find a bot", "Managers review All chats"], shot: "aibots-bots" },
      { heading: "Track usage and cost", body: ["Usage and cost are tracked per bot, and every change is in the audit trail."] },
    ],
  }),
  d({
    slug: "invoices-and-payments", title: "Send invoices and get paid online", summary: "Invoices, payment links, receipts and the ledger — kept in step automatically.", category: "People & finance", readMinutes: 6, shot: "fms", panel: "fms",
    sections: [
      { heading: "The money-in flow", body: ["Finance → Invoices creates and sends invoices. Each can carry a payment link, so the customer pays online; the receipt and the ledger update on their own."], shot: "fms-invoices" },
      { heading: "Everything around the invoice", list: ["Credit notes adjust an invoice cleanly", "Receipts and refunds keep a trail", "Receivables shows everything customers owe", "Payment links can also be created for a student fee or a client project"] },
      { heading: "Connect your payment account", body: ["To collect through your own gateway account, connect it under Workspace → Payment account (it is the same account used for paying salaries)."] },
      { heading: "Chase what is overdue", body: ["Switch on the overdue-invoice automation to remind customers and notify your finance team."] },
    ],
  }),
  d({
    slug: "run-payroll", title: "Run payroll and give employees self-service", summary: "Attendance, leave, salary revisions, payslips and payouts that post to Finance.", category: "People & finance", readMinutes: 6, shot: "hrms-payroll", panel: "hrms",
    sections: [
      { heading: "Set up people first", body: ["Add employees (or import them), then departments and reporting lines. Leave types, balances and holidays are configured in the HR panel."], shot: "hrms-employees" },
      { heading: "Run a payroll month", list: ["Review attendance and leave for the month", "Run payroll for the period", "Check salary revisions and payslips", "Pay salaries — payouts post to Finance automatically"], shot: "hrms-payroll" },
      { heading: "Employee self-service", body: ["Employees check in, request leave, and view their salary, payslips and documents themselves, so HR stops answering the same questions."] },
    ],
  }),
  d({
    slug: "projects-and-timesheets", title: "Deliver projects with tasks, timesheets and costing", summary: "Boards, timelines, time approval and profitability.", category: "People & finance", readMinutes: 5, shot: "pms", panel: "pms",
    sections: [
      { heading: "Plan the project", body: ["Create a project with milestones and tasks. See them as a board, a task list or a timeline, and on the calendar."], shot: "pms-projects" },
      { heading: "Track time and cost", list: ["Team members log time on a timesheet", "Managers approve timesheets", "Costing compares cost with budget so you see profitability before the project ends"] },
      { heading: "Bill from milestones", body: ["When a milestone completes it can raise the invoice in Finance, so billing never waits for someone to remember."] },
    ],
  }),
  d({
    slug: "procurement-and-assets", title: "Control purchases, vendors and company assets", summary: "Requests, approvals, RFQs, orders, goods receipt, invoices and an asset register.", category: "Operations", readMinutes: 5, shot: "prms", panel: "prms",
    sections: [
      { heading: "From request to payment", list: ["An employee raises a purchase request; it follows the approval chain for its amount", "Run an RFQ and compare vendors, then issue the purchase order", "Record the goods receipt, then match order, receipt and invoice", "The matched invoice becomes a payable in Finance"], shot: "prms-purchase-orders" },
      { heading: "Assets and subscriptions", body: ["Register hardware and assign it to people, track software subscriptions with renewal alerts, and keep infrastructure and inventory in one place."] },
      { heading: "Self-service", body: ["Employees raise and follow their own requests and expense claims from My requests and My expenses."] },
    ],
  }),
  d({
    slug: "run-training", title: "Run training programs, batches and certificates", summary: "Applications, batches, classes, fees, assignments and verifiable certificates.", category: "Operations", readMinutes: 5, shot: "tms", panel: "tms",
    sections: [
      { heading: "Programs and batches", body: ["Create programs, then batches with a schedule, mentors and capacity. The batch calendar shows them all together."], shot: "tms-students" },
      { heading: "Students", list: ["Applications arrive as a list or a board", "Accepted students join a batch and get their own portal", "Track attendance, assignments and live projects", "Collect fees with reminders, and issue certificates that can be verified publicly"] },
      { heading: "Assessments", body: ["Pair training with the Online Tests panel for exams and automatic evaluation."] },
    ],
  }),
  d({
    slug: "write-and-assign-sops", title: "Write SOPs and track who has read them", summary: "Versions, assignments, acknowledgements and review reminders.", category: "Operations", readMinutes: 4, shot: "sop", panel: "sop",
    sections: [
      { heading: "Write once", body: ["Create a procedure with the block editor or a template. Every change creates a new version, so the history is always there."], shot: "sop-library" },
      { heading: "Assign and prove", list: ["Assign to people, teams, departments or roles", "People acknowledge what they have read; overdue acknowledgements escalate", "Compliance reports show who is up to date", "Review and expiry schedules remind owners before a procedure goes stale"] },
    ],
  }),
  d({
    slug: "documents-and-vault", title: "Generate documents and keep credentials safe", summary: "Templates, approvals and signatures — and an encrypted vault for what must not be lost.", category: "Operations", readMinutes: 5, shot: "lpms", panel: "lpms",
    sections: [
      { heading: "Documents from templates", body: ["Build reusable templates, create documents from them, route them through the approval workflow for their type and collect signatures. The register keeps status and history."], shot: "lpms-documents" },
      { heading: "A vault for credentials and files", body: ["Digi Locker holds company and per-client vaults for credentials, documents, links and notes. Records are encrypted and shared record by record; expiry alerts warn before anything lapses."], shot: "dlms-credentials" },
    ],
  }),
  d({
    slug: "social-media-and-seo", title: "Plan social media with AI and improve your SEO", summary: "Campaigns, AI drafts, approvals — and audits, rankings and fix tasks.", category: "Sales & marketing", readMinutes: 6, shot: "smms", panel: "smms",
    sections: [
      { heading: "Social media", list: ["Write a campaign brief and let AI suggest a strategy", "Turn one idea into posts adapted for each platform, with generated images", "Choose the approval step before anything publishes", "Schedule posts and track performance"], shot: "smms-posts" },
      { heading: "SEO", list: ["Audit the site for technical, on-page and content issues", "Track keywords, rankings, competitors and backlinks", "Turn issues into tasks with owners", "Manage the sitemap and robots.txt that drive your live website"], shot: "seo-keywords" },
    ],
  }),
  d({
    slug: "security-sessions-audit", title: "Sessions, devices and the audit log", summary: "See where you are signed in and who did what across every panel.", category: "Security & admin", readMinutes: 4, shot: "workspace-audit", panel: "workspace",
    sections: [
      { heading: "Your sessions and devices", body: ["Open Profile & Settings from the user block at the bottom of the sidebar and choose Sessions & Devices. Every signed-in device is listed with where it signed in from; log out one, all others, or everywhere."] },
      { heading: "Sign-in history", body: ["Sign-ins, failed attempts and sign-outs are kept for 180 days, with an alert flag when a sign-in comes from a country the account has not used before."] },
      { heading: "The audit log", body: ["Workspace → Audit log is the one place for who did what, and when — across every panel. Filter by panel, action and date, and export to CSV."], shot: "workspace-audit" },
    ],
  }),
  d({
    slug: "plans-and-billing", title: "Plans, usage and billing", summary: "How plans work, what is included and how to change.", category: "Security & admin", readMinutes: 4, shot: "workspace", panel: "workspace",
    sections: [
      { heading: "What a plan sets", body: ["Every plan includes every panel and every feature. A plan sets the number of people and the allowances for storage, AI, email and voice. The Free plan is free forever for one person."] },
      { heading: "See what you use", body: ["Workspace → Usage shows seats, AI, email, voice and storage against your plan."] },
      { heading: "Change plan or cancel", body: ["Upgrade or move down at any time from Plan & billing. Invoices, credit notes and payments for your subscription are under Invoices & payments."] },
    ],
  }),
  d({
    slug: "integrations-and-webhooks", title: "Integrations: payments, email, AI and webhooks", summary: "Connect your gateway, email sender and AI key, and send signed webhooks.", category: "Security & admin", readMinutes: 4, shot: "workspace", panel: "workspace",
    sections: [
      { heading: "What you can connect", list: ["A payment gateway account to collect invoice payments and pay salaries", "Your own email sender for workflow and transactional emails", "Your own AI provider key, so AI usage runs on your account", "Social platforms for publishing", "Signed webhooks from any workflow to the systems you already use"] },
      { heading: "Where to find them", body: ["Workspace → Integrations lists what is connected and what is not, and Workspace → Automations is where webhooks are used as workflow actions."] },
    ],
  }),
  d({
    slug: "client-and-student-portal", title: "Give clients, students and applicants a portal", summary: "One branded place for projects, invoices, tests, certificates and messages.", category: "Operations", readMinutes: 4, shot: "workspace", panel: "portal",
    sections: [
      { heading: "Who it is for", body: ["The portal is where people outside your company see what concerns them: clients follow projects and pay invoices, students follow their program and download certificates, applicants track their application and take assessments."] },
      { heading: "How people join", body: ["People register themselves or you invite them. Each person sees only their own records, and your team manages portal users from the Workspace."] },
      { heading: "Keep them engaged", body: ["Rewards, referrals and a wallet are built in, so the portal gives people a reason to come back."] },
    ],
  }),
];

export const DOCS: Doc[] = [...migrated, ...added];
export const docBySlug = (slug: string) => DOCS.find((x) => x.slug === slug);
