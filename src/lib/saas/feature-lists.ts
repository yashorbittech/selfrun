/**
 * The complete feature list of every panel, grouped the way each panel's own navigation groups them, built from the panel's real
 * screens (its routes and sidebar) and its capability copy. Every entry is something a user can open or do in the product today;
 * nothing here is planned or invented.
 */
export interface FeatureItem {
  name: string;
  text: string;
}
export interface FeatureGroupList {
  title: string;
  items: FeatureItem[];
}

const f = (name: string, text: string): FeatureItem => ({ name, text });

export const FEATURE_LISTS: Record<string, FeatureGroupList[]> = {
  workspace: [
    { title: "Command center", items: [f("Executive dashboard", "Every panel's live numbers on one screen"), f("Panel performance matrix", "Status and key counts for each panel, with one-click Open"), f("Per-panel analytics", "Drill into any panel with date, department and owner filters"), f("Notifications", "One inbox for everything that needs you, with notification settings"), f("Documents", "Files uploaded across projects, HR and the portal"), f("Company-wide search", "Find any record in any panel (⌘K)")] },
    { title: "Organisation", items: [f("Guided company setup", "Profile, departments, invitations and which panels your team uses"), f("Organization profile", "Legal name, industry, country, currency, time zone, contacts"), f("Users, roles & seats", "Who can sign in, which panels and permissions, seats used"), f("Invitations", "Invite people by email with a role"), f("Data import", "Leads, clients and employees from validated CSV files"), f("Email verification", "Verified accounts before anyone gets access")] },
    { title: "Your brand", items: [f("Branding", "Your logo, name, accent and theme across panels, emails and PDFs"), f("Apps & downloads", "Your own PWA, Android, iOS, Windows, macOS and Linux apps"), f("Custom domains", "Your own domain and panels host with automatic SSL"), f("Payment account", "Collect invoice payments and pay salaries through your own gateway account")] },
    { title: "Automation & integrations", items: [f("Automations", "Trigger → Condition → Action workflows with ready-made templates"), f("Run history", "See what every workflow did and why"), f("Integrations", "Payment gateway, webhooks, email and AI provider keys"), f("Signed webhooks", "Send events to the systems you already use")] },
    { title: "Security & audit", items: [f("Audit log", "Who did what across every panel, and when — with CSV export"), f("Security", "Sign-in, password and accounts that need attention"), f("Sessions & devices", "Every signed-in device, with log out one or everywhere"), f("Sign-in history", "Sign-ins, failures and sign-outs kept for 180 days"), f("Roles & permissions", "Per-panel roles with per-action permissions")] },
    { title: "Billing", items: [f("Plan & billing", "Your plan, payments, coupon codes and GST details"), f("Invoices & payments", "Tax invoices and credit notes for your subscription"), f("Usage", "Seats, AI, email, voice and storage used against your plan"), f("Upgrade", "Change plan any time")] },
  ],
  lms: [
    { title: "Lead management", items: [f("Leads", "Every enquiry with owner, status, source, due date and notes"), f("New lead", "Add a lead by hand in seconds"), f("Pipeline overview", "New · In progress · Completed · Rejected at a glance"), f("Pending tasks & stale-lead alerts", "Leads untouched for days are flagged"), f("Lead detail", "Full history, notes and messages per lead"), f("Saved filters", "Segment by category, status, source and date")] },
    { title: "Messages & applicants", items: [f("Messages", "Two-way messages with leads and portal users"), f("Applicants", "Career applications with status, notes and resumes"), f("Applicant detail", "Interview scheduling and status per applicant"), f("Notifications", "Be told when a lead or applicant needs you")] },
    { title: "Capture & analytics", items: [f("Website forms", "Enquiries from your website arrive as leads"), f("CSV import", "Bring existing leads in with validation"), f("Lead & campaign analytics", "Pipeline health, spend, ROI and conversion"), f("Campaign tracking", "See which campaigns bring revenue"), f("Export current view", "CSV of exactly what you are looking at")] },
  ],
  hrms: [
    { title: "People", items: [f("Employee directory", "Every employee with profile, documents and status"), f("Add & edit employee", "Full personal, job and salary details"), f("Departments", "Teams, heads and reporting lines"), f("Organisation tree", "See who reports to whom"), f("Recruitment", "Pipeline from application to offer"), f("Employee documents", "Contracts, IDs and certificates per person")] },
    { title: "Operations", items: [f("Attendance", "Monthly calendar, check-ins and late arrivals"), f("Leave", "Leave types, balances, requests and approvals"), f("Holidays", "Company holiday calendar"), f("Payroll runs", "Run payroll for a month with one flow"), f("Salary revisions", "Track every change in pay"), f("Payslips", "Generated and available to each employee"), f("Salary payouts", "Pay salaries and post them to Finance")] },
    { title: "Employee self-service", items: [f("My dashboard", "Each person's own HR home"), f("My attendance", "Check in and review your month"), f("My leave", "Request leave and see your balance"), f("My salary & payslips", "Pay history and downloads"), f("My documents & profile", "Personal records, always current"), f("Company directory", "Find colleagues across the company")] },
    { title: "Insight & control", items: [f("HR analytics", "Headcount, hiring, attendance and leave trends"), f("Settings", "Leave rules, policies and permissions"), f("Notifications", "Leave requests and approvals reach the right person"), f("Audit trail", "Every change recorded in the central audit log")] },
  ],
  fms: [
    { title: "Money in", items: [f("Receivables", "Everything customers owe you"), f("Invoices", "Create, send and track invoices"), f("Credit notes", "Adjust invoices cleanly"), f("Receipts", "Record and issue receipts"), f("Payment links", "Get paid online from any invoice"), f("Refunds", "Handle refunds with a trail"), f("Customers", "Customer records with history")] },
    { title: "Money out", items: [f("Payables", "Everything you owe"), f("Bills", "Capture and approve vendor bills"), f("Debit notes", "Adjust bills cleanly"), f("Payouts", "Pay vendors and staff from one place"), f("Vendors & bank directory", "Beneficiaries and bank details"), f("Advances & employee expenses", "Claims with approvals"), f("Salary payments & payroll runs", "Posted from HR automatically")] },
    { title: "Banking & cash", items: [f("Bank accounts", "Every account with its transactions"), f("Cash accounts", "Petty cash and cash on hand"), f("Transfers", "Move money between accounts"), f("Bank reconciliation", "Match statements to the books"), f("Cash reconciliation", "Count and reconcile cash"), f("Transactions", "Every money movement, with approvals")] },
    { title: "Books & reports", items: [f("General ledger", "Every posting, searchable"), f("Trial balance", "Always in balance"), f("Profit & loss", "Revenue and expenses"), f("Balance sheet", "Assets, liabilities and equity"), f("Cash flow", "Where the cash came from and went"), f("Tax reports", "Ready for your accountant"), f("Budget vs actual", "Spot overspend early"), f("Project profitability", "Margin by project"), f("Revenue & expense reports", "Trends and breakdowns")] },
    { title: "Control & settings", items: [f("Approvals", "Route money movements for sign-off"), f("Approval rules", "Thresholds and approvers"), f("Chart of accounts", "Your own account structure"), f("Fiscal periods", "Open and close periods"), f("Numbering", "Document number series"), f("Tax configuration", "GST and tax rates"), f("Exchange rates", "Multi-currency support"), f("Payment methods", "Accepted ways to pay"), f("Asset expenses", "Link spending to company assets")] },
    { title: "Connected panels", items: [f("Procurement", "Vendor invoices and purchase payments"), f("Projects", "Milestone billing and project costs"), f("HR & payroll", "Salary payouts posted automatically"), f("Training", "Student fees and receipts")] },
  ],
  pms: [
    { title: "Delivery", items: [f("Projects", "All projects with status, owner and dates"), f("Project board", "Kanban board of tasks"), f("Task lists", "Tasks with assignees, due dates and priorities"), f("Timeline", "Gantt-style view of the plan"), f("Calendar", "Deadlines and milestones at a glance"), f("Project documents", "Files and discussion on the work"), f("Clients", "Contacts and full project history")] },
    { title: "Time & money", items: [f("Timesheets", "Time logged against projects, approved by managers"), f("Costing", "Budget, cost and profitability per project"), f("Milestones", "Track and bill delivery stages"), f("Overdue warnings", "Be told before a project slips")] },
    { title: "For every team member", items: [f("My projects", "Only the projects you are on"), f("My tasks", "Your own work list"), f("My timesheet", "Log time in seconds"), f("Notifications", "Assigned or overdue tasks reach you")] },
    { title: "Insight & control", items: [f("Project analytics", "Delivery and workload trends"), f("Settings", "Project rules, roles and permissions")] },
  ],
  prms: [
    { title: "Procure", items: [f("Purchase requests", "Requests with approval chains by amount"), f("RFQs", "Request quotes and compare vendors"), f("Purchase orders", "Issue and track orders"), f("Goods receipt (GRN)", "Record what arrived"), f("Vendor invoices", "Three-way match: order, receipt and invoice"), f("Payments", "Pay approved invoices"), f("Contracts", "Vendor contracts and renewals")] },
    { title: "Vendors & spend", items: [f("Vendors", "Directory with history and performance"), f("Expenses", "Expense claims with approvals"), f("Budgets", "Set and watch budgets"), f("Third-party services", "Track external providers"), f("Procurement analytics & reports", "Where the money goes")] },
    { title: "Company assets", items: [f("Hardware & assets", "Register, assign and track every asset"), f("Subscriptions", "Software subscriptions with renewal alerts"), f("Infrastructure", "Servers, domains and hosting"), f("Inventory", "Stock with movements")] },
    { title: "Self-service", items: [f("My requests", "Employees raise and track purchase requests"), f("My expenses", "Submit and follow your own claims")] },
  ],
  tms: [
    { title: "Training", items: [f("Programs", "Courses and curriculum"), f("Batches", "Groups with schedule, mentors and capacity"), f("Batch calendar", "All batches on one calendar"), f("Students", "Records, progress and attendance"), f("Applications", "Enrolment requests, as a list or a board")] },
    { title: "Delivery", items: [f("Classes", "Schedules and attendance"), f("Projects", "Live projects for students"), f("Assignments", "Set, submit and review"), f("Mentor tools", "Guide students through the program")] },
    { title: "Records", items: [f("Certificates", "Issued with public verification"), f("Payments", "Fees, instalments, receipts and reminders"), f("Placements", "Track student placements"), f("Reports", "Enrolment, attendance and revenue")] },
    { title: "Student portal", items: [f("My dashboard", "Everything a student needs"), f("My program & batch", "Curriculum and classmates"), f("Class schedule", "Upcoming classes"), f("My assignments & projects", "Submit and get feedback"), f("My certificates", "Download and share"), f("My payments", "Pay fees online"), f("Profile", "Keep details current")] },
  ],
  messenger: [
    { title: "Conversations", items: [f("Direct messages", "One-to-one chat with files"), f("Team channels", "Channels for every team"), f("Project channels", "Discussion next to the project"), f("Group chats", "Ad-hoc groups"), f("Unread counts", "Never miss a message")] },
    { title: "Workspace", items: [f("Announcements", "Company-wide posts with read tracking"), f("Shared files", "Every file shared in chat"), f("Meetings", "Meetings and group calls"), f("Search", "Across messages, people and files"), f("Presence & notifications", "See who is around and get alerted")] },
    { title: "Control", items: [f("Settings", "Roles, retention and permissions"), f("Activity trail", "Recorded in the central audit log")] },
  ],
  sop: [
    { title: "Library", items: [f("SOP library", "Procedures with categories, owners and versions"), f("New SOP", "Block editor with templates"), f("My SOPs", "Procedures you own"), f("Assigned SOPs", "What you must read and acknowledge"), f("Version history", "Every revision kept")] },
    { title: "Structure", items: [f("Departments", "Procedures per department"), f("Categories", "Organise the library"), f("Templates", "Start from a block template")] },
    { title: "Compliance", items: [f("Assignments", "To people, teams, departments or roles"), f("Acknowledgement tracking", "Know who has read what"), f("Compliance reports", "Overdue and complete, at a glance"), f("Review & expiry schedule", "Reminders before a review is due"), f("Feedback", "Staff comment on procedures"), f("Reports & analytics", "Usage and compliance trends"), f("Settings & audit trail", "Rules, permissions and full history")] },
  ],
  lpms: [
    { title: "Documents", items: [f("Document library", "Every document with status and history"), f("New document", "Generate from a template"), f("Approvals", "Route documents for approval"), f("Signatures", "Collect and track signatures"), f("Document history", "Who changed and approved what")] },
    { title: "Templates & workflows", items: [f("Templates", "Reusable blocks and layouts"), f("Maker types", "Who can create which documents"), f("Workflows", "Approval chains per document type"), f("Categories", "Organise documents")] },
    { title: "Control", items: [f("Settings", "Rules and permissions"), f("Audit trail", "Recorded in the central audit log"), f("Notifications", "Issued, approved or expiring")] },
  ],
  dlms: [
    { title: "Vaults", items: [f("Company vault", "The company's own records"), f("Client vaults", "A separate vault per client"), f("Credential vault", "Encrypted logins and keys"), f("Document vault", "Files with version history"), f("URLs & accounts", "Links and online accounts"), f("Notes", "Secure notes")] },
    { title: "Protection", items: [f("Encryption at rest", "Credentials and documents are encrypted"), f("Per-record access", "Share exactly what is needed"), f("Expiry & alerts", "Never miss a renewal or expiry"), f("Activity log", "Who opened or changed what"), f("Settings", "Roles and permissions")] },
  ],
  ots: [
    { title: "Assessments", items: [f("Tests", "Timed tests with sections and randomisation"), f("New test", "Build from your question bank"), f("Question bank", "Categories, bulk add and import"), f("Question import", "Bring questions in from files"), f("Test assignments", "Assign to candidates, employees and students")] },
    { title: "Evaluation", items: [f("Results", "Automatic and manual evaluation"), f("Evaluator workflow", "Notify evaluators of pending answers"), f("Certificates", "Issued on passing"), f("Test reports & analytics", "Performance across tests"), f("Hiring screening", "Assign a test when an application reaches a stage")] },
    { title: "Candidates & setup", items: [f("My tests", "Candidates take tests in their portal"), f("My results", "Scores and feedback"), f("Question & test categories", "Organise everything"), f("Settings & activity log", "Rules, permissions and history")] },
  ],
  aibots: [
    { title: "Create & chat", items: [f("Create bot", "Your instructions and knowledge files"), f("Start new chat", "Talk to any bot you can use"), f("Find a bot", "Browse the bots available to you"), f("Knowledge files", "Ground a bot in your own documents")] },
    { title: "Manage", items: [f("Manage bots", "Edit, pause and delete"), f("Access modes per bot", "Team, customers or both"), f("All chats", "Full conversation history"), f("Usage & cost", "Tracked per bot"), f("Settings", "Roles and permissions"), f("Audit trail", "Every change recorded")] },
  ],
  intelligence: [
    { title: "Ask your business", items: [f("Plain-language questions", "Across every panel's data"), f("Answers from live data", "Read-only queries, never guessed"), f("Tables, charts & KPIs", "The right view for each answer"), f("How this was calculated", "Every answer shows its working"), f("Suggested questions", "Start from what people ask most")] },
    { title: "Trust & control", items: [f("Access respected", "Only data the asker may see"), f("Sensitive fields withheld", "Never offered to the AI"), f("Conversations", "Search and revisit past questions"), f("Usage metering", "AI allowance tracked per plan")] },
  ],
  smms: [
    { title: "Content", items: [f("Campaigns & ads", "Briefs, AI strategy and spend"), f("Social media posts", "Adapted for each platform"), f("New post & new campaign", "Create in a few clicks"), f("Media library", "Images and video in one place")] },
    { title: "AI & publishing", items: [f("AI content generator", "Copy and images from one idea"), f("Tone refinement", "Adjust a post with one sentence"), f("Approval workflow", "Nothing publishes without sign-off"), f("Calendar & scheduling", "Publish on schedule"), f("Platform connections", "Your business pages, connected")] },
    { title: "Insight & control", items: [f("Analytics", "Campaign and post performance"), f("Settings", "Roles and permissions"), f("Activity trail", "Recorded in the central audit log")] },
  ],
  seo: [
    { title: "Audit", items: [f("SEO overview", "Health of the whole site"), f("Website audit", "Prioritised issues"), f("Technical SEO", "Speed, crawl and index health"), f("On-page SEO", "Titles, headings and meta"), f("Content SEO", "Scores per page"), f("Pages", "Every page's SEO at a glance")] },
    { title: "Search & links", items: [f("Keywords", "Keyword groups"), f("Rankings", "Rank tracking over time"), f("Competitors", "See who outranks you"), f("Internal links", "Link structure and gaps"), f("Backlinks", "Monitor who links to you")] },
    { title: "Crawl & index", items: [f("Sitemap", "Managed from the panel, drives your live site"), f("Robots.txt", "Edit and publish"), f("Schema / structured data", "Rich results")] },
    { title: "Work", items: [f("SEO issues", "Prioritised fix list"), f("SEO tasks", "Assign fixes with owners"), f("Reports", "Share progress"), f("Settings & audit trail", "Rules, permissions and history")] },
  ],
  cms: [
    { title: "Content", items: [f("Pages", "Drag-and-drop builder with draft and publish"), f("Services", "Your service pages"), f("Blog posts", "Articles with SEO fields"), f("Careers", "Job openings on your site"), f("Hiring models", "Engagement options"), f("Products", "Your offerings in one place"), f("Forms", "Enquiries straight into your CRM"), f("Media library", "Images and files")] },
    { title: "Appearance", items: [f("Themes", "Browse, preview live and activate"), f("Customize", "Colours, fonts, radius and components"), f("Menus", "Navigation builder"), f("Footer", "Footer columns and links"), f("Site identity", "Brand, contact and social details")] },
    { title: "Growth", items: [f("Festival offers", "Campaigns, coupons, claims and subscribers"), f("Wallet & credits", "Reward rules, referrals, balances and ledger"), f("Referral campaigns", "Grow through your customers"), f("Usage rules", "Control how credits are spent"), f("Push notifications", "Reach visitors on their devices"), f("SEO overview", "Search health of your site")] },
    { title: "AI on your website", items: [f("AI chatbot", "Answers visitors from your knowledge base"), f("Knowledge base", "Teach the chatbot your content"), f("AI config", "Tone, behaviour and limits"), f("Conversation AI", "Voice conversations with AI"), f("Voice config", "Pick the voice and behaviour"), f("Conversations", "Every chat and call, logged and searchable")] },
    { title: "Control", items: [f("Settings", "Maintenance mode, tracking and more"), f("Collections", "Structured content types"), f("Draft & approval", "Review changes before they go live"), f("Audit trail", "Recorded in the central audit log")] },
  ],
  website: [
    { title: "Your public website", items: [f("Your own domain", "Plus a free workspace address"), f("Automatic SSL", "Secure from day one"), f("Maintenance mode", "Work on the site safely"), f("Built-in lead capture", "Every enquiry into your CRM"), f("SEO built in", "Sitemap, robots and structured data")] },
  ],
  portal: [
    { title: "For clients", items: [f("Projects & milestones", "Progress they can see"), f("Invoices & payments", "Pay online"), f("Documents", "Shared files"), f("Messages & meetings", "Talk to your team")] },
    { title: "For students", items: [f("Program & schedule", "Curriculum and classes"), f("Assignments & projects", "Submit and get feedback"), f("Attendance", "See your record"), f("Tests & certificates", "Take tests, download certificates")] },
    { title: "For applicants & everyone", items: [f("Application & interviews", "Track the application"), f("Journey", "Where you are in the process"), f("Rewards, referrals & wallet", "Earn and spend credits"), f("Notifications & settings", "Choose what reaches you"), f("Profile & registration", "Self-service sign-up and account")] },
  ],
  support: [
    { title: "Get help", items: [f("Help assistant", "AI that knows the screen you are on"), f("Help center", "Searchable articles"), f("Turn a chat into a request", "One click from conversation to ticket")] },
    { title: "Support desk", items: [f("New request", "Question, problem, idea or feedback — with attachments"), f("My requests", "Status tracking and replies"), f("Notifications", "Told when we reply")] },
  ],
};

