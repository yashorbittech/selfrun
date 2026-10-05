/**
 * Marketing content of the SaaS product website. Everything here describes the product — what it does for any
 * business that subscribes — and nothing about a particular customer.
 */

export interface Feature {
  title: string;
  body: string;
  icon: IconKey;
}

export type IconKey =
  | "bolt" | "brain" | "users" | "wallet" | "layers" | "shield" | "globe" | "chart" | "workflow" | "chat" | "file" | "target"
  | "cart" | "book" | "megaphone" | "search" | "bot" | "lock" | "clock" | "plug" | "rocket" | "check" | "building" | "graduation";

/** Home + Features page: what the platform gives every business. */
export const CORE_FEATURES: Feature[] = [
  { icon: "layers", title: "One platform instead of twenty tools", body: "Sales, HR and payroll, finance, projects, procurement, training, documents, your website and team chat share one login, one database and one set of permissions — no more copying data between apps." },
  { icon: "workflow", title: "Automations that run on their own", body: "Build Trigger → Condition → Action workflows with no code. When a lead is won, a leave is approved or an invoice goes overdue, the right people are notified and the right records are updated automatically." },
  { icon: "brain", title: "AI that knows your business", body: "Ask questions in plain language and get answers built from your real records — with the calculation shown. AI assistants, drafting and summaries work across every module and respect each person's access." },
  { icon: "globe", title: "A website that manages itself", body: "Every workspace comes with a complete website builder: pages, blog, forms, SEO, themes and your own domain with automatic SSL — edited by your team, published in one click." },
  { icon: "shield", title: "Built for security and control", body: "Role-based access down to individual actions, a full audit trail, encrypted credentials and strict isolation between companies. You decide who can see and change what." },
  { icon: "chart", title: "Live numbers, not month-end surprises", body: "Dashboards for every module and a company-wide view for leadership. Filter by date, department or owner and export what you need — always from live data." },
];

export interface ModuleCopy {
  headline: string;
  summary: string;
  capabilities: string[];
  automations: string[];
  outcome: string;
  icon: IconKey;
}

