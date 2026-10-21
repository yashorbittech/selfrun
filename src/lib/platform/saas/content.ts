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
  { icon: "layers", title: "Independent products in one suite", body: "Choose from purpose-built products for sales, HR, finance, projects, procurement, training, documents, websites and team chat. Each has its own sign-in and database, and the suite gives you one place to manage them." },
  { icon: "workflow", title: "Automations that run on their own", body: "Build Trigger → Condition → Action workflows with no code. When a lead is won, a leave is approved or an invoice goes overdue, the right people are notified and the right records are updated automatically." },
  { icon: "brain", title: "AI that knows your business", body: "Ask questions in plain language and get answers built from your real records — with the calculation shown. AI assistants, drafting and summaries work across every module and respect each person's access." },
  { icon: "globe", title: "A website that manages itself", body: "Every workspace comes with a complete website builder: pages, blog, forms, SEO, themes and your own domain with automatic SSL — edited by your team, published in one click." },
  { icon: "shield", title: "Built for security and control", body: "Role-based access down to individual actions, a full audit trail, encrypted credentials and strict isolation between businesses. You decide who can see and change what." },
  { icon: "chart", title: "Live numbers, not month-end surprises", body: "Product-specific dashboards give teams a current view of their records. Filter by date, department or owner and export what you need." },
];

export interface ModuleCopy {
  headline: string;
  summary: string;
  capabilities: string[];
  automations: string[];
  outcome: string;
  icon: IconKey;
}