export const featureCount = (key: string) => (FEATURE_LISTS[key] ?? []).reduce((n, g) => n + g.items.length, 0);

/**
 * What each panel is worth to a business, in plain terms. `replaces` names the kind of software it stands in for; `benefits` are the
 * outcomes, drawn from what the panel really does. No figures, customers or comparisons that cannot be backed up.
 */
export interface PanelValue {
  replaces: string;
  benefits: string[];
}
export const PANEL_VALUE: Record<string, PanelValue> = {
  workspace: { replaces: "Dashboards, user admin, automation & integration tools", benefits: ["See the whole company on one screen instead of opening ten tools", "Control who can see and do what, down to a single action", "Automate follow-ups across every panel without developers", "One audit log and one place for billing, brand and security"] },
  lms: { replaces: "CRM & lead management software", benefits: ["No enquiry slips through — every lead has an owner and a due date", "Stale leads are flagged before they go cold", "See which campaigns actually bring revenue", "Won deals flow straight into clients and projects"] },
  hrms: { replaces: "HR & payroll software", benefits: ["Hire, onboard, track attendance and pay from one record", "Employees self-serve leave, salary and documents — HR stops chasing", "Payroll posts to Finance automatically", "Managers approve leave and timesheets where they already work"] },
  fms: { replaces: "Accounting & invoicing software", benefits: ["Books that close faster, from live transactions", "Customers pay online straight from the invoice", "Salary, vendor and project money posts itself — no re-entry", "Reports your accountant can use as they are"] },
  pms: { replaces: "Project management software", benefits: ["Clear ownership of every task and deadline", "Know a project's profitability before it ends", "Time, cost and milestones in one place", "Milestones can raise the invoice automatically"] },
  prms: { replaces: "Procurement & asset management software", benefits: ["Every purchase approved, tracked and matched before payment", "No surprise subscriptions — renewals are flagged early", "Know every asset, who has it and where it is", "Vendor invoices post to Finance when matched"] },
  tms: { replaces: "Training & learning management software", benefits: ["Run programs, batches and fees without spreadsheets", "Students get their own portal for classes, work and certificates", "Certificates issued with public verification", "Fee reminders go out on their own"] },
  messenger: { replaces: "Team chat & meeting software", benefits: ["Conversations stay next to the project or record they are about", "Company announcements with proof they were read", "No separate chat subscription or login", "Workflow results can post straight into a channel"] },
  sop: { replaces: "SOP & policy management tools", benefits: ["One current way of working — versioned and owned", "Prove who has read and acknowledged each procedure", "Faster onboarding with assigned procedures", "Reviews never lapse — reminders go out automatically"] },
  lpms: { replaces: "Document generation & e-signature tools", benefits: ["Professional documents in minutes, from templates", "A clear record of who approved and signed what", "Approval chains per document type", "Everything in one library, with history"] },
  dlms: { replaces: "Password & document vault tools", benefits: ["Credentials and documents encrypted and access-controlled", "A vault per client, kept separate", "Expiry alerts so nothing lapses by surprise", "Know exactly who opened or changed what"] },
  ots: { replaces: "Online assessment platforms", benefits: ["Objective hiring and training decisions from consistent tests", "Automatic evaluation saves hours of marking", "Certificates issued on passing", "Tests trigger from the hiring pipeline by themselves"] },
  aibots: { replaces: "AI chatbot builders", benefits: ["Instant, consistent answers grounded in your own material", "Bots for staff, for customers, or both", "Every conversation logged; usage and cost tracked per bot", "Hand over to a person when the bot is unsure"] },
  intelligence: { replaces: "Business-intelligence & reporting tools", benefits: ["Leadership decisions in seconds, not after a report is built", "Answers come from live records, never guessed", "Every answer shows how it was calculated", "People only get answers from data they may see"] },
  smms: { replaces: "Social media management tools", benefits: ["A steady, on-brand presence without a large content team", "AI drafts posts and images from a single idea", "Nothing publishes without the approval you choose", "Campaign performance next to your CRM results"] },
  seo: { replaces: "SEO audit, rank-tracking & link tools", benefits: ["A clear, prioritised list of what to fix next", "Rankings and backlinks tracked in one place", "Sitemap and robots drive your live site directly", "Fix tasks assigned to owners, not lost in a report"] },
  cms: { replaces: "Website builder, CMS & marketing tools", benefits: ["Change your website any day — no developer needed", "Forms feed your CRM directly", "Offers, coupons, referrals and wallet credits built in", "AI chatbot and voice AI answer visitors around the clock"] },
  website: { replaces: "Website hosting & domain setup", benefits: ["Live on your own domain with automatic SSL", "No hosting, plug-ins or developers to manage", "Every enquiry captured into your CRM", "Maintenance mode when you need to work safely"] },
  portal: { replaces: "Client, student & applicant portals", benefits: ["Fewer status-update emails — people check for themselves", "One branded place for projects, invoices, tests and messages", "Self-service sign-up and account management", "Rewards and referrals keep people coming back"] },
  support: { replaces: "Helpdesk & help-center tools", benefits: ["Answers in seconds from an AI that knows the screen you are on", "A clear path to a person when it matters", "Requests tracked with attachments and status", "Help content searchable in the product"] },
};

/** URL slug of a feature: its name, lower-cased and hyphenated. Unique within a panel. */
export const featureSlug = (name: string) => name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Every feature of a panel, flat, with the group it sits in. */
export function featuresOf(key: string): { group: string; name: string; text: string; slug: string }[] {
  const seen = new Set<string>();
  return (FEATURE_LISTS[key] ?? []).flatMap((g) =>
    g.items.map((i) => {
      let slug = featureSlug(i.name);
      while (seen.has(slug)) slug += "-2";
      seen.add(slug);
      return { group: g.title, name: i.name, text: i.text, slug };
    }),
  );
}