/** Long-form copy per module, keyed by the Panel Registry key. Names and short descriptions come from the registry itself. */
export const MODULE_COPY: Record<string, ModuleCopy> = {
  lms: {
    icon: "target",
    headline: "Turn enquiries into customers — without anything slipping through",
    summary: "Capture leads from your website, forms, campaigns and imports, move them through a visual pipeline, and follow up on time every time.",
    capabilities: ["Lead capture from website forms, ads and CSV import", "Pipeline stages with owners, due dates and notes", "Two-way messages with leads and portal users", "Campaign, offer and coupon tracking with performance reports", "Referral and wallet-credit programs", "Career applications and applicant tracking"],
    automations: ["Assign new leads by rule and notify the owner", "Remind the owner when a follow-up is overdue", "Send a welcome message when a lead is created", "Create a client record when a deal is won"],
    outcome: "Faster response times, a clean pipeline and a clear view of which campaigns actually bring revenue.",
  },
  hrms: {
    icon: "users",
    headline: "From hiring to payroll, every people process in one place",
    summary: "Employee records, attendance, leave, holidays, recruitment and payroll — with self-service for employees and approvals for managers.",
    capabilities: ["Employee directory, documents and organisation tree", "Attendance with monthly calendar and reports", "Leave types, balances, requests and approvals", "Recruitment pipeline from application to offer", "Payroll runs, salary revisions and payslips", "Employee self-service: my attendance, leave, salary and documents"],
    automations: ["Notify the manager when a leave request is filed", "Create the employee record when an offer is accepted", "Alert HR before documents or probation periods expire", "Post payroll results to Finance automatically"],
    outcome: "Hours of HR admin saved every week and employees who always know where they stand.",
  },
  fms: {
    icon: "wallet",
    headline: "Accounting, invoicing and cash flow you can trust",
    summary: "Invoices, bills, payments, banking, reconciliation and financial reports — connected to every other module so numbers are never re-entered.",
    capabilities: ["Invoices, credit notes, bills and debit notes", "Receipts, payment links and payouts", "Bank and cash accounts with reconciliation", "Chart of accounts, general ledger and trial balance", "Profit & loss, balance sheet, cash flow and tax reports", "Approvals, advances, expenses and numbering rules"],
    automations: ["Send payment reminders on overdue invoices", "Route large expenses for approval", "Post salary and vendor payments from HR and Procurement", "Notify finance when a payment link is paid"],
    outcome: "Books that close faster, fewer payment delays and reports you can hand to your accountant as they are.",
  },
  pms: {
    icon: "layers",
    headline: "Deliver projects on time and on budget",
    summary: "Clients, projects, tasks, timesheets and costing with boards, timelines and calendars your whole team can follow.",
    capabilities: ["Clients with contacts and project history", "Projects with boards, task lists and timelines", "Timesheets with approvals", "Budget, costing and profitability per project", "My tasks and my projects for every team member", "Project documents and discussion"],
    automations: ["Notify the assignee when a task is assigned or overdue", "Raise an invoice when a milestone is completed", "Warn the manager when a project nears its budget"],
    outcome: "Clear ownership, predictable delivery and profitability you can see before the project ends.",
  },
  prms: {
    icon: "cart",
    headline: "Control spend from request to payment",
    summary: "Requisitions, RFQs, purchase orders, goods receipts, vendor invoices, inventory and assets — with approvals at every step.",
    capabilities: ["Purchase requests with approval chains", "RFQs and vendor comparison", "Purchase orders, GRN and three-way invoice matching", "Vendor directory and subscription tracking", "Inventory with stock movements", "Asset register, infrastructure and expense claims"],
    automations: ["Route requests to the right approver by amount", "Alert before subscriptions renew", "Create a payable in Finance when an invoice is matched"],
    outcome: "Spend that is approved, tracked and matched — with no surprise invoices.",
  },
  tms: {
    icon: "graduation",
    headline: "Run training programs from enrolment to certificate",
    summary: "Programs, batches, classes, students, assignments, payments and certificates for institutes and corporate training teams.",
    capabilities: ["Programs, batches and class schedules", "Applications and student records", "Attendance, assignments and projects", "Fee tracking and payments", "Certificates with verification", "Student portal and mentor tools"],
    automations: ["Notify students about upcoming classes", "Issue a certificate when a program is completed", "Remind students about pending fees"],
    outcome: "Organised batches, engaged students and certificates issued without manual work.",
  },
  messenger: {
    icon: "chat",
    headline: "Team conversations that stay next to the work",
    summary: "Channels, direct messages, announcements, meetings and calls inside your workspace — no separate chat subscription.",
    capabilities: ["Channels and direct messages with files", "Company announcements with read tracking", "Meetings and group calls", "Search across messages and files", "Presence and notifications"],
    automations: ["Post workflow results into a channel", "Notify a channel when a deal is won or a task is overdue"],
    outcome: "Fewer tools, fewer lost threads and decisions that stay linked to the record they were about.",
  },
  sop: {
    icon: "book",
    headline: "Document how your business runs — and prove people follow it",
    summary: "Create, version and publish standard operating procedures, assign them to people and track acknowledgements.",
    capabilities: ["SOP library with categories, owners and versions", "Block editor with templates", "Assignments to people, teams, departments or roles", "Acknowledgement tracking and compliance reports", "Review and expiry schedule", "Full audit trail"],
    automations: ["Notify assignees of new or updated procedures", "Escalate overdue acknowledgements", "Remind owners before a review is due"],
    outcome: "Consistent execution, faster onboarding and audit-ready compliance records.",
  },
  lpms: {
    icon: "file",
    headline: "Documents and agreements, generated and tracked",
    summary: "Document templates, approval workflows, signatures and certificates in one place.",
    capabilities: ["Templates with reusable blocks", "Maker types and approval workflows", "Document register with status and history", "Signatures and approvals", "Categories and audit log"],
    automations: ["Generate documents from templates", "Route documents for approval and signature", "Notify when a document is issued or expires"],
    outcome: "Professional documents produced in minutes, with a clear record of who approved what.",
  },
  dlms: {
    icon: "lock",
    headline: "A secure vault for company and client documents",
    summary: "Store credentials, files, links and notes with encryption, access control and expiry alerts.",
    capabilities: ["Company and client vaults", "Encrypted credentials and documents with version history", "Per-record access control", "Expiry reminders", "Activity log"],
    automations: ["Alert owners before a document or credential expires", "Notify when a record is shared or changed"],
    outcome: "Important documents always findable, protected and never expired by surprise.",
  },
  ots: {
    icon: "check",
    headline: "Assess candidates, employees and students at scale",
    summary: "Question banks, timed online tests, automatic evaluation, certificates and analytics.",
    capabilities: ["Question bank with categories and bulk import", "Timed tests with sections and randomisation", "Assignments for candidates, employees and students", "Automatic and manual evaluation", "Results, analytics and certificates"],
    automations: ["Assign a test when an application reaches a stage", "Notify evaluators of pending answers", "Issue a certificate on passing"],
    outcome: "Objective hiring and training decisions backed by consistent assessments.",
  },
  aibots: {
    icon: "bot",
    headline: "Build AI assistants trained on your own knowledge",
    summary: "Create bots with your instructions and files, give your team and customers access, and track usage and cost.",
    capabilities: ["Bots with custom instructions and knowledge files", "Team and customer chat", "Conversation history and audit", "Usage and cost tracking", "Access modes per bot"],
    automations: ["Answer customer questions around the clock", "Hand over to a person when the bot is unsure"],
    outcome: "Instant, consistent answers for staff and customers, grounded in your own material.",
  },
  intelligence: {
    icon: "brain",
    headline: "Ask your business anything",
    summary: "Ask questions in plain language and get answers computed from your real records, with tables, charts and a clear explanation of how each number was calculated.",
    capabilities: ["Natural-language questions across your modules", "Answers built from live data, never guessed", "Tables, charts and KPIs", "“How this was calculated” traceability", "Respects each person's access rights"],
    automations: ["Turn a recurring question into a scheduled summary"],
    outcome: "Leadership decisions in seconds instead of waiting for a report.",
  },
  smms: {
    icon: "megaphone",
    headline: "Plan, create and publish social media with AI",
    summary: "Campaigns, posts per platform, AI-assisted copy and images, approvals and publishing in one calendar.",
    capabilities: ["Campaign briefs and AI strategy", "Posts adapted for each platform", "AI copy and image generation", "Approval workflow before publishing", "Calendar and performance tracking"],
    automations: ["Route posts for approval", "Publish on schedule", "Report on campaign performance"],
    outcome: "A steady, on-brand social presence without a large content team.",
  },
  seo: {
    icon: "search",
    headline: "Be found on search — and know why",
    summary: "Technical audits, on-page analysis, keyword and ranking tracking, backlinks and a sitemap/robots manager that drives your live website.",
    capabilities: ["Site audits with prioritised issues", "On-page and content analysis", "Keyword groups and rank tracking", "Backlink monitoring", "Schema, sitemap and robots management", "Tasks and reports"],
    automations: ["Create fix tasks from audit issues", "Alert when rankings or indexing change"],
    outcome: "Higher search visibility with a clear list of what to fix next.",
  },
  cms: {
    icon: "globe",
    headline: "Your website, fully in your control",
    summary: "A complete website builder: pages, sections, blog, forms, media, navigation, themes, SEO and custom domains.",
    capabilities: ["Drag-and-drop page builder with draft and publish", "Blog, collections and forms", "Media library", "Themes with live preview", "Navigation and footer management", "Custom domain with automatic SSL"],
    automations: ["Send form submissions to your CRM and your inbox", "Notify the team when a page is waiting for approval"],
    outcome: "A professional website your team can change any day — without a developer.",
  },
  portal: {
    icon: "building",
    headline: "A branded portal for clients, students and applicants",
    summary: "Give external people one place to see their projects, invoices, tests, certificates and messages.",
    capabilities: ["Client, student and applicant dashboards", "Invoices, payments and documents", "Tests and certificates", "Messages with your team", "Rewards and referrals"],
    automations: ["Notify portal users about new invoices, messages and tests"],
    outcome: "Fewer status-update emails and a better experience for the people you serve.",
  },
  support: {
    icon: "chat",
    headline: "Get help from AI first, people when you need them",
    summary: "An AI help assistant that knows the product, a searchable help center and a request desk with attachments and status tracking.",
    capabilities: ["AI help chat that understands the screen you are on", "Searchable help articles", "Support requests with attachments", "Status tracking and notifications"],
    automations: ["Create a request directly from an AI conversation"],
    outcome: "Answers in seconds and a clear path to a person when it matters.",
  },
  workspace: {
    icon: "bolt",
    headline: "The home of your company",
    summary: "One dashboard for every module, company-wide analytics, users and roles, audit log, automations, imports and settings.",
    capabilities: ["Executive dashboard and per-module analytics", "Users, roles and fine-grained permissions", "Audit log across everything", "Workflow automations", "Data import", "Branding, domains and billing"],
    automations: ["Build your own Trigger → Condition → Action workflows"],
    outcome: "Leadership visibility and administrative control from a single screen.",
  },
  website: {
    icon: "globe",
    headline: "A public website on your own domain",
    summary: "Publish your company website, served from your domain with automatic SSL, edited through the website builder.",
    capabilities: ["Your own domain and subdomain", "Automatic SSL", "Maintenance mode", "Built-in forms and lead capture"],
    automations: ["Capture every enquiry straight into your CRM"],
    outcome: "A live website without hosting, plug-ins or developers.",
  },
};