/** Long-form copy per module, keyed by the Product Registry key. Names and short descriptions come from the registry itself. */
export const MODULE_COPY: Record<string, ModuleCopy> = {
  lms: {
    icon: "target",
    headline: "Turn enquiries into customers — without anything slipping through",
    summary: "Collect enquiries from your website, forms and campaigns, move each one through a simple pipeline, and never miss a follow-up.",
    capabilities: ["Lead capture from website forms, ads and CSV import", "Pipeline stages with owners, due dates and notes", "Two-way messages with leads and portal users", "Campaign, offer and coupon tracking with performance reports", "Referral and wallet-credit programs", "Career applications and applicant tracking"],
    automations: ["Assign new leads by rule and notify the owner", "Remind the owner when a follow-up is overdue", "Send a welcome message when a lead is created", "Create a client record when a deal is won"],
    outcome: "Faster response times, a clean pipeline and a clear view of which campaigns actually bring revenue.",
  },
  hrms: {
    icon: "users",
    headline: "Independent people tools for hiring through payroll",
    summary: "Staff records, attendance, leave, hiring and payroll in one place. Employees can check their own details and managers can approve requests.",
    capabilities: ["Employee directory, documents and organisation tree", "Attendance with monthly calendar and reports", "Leave types, balances, requests and approvals", "Recruitment pipeline from application to offer", "Payroll runs, salary revisions and payslips", "Employee self-service: my attendance, leave, salary and documents"],
    automations: ["Notify the manager when a leave request is filed", "Create the employee record when an offer is accepted", "Alert HR before documents or probation periods expire", "Post payroll results to SelfRun CashFlow AI automatically"],
    outcome: "Hours of HR admin saved every week and employees who always know where they stand.",
  },
  fms: {
    icon: "wallet",
    headline: "Accounting, invoicing and cash flow you can trust",
    summary: "Invoices, bills, payments, bank accounts and financial reports, connected to the rest of the software so nobody types the same number twice.",
    capabilities: ["Invoices, credit notes, bills and debit notes", "Receipts, payment links and payouts", "Bank and cash accounts with reconciliation", "Chart of accounts, general ledger and trial balance", "Profit & loss, balance sheet, cash flow and tax reports", "Approvals, advances, expenses and numbering rules"],
    automations: ["Send payment reminders on overdue invoices", "Route large expenses for approval", "Post salary and vendor payments from SelfRun TalentOS and SelfRun SpendIQ", "Notify finance when a payment link is paid"],
    outcome: "Books that close faster, fewer payment delays and reports you can hand to your accountant as they are.",
  },
  pms: {
    icon: "layers",
    headline: "Deliver projects on time and on budget",
    summary: "Manage clients, projects, tasks and hours worked, with boards, timelines and calendars the whole team can follow.",
    capabilities: ["Clients with contacts and project history", "Projects with boards, task lists and timelines", "Timesheets with approvals", "Budget, costing and profitability per project", "My tasks and my projects for every team member", "Project documents and discussion"],
    automations: ["Notify the assignee when a task is assigned or overdue", "Raise an invoice when a milestone is completed", "Warn the manager when a project nears its budget"],
    outcome: "Clear ownership, predictable delivery and profitability you can see before the project ends.",
  },
  prms: {
    icon: "cart",
    headline: "Control spend from request to payment",
    summary: "Everything about buying: purchase requests, quotes, orders, deliveries, supplier invoices, stock and assets, with approvals at each step.",
    capabilities: ["Purchase requests with approval chains", "RFQs and vendor comparison", "Purchase orders, GRN and three-way invoice matching", "Vendor directory and subscription tracking", "Inventory with stock movements", "Asset register, infrastructure and expense claims"],
    automations: ["Route requests to the right approver by amount", "Alert before subscriptions renew", "Create a payable in SelfRun CashFlow AI when an invoice is matched"],
    outcome: "Spend that is approved, tracked and matched — with no surprise invoices.",
  },
  tms: {
    icon: "graduation",
    headline: "Run training programs from enrolment to certificate",
    summary: "Run courses and batches: classes, students, assignments, fees and certificates, for institutes and business training teams.",
    capabilities: ["Programs, batches and class schedules", "Applications and student records", "Attendance, assignments and projects", "Fee tracking and payments", "Certificates with verification", "Student portal and mentor tools"],
    automations: ["Notify students about upcoming classes", "Issue a certificate when a program is completed", "Remind students about pending fees"],
    outcome: "Organised batches, engaged students and certificates issued without manual work.",
  },
  messenger: {
    icon: "chat",
    headline: "Team conversations that stay next to the work",
    summary: "Team chat, direct messages, announcements, meetings and calls inside your workspace, so you don't need a separate chat app.",
    capabilities: ["Channels and direct messages with files", "Business announcements with read tracking", "Meetings and group calls", "Search across messages and files", "Presence and notifications"],
    automations: ["Post workflow results into a channel", "Notify a channel when a deal is won or a task is overdue"],
    outcome: "Fewer tools, fewer lost threads and decisions that stay linked to the record they were about.",
  },
  sop: {
    icon: "book",
    headline: "Document how your business runs — and prove people follow it",
    summary: "Write your standard procedures, keep versions, assign them to people and see who has read them.",
    capabilities: ["SOP library with categories, owners and versions", "Block editor with templates", "Assignments to people, teams, departments or roles", "Acknowledgement tracking and compliance reports", "Review and expiry schedule", "Full audit trail"],
    automations: ["Notify assignees of new or updated procedures", "Escalate overdue acknowledgements", "Remind owners before a review is due"],
    outcome: "Consistent execution, faster onboarding and audit-ready compliance records.",
  },
  lpms: {
    icon: "file",
    headline: "Documents and agreements, generated and tracked",
    summary: "Document templates, approvals, e-signatures and certificates in one place.",
    capabilities: ["Templates with reusable blocks", "Maker types and approval workflows", "Document register with status and history", "Signatures and approvals", "Categories and audit log"],
    automations: ["Generate documents from templates", "Route documents for approval and signature", "Notify when a document is issued or expires"],
    outcome: "Professional documents produced in minutes, with a clear record of who approved what.",
  },
  dlms: {
    icon: "lock",
    headline: "A secure vault for business and client documents",
    summary: "Keep passwords, files, links and notes safe with encryption, access control and expiry reminders.",
    capabilities: ["Business and client vaults", "Encrypted credentials and documents with version history", "Per-record access control", "Expiry reminders", "Activity log"],
    automations: ["Alert owners before a document or credential expires", "Notify when a record is shared or changed"],
    outcome: "Important documents always findable, protected and never expired by surprise.",
  },
  ots: {
    icon: "check",
    headline: "Assess candidates, employees and students at scale",
    summary: "Build question banks, run timed online tests, get automatic marking, and issue certificates with simple reports.",
    capabilities: ["Question bank with categories and bulk import", "Timed tests with sections and randomisation", "Assignments for candidates, employees and students", "Automatic and manual evaluation", "Results, analytics and certificates"],
    automations: ["Assign a test when an application reaches a stage", "Notify evaluators of pending answers", "Issue a certificate on passing"],
    outcome: "Objective hiring and training decisions backed by consistent assessments.",
  },
  aibots: {
    icon: "bot",
    headline: "Build AI assistants trained on your own knowledge",
    summary: "Create AI assistants with your own instructions and files, give your team and customers access, and track how much they are used.",
    capabilities: ["Bots with custom instructions and knowledge files", "Team and customer chat", "Conversation history and audit", "Usage and cost tracking", "Access modes per bot"],
    automations: ["Answer customer questions around the clock", "Hand over to a person when the bot is unsure"],
    outcome: "Instant, consistent answers for staff and customers, grounded in your own material.",
  },
  intelligence: {
    icon: "brain",
    headline: "Ask your business anything",
    summary: "Ask questions in plain English and get answers from your own records, shown as tables or charts with a clear explanation of how each number was worked out.",
    capabilities: ["Natural-language questions about available records", "Answers built from live data, never guessed", "Tables, charts and KPIs", "“How this was calculated” traceability", "Respects each person's access rights"],
    automations: ["Turn a recurring question into a scheduled summary"],
    outcome: "Leadership decisions in seconds instead of waiting for a report.",
  },
  smms: {
    icon: "megaphone",
    headline: "Plan, create and publish social media with AI",
    summary: "Plan campaigns and posts for each social network, get AI help with text and images, approve them and publish from one calendar.",
    capabilities: ["Campaign briefs and AI strategy", "Posts adapted for each platform", "AI copy and image generation", "Approval workflow before publishing", "Calendar and performance tracking"],
    automations: ["Route posts for approval", "Publish on schedule", "Report on campaign performance"],
    outcome: "A steady, on-brand social presence without a large content team.",
  },
  seo: {
    icon: "search",
    headline: "Be found on search — and know why",
    summary: "Check your website for problems, track keywords, search rankings and backlinks, and manage your sitemap, all in one place.",
    capabilities: ["Site audits with prioritised issues", "On-page and content analysis", "Keyword groups and rank tracking", "Backlink monitoring", "Schema, sitemap and robots management", "Tasks and reports"],
    automations: ["Create fix tasks from audit issues", "Alert when rankings or indexing change"],
    outcome: "Higher search visibility with a clear list of what to fix next.",
  },
  cms: {
    icon: "globe",
    headline: "Your website, fully in your control",
    summary: "A complete website builder: pages, blog, forms, images, menus, themes, search tools and your own web address.",
    capabilities: ["Drag-and-drop page builder with draft and publish", "Blog, collections and forms", "Media library", "Themes with live preview", "Navigation and footer management", "Custom domain with automatic SSL"],
    automations: ["Send form submissions to SelfRun DealFlow AI and your inbox", "Notify the team when a page is waiting for approval"],
    outcome: "A professional website your team can change any day — without a developer.",
  },
  portal: {
    icon: "building",
    headline: "A branded portal for clients, students and applicants",
    summary: "Give customers, students and other outside people one place to see their projects, invoices, tests, certificates and messages.",
    capabilities: ["Client, student and applicant dashboards", "Invoices, payments and documents", "Tests and certificates", "Messages with your team", "Rewards and referrals"],
    automations: ["Notify portal users about new invoices, messages and tests"],
    outcome: "Fewer status-update emails and a better experience for the people you serve.",
  },
  support: {
    icon: "chat",
    headline: "Get help from AI first, people when you need them",
    summary: "An AI help assistant that knows the product, a searchable help center and a request desk where you can attach files and track progress.",
    capabilities: ["AI help chat that understands the screen you are on", "Searchable help articles", "Support requests with attachments", "Status tracking and notifications"],
    automations: ["Create a request directly from an AI conversation"],
    outcome: "Answers in seconds and a clear path to a person when it matters.",
  },
  workspace: {
    icon: "bolt",
    headline: "The home of your business",
    summary: "The control center: links to every section, business settings, plan details and setup, with reports kept inside each section.",
    capabilities: ["Executive dashboard and per-module analytics", "Users, roles and fine-grained permissions", "Audit log across everything", "Workflow automations", "Data import", "Branding, domains and billing"],
    automations: ["Build your own Trigger → Condition → Action workflows"],
    outcome: "Leadership visibility and administrative control from a single screen.",
  },
  website: {
    icon: "globe",
    headline: "A public website on your own domain",
    summary: "Publish your business website on your own web address, with a secure (HTTPS) connection set up automatically, edited with the website builder.",
    capabilities: ["Your own domain and subdomain", "Automatic SSL", "Maintenance mode", "Built-in forms and lead capture"],
    automations: ["Capture every enquiry straight into SelfRun DealFlow AI"],
    outcome: "A live website without hosting, plug-ins or developers.",
  },
};

export interface AiCapability {
  title: string;
  body: string;
  icon: IconKey;
}

export const AI_CAPABILITIES: AiCapability[] = [
  { icon: "brain", title: "Ask your business anything", body: "Type a question like “Which customers owe us money for more than 30 days?” The AI looks through your own records, using only what you are allowed to see, and answers with a table or chart and an explanation of how it got there." },
  { icon: "bot", title: "AI assistants that know your business", body: "Create assistants with your own instructions and documents, for your staff or your customers. Every conversation is saved, and you can see how much each assistant is used." },
  { icon: "megaphone", title: "Marketing content in seconds", body: "Turn one idea into posts for each social network, create images and change the tone with one sentence. Nothing is posted until the approval step you choose." },
  { icon: "chat", title: "Help that knows where you are", body: "The help assistant knows which screen you are on, answers “how do I…” questions from the help center and can turn a chat into a support request." },
  { icon: "search", title: "Better search ranking", body: "Website checks explain why a problem matters and what to change, and score each page against what people search for." },
  { icon: "workflow", title: "AI inside your automations", body: "Add AI steps to automatic workflows: summarise a conversation, draft a reply or sort an enquiry. Keep a person in the loop wherever you want one." },
];

export interface Step {
  title: string;
  body: string;
}

export const HOW_IT_WORKS: Step[] = [
  { title: "Sign up and pick a plan", body: "Go to Sign up, enter your work email and confirm it from the email we send you. You start on the free plan, which has every feature, and no card is needed. You can move to a paid plan later, only when your team grows." },
  { title: "Set up your business", body: "A short guided setup asks for your business name and details, creates your departments, lets you invite your team by email and lets you switch sections on or off. If you already have lists of customers or staff in a spreadsheet, you can import them here." },
  { title: "Add your website, AI and automations", body: "Pick a website theme and publish your website, connect the email address you send from and the AI features, and switch on the automatic reminders and approvals you want. Nothing is locked: you can change any setting later." },
  { title: "Run your business from one place", body: "Your team opens the sections they need every day, such as leads, projects, invoices or leave requests. Reminders and automatic steps take care of follow-ups, and dashboards show how the business is doing. Each section still works on its own." },
];