export interface AiCapability {
  title: string;
  body: string;
  icon: IconKey;
}

export const AI_CAPABILITIES: AiCapability[] = [
  { icon: "brain", title: "Ask your business anything", body: "Type a question — “which clients are overdue by more than 30 days?” — and the AI plans a query against your real records, runs it with your permissions and answers with a table or chart plus an explanation of how it got there." },
  { icon: "bot", title: "AI assistants trained on your knowledge", body: "Create assistants with your own instructions and documents for staff or customers. Every conversation is logged, and usage and cost are tracked per bot." },
  { icon: "megaphone", title: "AI content for marketing", body: "Turn one idea into platform-specific social posts, generate images and refine the tone with a sentence. Nothing publishes without the approval step you choose." },
  { icon: "chat", title: "Context-aware help", body: "The in-product help assistant knows which screen you are on, answers how-to questions from the help center and can turn a conversation into a support request." },
  { icon: "search", title: "AI-assisted SEO and content", body: "Audits explain why an issue matters and what to change, and content analysis scores each page against what searchers expect." },
  { icon: "workflow", title: "AI in your automations", body: "Use AI steps inside workflows — summarise a conversation, draft a reply, classify an enquiry — and keep a person in the loop wherever you want one." },
];

export interface Step {
  title: string;
  body: string;
}

export const HOW_IT_WORKS: Step[] = [
  { title: "Register and choose a plan", body: "Create your account with your work email, verify it and pick the plan that fits. Every plan starts with a free trial — no card needed to look around." },
  { title: "Set up your company", body: "A short guided setup collects your business details, creates your departments, invites your team and lets you switch modules on or off. It takes minutes, not weeks." },
  { title: "Configure your website, AI and automations", body: "Choose a theme and publish your website, connect your AI and email, and switch on the automations that matter. Every setting is yours to change at any time." },
  { title: "Run your business from one place", body: "Your team works in the modules they need, leadership watches the live dashboard, and the platform handles the repetitive work in the background." },
];

export interface UseCase {
  slug: string;
  title: string;
  summary: string;
  problem: string;
  solution: string[];
  modules: string[];
  result: string;
}

export const USE_CASES: UseCase[] = [
  { slug: "lead-to-cash", title: "Lead to cash", summary: "From first enquiry to paid invoice without re-entering a single detail.", problem: "Sales, delivery and finance live in different tools. Deals are won but the invoice is raised late, and nobody sees the full picture.", solution: ["Capture enquiries from your website and campaigns into the CRM pipeline", "Create the client and project automatically when a deal is won", "Raise the invoice from the milestone and send a payment link", "Remind the client automatically and post the receipt to the ledger"], modules: ["lms", "pms", "fms"], result: "Shorter sales cycles, faster payments and revenue you can trace from campaign to cash." },
  { slug: "hire-to-retire", title: "Hire to retire", summary: "Every people process, from the job post to the final settlement.", problem: "Hiring, onboarding, attendance, leave and payroll are spread across spreadsheets and email, so HR spends its time chasing instead of helping.", solution: ["Publish jobs on your website and track applicants through stages", "Test candidates online and issue offers", "Create the employee record and onboarding SOPs on acceptance", "Run attendance, leave and payroll with employee self-service"], modules: ["hrms", "ots", "sop", "cms"], result: "A smooth employee experience and an HR team that works on people, not paperwork." },
  { slug: "procure-to-pay", title: "Procure to pay", summary: "Approved, matched and paid — with a full trail.", problem: "Purchases happen over chat and email, invoices arrive without a purchase order and approvals are hard to prove.", solution: ["Raise purchase requests with approval chains by amount", "Compare vendor quotes and issue purchase orders", "Match invoice, order and goods receipt before payment", "Post the payable and the payment to Finance"], modules: ["prms", "fms"], result: "Controlled spend, no duplicate payments and a clean audit trail." },
  { slug: "training-operations", title: "Training operations", summary: "Run programs, batches and certificates at scale.", problem: "Institutes juggle enrolments, schedules, fees and certificates across several tools and manual follow-ups.", solution: ["Take applications and enrol students into batches", "Schedule classes and track attendance and assignments", "Collect fees with payment links and reminders", "Issue verifiable certificates automatically"], modules: ["tms", "ots", "portal", "fms"], result: "Organised batches, on-time fees and certificates without manual work." },
  { slug: "always-on-marketing", title: "Always-on marketing", summary: "A website, social presence and SEO that keep working.", problem: "Marketing depends on agencies and tools that do not talk to sales, so nobody knows which effort brings customers.", solution: ["Publish and update your website without a developer", "Plan campaigns and social posts with AI and approvals", "Track rankings and fix SEO issues from audit tasks", "Capture every enquiry into the CRM and measure campaign results"], modules: ["cms", "smms", "seo", "lms"], result: "Consistent marketing that is measured against real enquiries and revenue." },
  { slug: "compliance-and-documents", title: "Compliance and documents", summary: "Procedures, agreements and records that stand up to an audit.", problem: "Policies live in shared drives, nobody can prove who read what, and documents expire unnoticed.", solution: ["Publish SOPs with versions and assign them to teams", "Track acknowledgements and escalate the overdue", "Generate agreements and certificates from templates", "Store credentials and documents with expiry alerts"], modules: ["sop", "lpms", "dlms"], result: "Audit-ready records and a team that knows the current way of working." },
];