export interface UseCase {
  slug: string;
  title: string;
  summary: string;
  /** A product-grounded workflow narrative, not a claim about a named customer. */
  narrative: string;
  problem: string;
  solution: string[];
  modules: string[];
  result: string;
}

export const USE_CASES: UseCase[] = [
  { slug: "lead-to-cash", title: "Lead to cash", summary: "From first enquiry to paid invoice without re-entering a single detail.", narrative: "A sales team captures an enquiry from its website or a campaign and follows it in the DealFlow pipeline. When the deal is marked won, the connected workflow creates the client and project records. As project work reaches a billable milestone, the team raises an invoice, shares a payment link and records the payment in finance.", problem: "Sales, delivery and finance live in different tools. Deals are won but the invoice is raised late, and nobody sees the full picture.", solution: ["Capture enquiries from your website and campaigns into the SelfRun DealFlow AI pipeline", "Create the client and project automatically when a deal is won", "Raise the invoice from the milestone and send a payment link", "Remind the client automatically and post the receipt to the ledger"], modules: ["lms", "pms", "fms"], result: "Shorter sales cycles, faster payments and revenue you can trace from campaign to cash." },
  { slug: "hire-to-retire", title: "Hire to retire", summary: "Every people process, from the job post to the final settlement.", narrative: "A hiring process begins with a job published on the business website. Applicants move through recruitment and assessment; when an offer is accepted, the employee record and assigned onboarding procedures are created. The same people workspace then supports attendance, leave requests, approvals and payroll, with self-service for employees.", problem: "Hiring, onboarding, attendance, leave and payroll are spread across spreadsheets and email, so HR spends its time chasing instead of helping.", solution: ["Publish jobs on your website and track applicants through stages", "Test candidates online and issue offers", "Create the employee record and onboarding SOPs on acceptance", "Run attendance, leave and payroll with employee self-service"], modules: ["hrms", "ots", "sop", "cms"], result: "A smooth employee experience and an HR team that works on people, not paperwork." },
  { slug: "procure-to-pay", title: "Procure to pay", summary: "Approved, matched and paid — with a full trail.", narrative: "A purchase starts with a request and follows the configured approval chain. The team compares vendor quotes, issues a purchase order and records goods received. Finance can match the vendor invoice to the order and receipt, then carry the payable into CashFlow AI for payment and accounting.", problem: "Purchases happen over chat and email, invoices arrive without a purchase order and approvals are hard to prove.", solution: ["Raise purchase requests with approval chains by amount", "Compare vendor quotes and issue purchase orders", "Match invoice, order and goods receipt before payment", "Post the payable and the payment to SelfRun CashFlow AI"], modules: ["prms", "fms"], result: "Controlled spend, no duplicate payments and a clean audit trail." },
  { slug: "training-operations", title: "Training operations", summary: "Run programs, batches and certificates at scale.", narrative: "An institute receives applications, enrolls learners into programs and batches, then manages class schedules, attendance and assignments in one flow. Fee links and reminders support collections; completion can trigger a verifiable certificate for the learner.", problem: "Institutes juggle enrolments, schedules, fees and certificates across several tools and manual follow-ups.", solution: ["Take applications and enrol students into batches", "Schedule classes and track attendance and assignments", "Collect fees with payment links and reminders", "Issue verifiable certificates automatically"], modules: ["tms", "ots", "portal", "fms"], result: "Organised batches, on-time fees and certificates without manual work." },
  { slug: "always-on-marketing", title: "Always-on marketing", summary: "A website, social presence and SEO that keep working.", narrative: "A marketing team publishes website pages and enquiry forms, plans social content with review steps and tracks search performance. When a visitor submits an enquiry, it enters DealFlow so sales can follow up and connect the opportunity to its source.", problem: "Marketing depends on agencies and tools that do not talk to sales, so nobody knows which effort brings customers.", solution: ["Publish and update your website without a developer", "Plan campaigns and social posts with AI and approvals", "Track rankings and fix SEO issues from audit tasks", "Capture every enquiry into SelfRun DealFlow AI and measure campaign results"], modules: ["cms", "smms", "seo", "lms"], result: "Consistent marketing that is measured against real enquiries and revenue." },
  { slug: "compliance-and-documents", title: "Compliance and documents", summary: "Procedures, agreements and records that stand up to an audit.", narrative: "A team publishes controlled procedure versions, assigns them to the right people and tracks acknowledgements. Agreements can be generated from templates, while credentials and important files are kept in the document vault with expiry alerts to prompt review.", problem: "Policies live in shared drives, nobody can prove who read what, and documents expire unnoticed.", solution: ["Publish SOPs with versions and assign them to teams", "Track acknowledgements and escalate the overdue", "Generate agreements and certificates from templates", "Store credentials and documents with expiry alerts"], modules: ["sop", "lpms", "dlms"], result: "Audit-ready records and a team that knows the current way of working." },
  { slug: "client-onboarding-and-delivery", title: "Client onboarding and delivery", summary: "A consistent handoff from a won deal to active project work.", narrative: "After a deal is marked won, the client and project records are created for the delivery team. The team coordinates tasks and milestones in the project workspace, shares relevant updates and documents through the client portal, and carries billable milestones into invoicing.", problem: "Sales handoffs, project updates and client documents are scattered across inboxes, so delivery teams repeat setup and clients have to ask for status.", solution: ["Create the client and project record from a won deal", "Break delivery into assigned tasks and milestones", "Give clients a portal for project updates, invoices and documents", "Raise invoices from completed billable milestones"], modules: ["lms", "pms", "portal", "fms"], result: "A traceable handoff and a shared view of delivery, communication and billing." },
  { slug: "customer-support-to-resolution", title: "Customer support to resolution", summary: "Give customers a clear self-service path with a human handoff when needed.", narrative: "A customer starts with a knowledge-grounded assistant or searchable help content. If the question needs a person, the conversation can become a support request with attachments and status tracking, while the support team works from a queue and keeps the customer updated.", problem: "Customers repeat the issue across channels and have no clear way to see whether support is working on it.", solution: ["Make help content searchable and available in context", "Let an assistant answer from the product knowledge you provide", "Create a support request with its attachments when escalation is needed", "Track request status and send customer notifications"], modules: ["aibots", "support", "portal"], result: "A consistent support path from self-service to a tracked human response." },
  { slug: "leadership-live-answers", title: "Leadership answers from live records", summary: "Explore product-specific business data with traceable answers and access controls.", narrative: "A manager asks a business question in plain language. SelfRun Intelligence queries the records available to that product and returns a table, chart or KPI with an explanation of the calculation. Leaders can review the source logic instead of relying on a hand-built report with unknown filters.", problem: "Leaders wait for reports, reconcile different spreadsheets and cannot easily check how a number was calculated.", solution: ["Ask a question in plain language about available records", "Receive an answer computed from current records", "Review the calculation and applied filters", "Keep access aligned with the signed-in person's permissions"], modules: ["intelligence", "workspace"], result: "Faster exploration with an answer that people can inspect and verify." },
  { slug: "contract-review-and-records", title: "Contract review and records", summary: "Move agreements from reusable template to approval and secure storage.", narrative: "A team prepares an agreement from an approved template, routes it through the configured review and signature steps, then stores the final document with its version and activity history. Expiry reminders help the owner review records before they lapse.", problem: "Teams reuse outdated agreement files, lose track of approvals and discover expiry dates too late.", solution: ["Start from a reusable document template", "Route the agreement through review and signature", "Keep the final record with its status and history", "Store related files securely and set expiry reminders"], modules: ["lpms", "dlms"], result: "A more controlled agreement lifecycle with a retrievable record of review." },
];

export interface Industry {
  slug: string;
  name: string;
  summary: string;
  needs: string[];
  modules: string[];
}

export const INDUSTRIES: Industry[] = [
  { slug: "it-and-software", name: "IT & software businesses", summary: "Run client projects, track the hours your team works, bill clients and hire people, without moving data between apps.", needs: ["Project delivery with timesheets and costing", "Client billing from milestones", "Recruitment and online assessments", "A website and SEO that bring in enquiries"], modules: ["pms", "fms", "hrms", "ots", "cms"] },
  { slug: "education-and-training", name: "Education & training institutes", summary: "Run courses and batches, keep student records and attendance, collect fees and give out certificates, with a portal where students see their own progress.", needs: ["Applications and enrolment", "Batch schedules and attendance", "Fee collection and receipts", "Certificates and a student portal"], modules: ["tms", "ots", "portal", "fms"] },
  { slug: "agencies-and-consultancies", name: "Agencies & consultancies", summary: "Keep track of every possible client, deliver the work on time, record hours and see whether each engagement is making money.", needs: ["CRM pipeline and proposals", "Projects, tasks and approvals", "Time tracking and profitability", "Marketing and social content"], modules: ["lms", "pms", "fms", "smms"] },
  { slug: "trading-and-distribution", name: "Trading & distribution", summary: "Control what you buy, what is in stock, what you owe suppliers and what customers still owe you.", needs: ["Purchase requests, orders and goods receipts", "Inventory and stock movements", "Vendor invoices and payments", "Customer invoicing and collections"], modules: ["prms", "fms", "lms"] },
  { slug: "professional-services", name: "Professional services", summary: "Keep agreements, documents, client records and billing in order, with a secure place for sensitive files.", needs: ["Document templates and approvals", "Secure document vault", "Client portal", "Time and billing"], modules: ["lpms", "dlms", "portal", "fms"] },
  { slug: "growing-smes", name: "Growing small & medium businesses", summary: "Start with the few tools you need today, add more as the business grows, and manage them all from one place.", needs: ["Separate sign-in and data for each product", "Start with the products you need", "Add products as you grow", "Affordable monthly pricing"], modules: ["workspace", "lms", "hrms", "fms"] },
];