export interface Industry {
  slug: string;
  name: string;
  summary: string;
  needs: string[];
  modules: string[];
}

export const INDUSTRIES: Industry[] = [
  { slug: "it-and-software", name: "IT & software companies", summary: "Run client projects, timesheets, billing and hiring on one platform.", needs: ["Project delivery with timesheets and costing", "Client billing from milestones", "Recruitment and online assessments", "A website and SEO that bring in enquiries"], modules: ["pms", "fms", "hrms", "ots", "cms"] },
  { slug: "education-and-training", name: "Education & training institutes", summary: "Manage programs, batches, students, fees and certificates.", needs: ["Applications and enrolment", "Batch schedules and attendance", "Fee collection and receipts", "Certificates and a student portal"], modules: ["tms", "ots", "portal", "fms"] },
  { slug: "agencies-and-consultancies", name: "Agencies & consultancies", summary: "Win clients, deliver projects and keep every engagement profitable.", needs: ["CRM pipeline and proposals", "Projects, tasks and approvals", "Time tracking and profitability", "Marketing and social content"], modules: ["lms", "pms", "fms", "smms"] },
  { slug: "trading-and-distribution", name: "Trading & distribution", summary: "Control purchasing, inventory, payments and receivables.", needs: ["Purchase requests, orders and goods receipts", "Inventory and stock movements", "Vendor invoices and payments", "Customer invoicing and collections"], modules: ["prms", "fms", "lms"] },
  { slug: "professional-services", name: "Professional services", summary: "Documents, agreements, clients and compliance in order.", needs: ["Document templates and approvals", "Secure document vault", "Client portal", "Time and billing"], modules: ["lpms", "dlms", "portal", "fms"] },
  { slug: "growing-smes", name: "Growing small & medium businesses", summary: "Replace a stack of tools with one system that grows with you.", needs: ["Everything in one login", "Start with the modules you need", "Add users and modules as you grow", "Affordable monthly pricing"], modules: ["workspace", "lms", "hrms", "fms"] },
];

export interface Faq {
  q: string;
  a: string;
}