export interface Faq {
  q: string;
  a: string;
  /** Group shown on the FAQ page. */
  topic?: string;
}

export const FAQS: Faq[] = [
  { q: "What is SelfRun AI?", a: "SelfRun AI is one online system for running a business. It brings your customers and sales, staff and payroll, invoices and accounts, projects, purchasing, training, documents, website and team chat into one place. AI and automatic reminders and approvals work across it. You open it in a web browser or in your own apps, and it carries your business name and logo." },
  { q: "Do I need to use every part?", a: "No. Switch on only the sections you need during setup. For example, you can begin with customers and invoices and add staff records or projects later. You can turn sections on or off at any time from your workspace settings." },
  { q: "Is there a free plan?", a: "Yes. The free plan is free forever and includes every feature, with no card needed. Paid plans are for bigger teams: they allow more people and give you more storage and more AI, email and voice usage." },
  { q: "How long does setup take?", a: "A guided setup takes a few minutes. It asks for your business details, creates your departments, invites your team and lets you choose the sections you want. If you already keep lists of leads, clients or employees in a spreadsheet, you can import them from a CSV file." },
  { q: "Can I use my own domain for my website?", a: "Yes. On plans that include a custom domain you can use your own web address, such as yourbusiness.com, and the secure (HTTPS) certificate is set up for you automatically. Every workspace also gets its own address from the start, so you can begin before you connect a domain." },
  { q: "How does the AI use my data?", a: "The AI only looks at your own business's records, and only at what the person asking is allowed to see. Its answers show how they were worked out, so you can check them. AI usage is counted per plan, so there are no surprises." },
  { q: "Is my business's data kept separate from other businesses?", a: "Yes. Every record belongs to one business, and the platform itself limits every request to that business. This is not left to individual screens. One business can never see another business's data." },
  { q: "Who can see what inside my business?", a: "You decide. Give each person a role, such as Manager or Accountant, and choose what that role may see and do in each tool. Important actions are recorded in a log, so you can see who did what and when." },
  { q: "Can I import my existing data?", a: "Yes. Leads, clients and employees can be imported from a CSV (spreadsheet) file. The importer checks each row and tells you exactly what needs fixing before anything is saved." },
  { q: "What happens if I cancel?", a: "You can cancel from your billing page. After the plan ends your workspace stays readable for a period, so you have time to export everything you need." },
  { q: "How is pricing calculated?", a: "Pricing is per business workspace. The plan you choose sets how many people can use it and how much storage and AI, email and voice usage you get. Prices are shown in your currency and do not include taxes." },
  { q: "Can I get a demo?", a: "Yes. Ask for a demo and we will walk you through the platform using examples from your own business. Or start free and explore on your own." },
];