export const FAQS: Faq[] = [
  { q: "What is SelfRun Business?", a: "SelfRun Business is a cloud platform that brings your sales, HR, finance, projects, procurement, training, documents, website and team communication into one system, with AI and workflow automation running through all of it." },
  { q: "Do I need to use every module?", a: "No. Each plan includes a set of modules and you switch on only what you need during setup. You can turn modules on or off later from your workspace settings." },
  { q: "Is there a free trial?", a: "Yes. Every plan starts with a free trial, and you can look around the product without entering a card. The trial length for each plan is shown on the pricing page." },
  { q: "How long does setup take?", a: "A guided setup takes a few minutes: company details, departments, team invitations and the modules you want. Importing existing leads, clients or employees from CSV is built in." },
  { q: "Can I use my own domain for my website?", a: "Yes. Plans that include a custom domain let you connect your own domain with automatic SSL. Every workspace also gets its own address on our domain from the start." },
  { q: "How does the AI use my data?", a: "AI features run only against your own workspace, with the permissions of the person asking. Answers show how they were calculated, and AI usage is metered per plan so there are no surprises." },
  { q: "Is my company's data kept separate from other companies?", a: "Yes. Every record belongs to one company and every query is confined to it by the platform itself, not by individual screens. Companies cannot see each other's data." },
  { q: "Who can see what inside my company?", a: "You control access with roles and fine-grained permissions per module and per action. Everything people do is recorded in an audit log." },
  { q: "Can I import my existing data?", a: "Yes. Leads, clients and employees can be imported from CSV, and the importer validates each row and tells you exactly what needs fixing." },
  { q: "What happens if I cancel?", a: "You can cancel from your billing page. Your workspace stays readable for a period after the plan ends so you can export what you need." },
  { q: "How is pricing calculated?", a: "Pricing is per workspace and depends on the plan: it sets the modules, the number of users, the AI allowance and storage. Prices are shown in your currency and exclude applicable taxes." },
  { q: "Can I get a demo?", a: "Yes. Request a demo and we will walk you through the platform using your own business scenarios. You can also start a free trial and explore on your own." },
];

export interface Integration {
  name: string;
  body: string;
  icon: IconKey;
}

export const INTEGRATIONS: Integration[] = [
  { name: "Payments", body: "Collect payments and run subscriptions through your own payment gateway account, with payment links on invoices.", icon: "wallet" },
  { name: "Email", body: "Send transactional and workflow emails from your own address through your email provider.", icon: "chat" },
  { name: "AI providers", body: "Bring your own AI provider key so AI usage runs on your account and under your control.", icon: "brain" },
  { name: "Social platforms", body: "Connect your business pages to plan, approve and publish posts from one calendar.", icon: "megaphone" },
  { name: "Webhooks", body: "Send signed webhooks from any workflow to the systems you already use.", icon: "plug" },
  { name: "Search and analytics", body: "Connect your search console and analytics tags to your website and SEO tools.", icon: "search" },
  { name: "CSV import and export", body: "Bring your data in with validated CSV imports and take reports out whenever you need them.", icon: "file" },
  { name: "Custom domains", body: "Serve your website and workspace from your own domain with automatic SSL.", icon: "globe" },
];

export const SECURITY_POINTS: Feature[] = [
  { icon: "lock", title: "Strict company isolation", body: "Every record is stamped with its company and every database query is confined to it at the data layer. One company can never read another's data." },
  { icon: "users", title: "Roles and permissions", body: "Role-based access with fine-grained permissions per module and action, so people see and do only what their job requires." },
  { icon: "file", title: "Complete audit trail", body: "Sign-ins, changes, exports and administrative actions are recorded with who, what and when." },
  { icon: "shield", title: "Encrypted secrets", body: "Credentials, API keys and vault documents are encrypted at rest with keys held outside the database." },
  { icon: "clock", title: "Reliable by design", body: "Automatic SSL on your domain, scheduled background jobs and a billing system that gives you a grace period before anything is restricted." },
  { icon: "check", title: "You own your data", body: "Export your records whenever you like. Your data is used to run your workspace and nothing else." },
];

export interface ResourceArticle {
  slug: string;
  title: string;
  summary: string;
  category: "Getting started" | "Automation" | "AI" | "Website" | "Administration";
  readMinutes: number;
  sections: { heading: string; body: string[] }[];
}