/** More answers, grouped by topic on the FAQ page. */
export const FAQS_MORE: Faq[] = [
  { topic: "Data & security", q: "Can one business see another business's data?", a: "No. Every record belongs to one business and the platform adds that business to every database query itself, so a page, report or export cannot ask for another business's rows. See Security & Trust." },
  { topic: "Data & security", q: "Can the AI change my data on its own?", a: "No. Business questions use read-only queries with the asker's permissions. When an assistant proposes to create, edit or delete something, nothing happens until the person approves it, deletes ask for a second confirmation, and every action is logged." },
  { topic: "Data & security", q: "Can I export my data or leave?", a: "Yes. Tables can be exported to CSV or Excel and documents downloaded as PDF. If you cancel, the workspace stays readable so you can export, and you can ask for permanent deletion of your business's data." },
  { topic: "Data & security", q: "Who can see salaries, payroll and financial statements?", a: "Only people with the specific permission for them. Payroll, salary, bank and statement views are limited by role, even for managers, and every export and change is recorded in the audit log." },
  { topic: "Support", q: "How do I get support?", a: "Inside the product the Help & Support product has a help center, an AI help assistant and support requests you can follow from open to resolved, with attachments and notifications. You can also write to us through the contact page." },
  { topic: "Plans & pricing", q: "What does the Free plan include?", a: "Every product and every feature, free forever. Paid plans add more people and bigger storage, AI, email and voice allowances." },
  { topic: "Plans & pricing", q: "Are any features locked behind a higher plan?", a: "No. Every plan includes every product and every feature. Plans differ only by team size and by allowances." },
  { topic: "Plans & pricing", q: "Can I change plans later?", a: "Yes. You can upgrade as your team grows or move down when you need less. Your data stays in place." },
  { topic: "Plans & pricing", q: "Are prices shown with tax?", a: "No. Prices exclude applicable taxes, and invoices show the tax separately." },
  { topic: "Your brand", q: "Will my team and clients see SelfRun's brand?", a: "No. Your logo, name, colours, domain, emails and apps carry your business's identity. SelfRun stays in the background." },
  { topic: "Your brand", q: "Can I have my own mobile and desktop apps?", a: "Yes. The platform generates your installable app, Android and iOS apps and Windows, macOS and Linux desktop apps from your branding. For the stores you sign the Android and iOS projects with your own developer accounts." },
  { topic: "Your brand", q: "Can I use more than one website theme?", a: "Yes. The theme library lets you preview, activate and customise themes — colours, fonts and components — and switch whenever you like." },
  { topic: "Your brand", q: "Do push notifications come from my business?", a: "Yes. Push notifications reach your team and your website visitors in your name, on the devices where they have allowed them." },
  { topic: "AI & automation", q: "What can I ask the AI?", a: "Anything about your business data in plain language — for example overdue invoices, leads by source, who is on leave or which projects are late. It answers with text, a table or a chart and shows how it calculated the answer." },
  { topic: "AI & automation", q: "Can the AI change my data?", a: "No. Questions are answered with read-only queries, and the AI only uses data the person asking is allowed to see." },
  { topic: "AI & automation", q: "Do I need to write code to automate things?", a: "No. Workflows are built from a trigger, optional conditions and actions on a settings screen, starting from ready-made templates." },
  { topic: "AI & automation", q: "Can I build an AI assistant on my own documents?", a: "Yes. Create a bot with your instructions and knowledge files, choose who can use it, and track its usage and cost." },
  { topic: "AI & automation", q: "Can AI answer my website visitors?", a: "Yes. The website chatbot answers from a knowledge base you control, and Conversation AI adds voice. Every conversation is logged for review." },
  { topic: "Apps & devices", q: "Which devices are supported?", a: "The web app works in any modern browser. You can install it on Android, iPhone and iPad, Windows, macOS, Linux and ChromeOS, and generate Android, iOS and desktop apps." },
  { topic: "Apps & devices", q: "Do the apps need updating when you add features?", a: "No. The apps load your workspace, so new features and branding changes appear without reinstalling." },
  { topic: "Data & security", q: "Can I export my data?", a: "Yes. You can export records and reports at any time, and after a plan ends your workspace stays readable for a period so you can take what you need." },
  { topic: "Data & security", q: "How do I see who did what?", a: "Each product keeps its own activity records and sign-in history. Open that product's audit tools to review and export the activity available there." },
  { topic: "Data & security", q: "How are passwords and credentials protected?", a: "Credentials, API keys and vault documents are encrypted at rest, and business data is isolated from every other business at the data layer." },
  { topic: "Setup", q: "How do I get my existing data in?", a: "Import leads, clients and employees from CSV. Every row is validated and the importer tells you exactly what to fix. Imports never trigger workflows." },
  { topic: "Setup", q: "Can I use my own domain?", a: "Yes. Add your domain, publish the DNS records shown, and the platform verifies it and issues the SSL certificate automatically." },
  { topic: "Setup", q: "Do I have to use every product?", a: "No. Choose the products you need. Each product runs independently with its own sign-in and database; add other products whenever you are ready." },
  { topic: "Support", q: "Where do I get help?", a: "Signed-in users have an AI help assistant that knows the screen they are on, a searchable help center and a request desk with status tracking. You can also contact the team from this website." },
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
  { icon: "lock", title: "Your data stays yours alone", body: "Every record belongs to one business, and every request to the database is limited to that business. One business can never see another's data." },
  { icon: "users", title: "The right access for each person", body: "Choose who can see and do what in each section, so people only get what their job needs." },
  { icon: "file", title: "A record of every action", body: "Sign-ins, changes, exports and admin actions are recorded: who did what, and when." },
  { icon: "shield", title: "Secrets stored encrypted", body: "Passwords, API keys and vault documents are encrypted when stored, with the keys kept outside the database." },
  { icon: "clock", title: "Dependable", body: "Your web address gets a secure (HTTPS) certificate automatically, background jobs run on schedule, and billing gives you a grace period before anything is restricted." },
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
      { heading: "Create your account", body: ["Register with your work email and choose a plan. We email a verification link; open it to activate your account. Start on the free-forever plan and upgrade when your team grows."] },
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

/** Home page overview: the questions a first-time visitor has, answered without jargon. */
export const SIMPLE_ANSWERS: { title: string; text: string; icon: IconKey; points: string[] }[] = [
  { title: "What is it?", icon: "layers", text: "SelfRun AI is a website you open in your browser. It handles the daily office work of a business: customer lists, staff records, invoices, projects, purchases, training, documents and your public website. Everything is in one place instead of in many different apps.", points: ["Nothing to install to get started", "Works on a phone and on a computer", "Each person on your team has their own sign-in"] },
  { title: "What does it do for me?", icon: "bolt", text: "It keeps your information in one place, reminds people when something needs doing, asks the right person for approval and shows you live reports. The AI inside can answer questions about your business and help you write.", points: ["Keeps records of customers, staff, money and projects", "Reminds and follows up for you", "Shows live reports, so you do not build them by hand", "AI answers questions and drafts text"] },
  { title: "Who is it for?", icon: "users", text: "Any business with a team and paperwork to manage: IT and software businesses, training institutes, agencies and consultancies, traders and distributors, professional firms and growing small and medium businesses.", points: ["You do not need an IT team", "Start with a few sections and add more as you grow", "Each person sees only what their role allows"] },
  { title: "Do I need technical skills?", icon: "rocket", text: "No. A short guided setup asks for your business details, creates your departments and helps you invite your team. You can bring in your existing lists from a spreadsheet (CSV file), and a help center and an AI help assistant explain each screen.", points: ["Guided setup takes minutes, not weeks", "Import customers, clients and staff from a spreadsheet", "Help center and AI help inside the product"] },
  { title: "What does it cost?", icon: "wallet", text: "Starting is free, and the free plan includes the whole software with every feature. You pay only when your team grows. Paid plans differ by team size and usage limits, not by features, and no card is needed to start.", points: ["Free to start, no card needed", "No features locked behind a higher plan", "The Pricing page shows every plan"] },
  { title: "Will it look like my business?", icon: "target", text: "Yes. Your logo, name, colours, web address, emails and apps carry your business's identity, so your team and customers see your business and not SelfRun.", points: ["Your own logo and colours everywhere", "Your own web address for your website", "Your own mobile and desktop apps, made when you press Generate"] },
];

/** The words used on the home page, in plain language. */
export const GLOSSARY: { term: string; meaning: string }[] = [
  { term: "CRM", meaning: "A list of your customers and possible customers, with every conversation, follow-up and deal in one place, so nobody forgets to reply. In SelfRun this is the sales section, SelfRun DealFlow AI." },
  { term: "Lead", meaning: "A person or business that has shown interest in what you sell but has not bought yet." },
  { term: "Pipeline", meaning: "The steps a sale goes through, for example enquiry, meeting, quote, won. It shows where every deal stands right now." },
  { term: "Payroll", meaning: "Working out each person's pay for the month and giving them a payslip." },
  { term: "Invoice", meaning: "A bill you send to a customer for work or goods, showing what they owe and how to pay it." },
  { term: "Automation (workflow)", meaning: "A rule that says “when this happens, do that”. For example, when an invoice is overdue, send a reminder. You set it once and it runs by itself." },
  { term: "Dashboard", meaning: "One screen of live numbers and charts, such as sales this month or unpaid invoices." },
  { term: "Portal", meaning: "A private page where your customers, students or job applicants can see their own information, such as invoices, tests or certificates." },
  { term: "Role and permission", meaning: "A role is a type of job, such as Manager or Accountant. Permissions say what each role may see and do, so people only get what they need." },
  { term: "Audit log", meaning: "A record of who did what and when, so you can check any change later." },
  { term: "Web address (domain)", meaning: "Your website's name, such as yourbusiness.com. You can use your own instead of ours." },
  { term: "Push notification", meaning: "A short message that appears on a phone or computer, even when the app is closed, for example “A new lead was assigned to you”." },
  { term: "CSV file", meaning: "A simple spreadsheet file. You can use one to bring your existing lists into SelfRun, or to take your data out." },
  { term: "Your brand (white label)", meaning: "Software that carries your business name, logo and colours instead of its maker's. Your customers see your brand, not SelfRun." },
  { term: "AI assistant", meaning: "A chat helper that answers questions from your own records and documents and helps you write. It only shows what the person asking is allowed to see." },
  { term: "Installable web app", meaning: "A website you add to the home screen of your phone or computer so it opens like a normal app, without going through an app store." },
];

/** Everyday-language names for the use cases, for the home page. */
export const USE_CASE_PLAIN_TITLES: Record<string, string> = {
  "lead-to-cash": "From first enquiry to payment",
  "hire-to-retire": "Hiring and looking after your staff",
  "procure-to-pay": "Buying from suppliers and paying them",
  "training-operations": "Running training courses",
  "always-on-marketing": "Marketing that keeps working",
  "compliance-and-documents": "Policies, procedures and documents",
  "client-onboarding-and-delivery": "Starting and delivering client work",
  "customer-support-to-resolution": "Helping customers",
  "leadership-live-answers": "Answers for managers, from real numbers",
  "contract-review-and-records": "Agreements and contracts",
};