export const RESOURCES: ResourceArticle[] = [
  {
    slug: "getting-started",
    title: "Getting started: from registration to your first week",
    summary: "The shortest path from a new account to a workspace your team is using.",
    category: "Getting started",
    readMinutes: 5,
    sections: [
      { heading: "Create your account", body: ["Register with your work email and choose a plan. We email a verification link; open it to activate your account. Every plan begins with a free trial."] },
      { heading: "Complete the guided setup", body: ["The first time you sign in, setup asks for your business details, creates your departments from a template that fits your industry, lets you invite your team and lets you choose which modules to switch on.", "You can skip setup and return to it later — a banner keeps it one click away until it is done."] },
      { heading: "Invite your team and set roles", body: ["Invite people by email and give each one a role. Roles control which modules a person can open and which actions they may take. You can fine-tune permissions per person at any time."] },
      { heading: "Bring in your data", body: ["Import leads, clients or employees from CSV in Settings → Import. The importer validates every row and lists exactly what to fix before anything is saved."] },
      { heading: "Your first week", body: ["Day one: invite the team and import contacts. Day two: set up one automation, such as notifying the owner of every new lead. Day three: publish your website theme. By the end of the week your team is working inside the platform and the dashboard is filling with live numbers."] },
    ],
  },
  {
    slug: "automation-basics",
    title: "Automation basics: Trigger, Condition, Action",
    summary: "How workflows work and three automations worth setting up first.",
    category: "Automation",
    readMinutes: 6,
    sections: [
      { heading: "The three parts of a workflow", body: ["Every automation has a trigger (something that happens, such as a lead being created), optional conditions (only when the deal value is above a threshold) and one or more actions (send an email, notify a person, call a webhook)."] },
      { heading: "Where to find them", body: ["Open Workspace → Settings → Automations to create and manage workflows. Each workflow can be switched on or off without deleting it, and a run history shows what happened and why."] },
      { heading: "Three to start with", body: ["Notify the owner when a new lead arrives. Remind the owner when a follow-up is overdue. Email the finance team when an invoice is overdue by seven days.", "Imports never trigger workflows, so importing existing data will not flood anyone with notifications."] },
      { heading: "Keeping people in control", body: ["Workflows can notify and ask for approval instead of acting on their own. Use approvals for anything that moves money or changes records you cannot easily undo."] },
    ],
  },
  {
    slug: "ask-your-business",
    title: "Asking questions about your business with AI",
    summary: "What you can ask, how answers are produced and how access is respected.",
    category: "AI",
    readMinutes: 4,
    sections: [
      { heading: "Plain-language questions", body: ["Ask things like “How many leads did we get last month by source?” or “Which invoices are more than 30 days overdue?”. The assistant chooses the records to look at, runs a read-only query and answers with text, a table or a chart."] },
      { heading: "Answers you can check", body: ["Every answer includes a “How this was calculated” section listing the data it used and the filters it applied, so you can verify the number rather than trust it blindly."] },
      { heading: "Access is respected", body: ["The assistant can only use data the signed-in person is allowed to see. Sensitive fields are never offered to it, and read-only queries mean it can never change your data."] },
    ],
  },
  {
    slug: "your-website",
    title: "Publishing your website and connecting your domain",
    summary: "Themes, pages, forms and your own domain with automatic SSL.",
    category: "Website",
    readMinutes: 5,
    sections: [
      { heading: "Choose a theme", body: ["Pick a theme in Website → Themes and preview it live before you apply it. Themes control colours, fonts, corner style and the layout of the header, footer and sections."] },
      { heading: "Edit pages and content", body: ["The page builder lets you add, reorder and edit sections. Changes are saved as drafts and go live when you publish, so you can prepare a whole update before visitors see it."] },
      { heading: "Forms that feed your CRM", body: ["Contact and enquiry forms send submissions straight to your CRM and to the inboxes you choose, with spam protection built in."] },
      { heading: "Connect your own domain", body: ["In Settings → Domains add your domain, publish the DNS records shown and the platform verifies ownership and issues the SSL certificate automatically. Until then your website is available on your workspace address."] },
    ],
  },
  {
    slug: "users-and-permissions",
    title: "Users, roles and permissions",
    summary: "Give every person exactly the access their job requires.",
    category: "Administration",
    readMinutes: 4,
    sections: [
      { heading: "Roles", body: ["Each module has roles — for example administrator, manager and employee. A person can hold a role in several modules at once."] },
      { heading: "Fine-grained permissions", body: ["On top of a role you can grant or remove individual permissions for one person, such as the right to export reports or approve payments."] },
      { heading: "Review activity", body: ["The audit log shows sign-ins, changes and exports across your workspace, filtered by person, area and date."] },
    ],
  },
];
