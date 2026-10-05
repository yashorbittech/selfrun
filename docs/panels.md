# SelfRun Business — Panels

SelfRun Business is a suite of panels on one platform. A company signs up, picks a plan and gets the panels it needs, all
sharing one identity, one design system, one permission model and one set of business data. This document explains what
each panel is for and what it gives a company. For setup and deployment, see [README.md](../README.md).

## One platform instead of many tools

Growing companies end up with a pile of separate products: an HR system, a project tool, a CRM, an accounting package, a
chat app, a document tool. Each has its own login, its own billing and its own data silo, and none of them talk to each
other.

SelfRun Business is built the other way around:

- **One sign-in.** A user signs in once and reaches every panel their roles allow (single sign-on across panels).
- **One set of data.** A client created in Projects is the same client in Finance, CRM and the Portal. Nothing is re-typed.
- **One permission model.** Roles and per-person overrides are managed in one place, and every sensitive change is logged.
- **AI throughout.** Each panel can use AI where it saves time, always under the user's own permissions.
- **Pay for what you use.** Plans decide which panels a company gets; companies can add panels later.

Every company is a separate tenant. Its data, users, website and settings are isolated from every other company.

## How panels are organised

| Group | Panels |
| --- | --- |
| Core | [Workspace](#workspace-workspace), [Team Chat](#team-chat-messenger) |
| People and operations | [HR & Payroll](#hr--payroll-hrms), [Projects](#projects-pms), [Procurement & Assets](#procurement--assets-prms), [Training](#training-tms), [SOPs & Policies](#sops--policies-sop) |
| Sales and finance | [CRM & Sales](#crm--sales-lms), [Finance](#finance-fms) |
| Documents and knowledge | [Legal & Documents](#legal--documents-lpms), [Digi Locker](#digi-locker-dlms), [Online Tests](#online-tests-ots) |
| AI | [AI Assistants](#ai-assistants-aibots), [AI Intelligence](#ai-intelligence-intelligence) |
| Marketing and web | [Social Media](#social-media-smms), [SEO](#seo-seo), [Website](#website-cms-and-public-site) |
| External users | [Client & Student Portal](#client--student-portal-portal) |
| Help | [Help & Support](#help--support-support) |

The platform staff also use the [Platform Panel](#platform-panel-platform), which is not part of any company.

---

## Workspace (`/workspace`)

**What it is.** The company's home: one sign-in page and a personal dashboard that shows the panels each user can reach, with
live numbers from the panels the company uses. It also holds the company's settings.

**Settings:** profile and branding (logo, colours, wordmark), users and roles, security, domains (automatic address and
custom domains with TLS), billing and plan, payments, integrations, automations, usage and the **audit log** of every
change across the company.

**Benefits**
- One place for leadership to see the business and for admins to control access.
- A new hire sees only what they can do, so onboarding is simple.
- Every change is auditable: who did what, when, with a before and after.

---

## Team Chat (`/messenger`)

**What it is.** Direct messages, team and project channels, group chats, announcements, meetings with audio/video calls and
file sharing.

**Benefits**
- Channels follow real teams and projects, so membership stays accurate without manual set-up.
- Company conversations and files stay inside the company's own workspace.
- No separate per-seat chat subscription.

---

## HR & Payroll (`/hrms`)

**What it is.** Employee records, org structure (departments, designations, teams, reporting lines), attendance, leave,
payroll with payslips and payouts, and a recruitment pipeline that turns a shortlisted applicant into an employee.

**Benefits**
- One source of truth for every employee and their history.
- Self-service leave and attendance, with manager approval in the same system.
- Payroll is computed from real attendance and leave, with payslips and payout tracking.
- Bank details are encrypted at rest, and sensitive changes (status, salary, roles) are audit-logged.

---

## Projects (`/pms`)

**What it is.** Clients, projects, milestones, tasks, timesheets, shared documents, activity and project costing.

**Benefits**
- Real profitability: estimated versus actual cost and hours, from logged timesheets.
- Guarded status workflows keep pipeline data trustworthy.
- Timesheet-driven billing instead of month-end guesswork.

---

## Procurement & Assets (`/prms`)

**What it is.** Vendors, requisitions, purchase orders, RFQs, goods receipt, assets and inventory, budgets, expenses,
infrastructure and software subscriptions, vendor invoices and payments.

**Benefits**
- Every purchase goes through a level-based approval chain before money moves.
- Spend against budget is visible as it happens.
- Full asset lifecycle: who has what, current value and status.

---

## Training (`/tms`)

**What it is.** For companies that run training or internship programmes: programmes, batches, applications and enrolment,
classes and attendance, assignments and submissions, mentors, placements, fees, and certificates that anyone can verify
publicly at `/verify/<code>`.

**Benefits**
- The whole student journey (apply, enrol, learn, place, certify) in one system.
- Honest placement and revenue numbers for the training business.
- Fee plans, wallet credits and invoices tied to real enrolment data.

---

## SOPs & Policies (`/sop`)

**What it is.** Standard operating procedures with sections, checklists and links; versions and approval; confidentiality
levels; assignment to people and departments with acknowledgement tracking; feedback and an audit trail.

**Benefits**
- Everyone works from the current approved version, and you can prove who read it.
- A daily scheduled job keeps review and acknowledgement state up to date.

---

## CRM & Sales (`/lms`)

**What it is.** Inbound leads and clients, pipeline and timelines, messages, campaign analytics (including imported ad
platform data), career applicants, **festival offers and coupons**, and a **wallet and credits** system with referrals,
streaks and usage rules. It also manages the website's AI chatbot and voice assistant.

**Benefits**
- Every enquiry from the company's website becomes a tracked record from first contact to close.
- The chatbot and voice assistant give a first response around the clock.
- Offers, coupons and referral rewards are configured by the company with no deployment.

---

## Finance (`/fms`)

**What it is.** Invoices, receipts, credit notes, chart of accounts, ledger and journals, bank and cash accounts, fiscal
periods and financial reports.

**Benefits**
- Invoices, receipts and the ledger stay linked to the same clients and projects as the rest of the business.
- Bank account numbers are encrypted at rest.
- Wallet credits can be applied to eligible invoices.

---

## Legal & Documents (`/lpms`)

**What it is.** A document maker for agreements and policies. Admins define **document types** (employment agreements,
NDAs, service agreements, privacy and internal policies) with fields and numbering, build **templates** from blocks
(headings, clauses, tables, variables, signature blocks), and run documents through **approval workflows**. Documents carry
versions, signature requests and a full audit trail, and export as PDF, DOCX or print.

**Benefits**
- Standard wording is written once and reused, with variables filled from HR, projects, finance and Digi Locker data.
- Every document has an owner, a status (draft, review, pending approval, approved, published, active, archived) and a history.
- Optional AI drafting from a short prompt.

---

## Digi Locker (`/dlms`)

**What it is.** A secure vault for logins, documents, URLs, accounts and notes. Every record belongs either to the **company
vault** or to exactly one client.

**Benefits**
- Passwords are encrypted at rest, masked by default, and revealed only to people with the reveal permission; each reveal is
  logged and secrets never appear in logs or notifications.
- One profile per client (credentials, URLs, documents, notes, expiry) built on the existing client record.
- Documents are private and versioned.
- A daily sweep flags credentials, domains, hosting and certificates that are expired or about to expire.
- Employees see only the clients (and optionally the company vault) they are assigned to.

---

## Online Tests (`/ots`)

**What it is.** One test engine for every assessment: employee technical and compliance tests, certification exams,
applicant screening, and course, chapter, mock and final exams for students. Staff build and assign tests; employees take
them under OTS → My Tests; applicants and students take theirs in the Portal. All use the same exam screen.

**Benefits**
- One reusable question bank with 17 question types (choice, true/false, short and long answer, fill in the blank, code
  output, coding, SQL, debugging, matching, ordering, and image, audio and video questions), with CSV/Excel import and export.
- Tests are built step by step: sections and timers, hand-picked or rule-based questions, random order, negative marking,
  attempts with latest/highest/average scoring, result visibility and certificates.
- Assign to a department, role, team, employee type, individual, applicants for a position, a student, a training batch or a
  course. People are resolved live from HR, careers and training.
- Timing is enforced on the server. Optional exam security: full screen, tab-switch detection, copy/paste blocking, one
  window at a time, IP and device recorded, automatic submission after N violations. This makes cheating harder and visible; it
  does not make an online exam cheat-proof.
- Objective answers are marked automatically; subjective ones go to an evaluation queue. Results, pass/fail, section scores
  and certificates follow, with reports by test, person, department, question and more, exportable to CSV/Excel.
- OTS never becomes a people master: employees, applicants and students stay in HR, careers and training.

---

## AI Assistants (`/aibots`)

**What it is.** A catalogue of purpose-built AI assistants (for example proposal writing, requirement analysis, meeting
notes, plus any the team creates), each with its own instructions, model, private knowledge base and access list, and a chat
workspace for each.

**Benefits**
- A new assistant is configuration, not code: create it, upload its knowledge files, choose who can use it.
- Each assistant's knowledge lives in its own vector store and is searched only by that assistant.
- Only application metadata is stored in the database; transcripts are read back from the AI provider and the API key never
  leaves the server.
- Role- and person-level access per assistant, manager oversight of chats, and a dashboard of chats, executions, token usage,
  estimated cost and failures.

---

## AI Intelligence (`/intelligence`)

**What it is.** Ask questions about the business in plain language. The assistant plans which data it needs (clients,
projects, tasks, timesheets, employees, leave, leads, invoices, receipts, expenses, vendors, purchase orders), reads it with
the **asker's own permissions**, and answers with the numbers behind the answer.

**Benefits**
- Leaders get answers such as "which projects are delayed" or "what did we invoice this month" without building reports.
- Access is respected: a person without Finance access is told the information is not available to them, not given a partial answer.
- It reads the live data of the other panels, so there is nothing to import or keep in sync.

---

## Social Media (`/smms`)

**What it is.** An AI-first workspace for social media campaigns, ads and posts on Instagram, Facebook, YouTube, LinkedIn,
Google Ads and Google Business Profile, for image and video content. One flow: create, AI generate, edit, preview, schedule,
publish, analytics.

**Benefits**
- AI turns a campaign brief into strategy, audiences, keywords, hashtags and ad concepts per platform, and one post idea
  into a separate, within-limits version for each platform, including image and video scripts.
- Every AI output and every edit is a version that can be viewed and restored.
- AI writes from one central brand context; company details, services and live offers are read from the panels that own them.
- **Nothing is published without a person.** A post goes out only through an explicit Publish (via a connected Meta, Google or
  LinkedIn account) or a schedule approved by someone with Publish permission. Paid ads are never launched or funded from
  the panel.
- A private media library, role-based permissions (Employee, Specialist, Manager, Admin) and an append-only activity log.

---

## SEO (`/seo`)

**What it is.** The place where a company's search presence is managed: automated website audits, technical and on-page SEO,
keywords and rank tracking, content SEO, internal links, backlinks, competitors, sitemap, robots.txt and structured data, plus
the issue and task queue that gets problems fixed.

**Benefits**
- A crawler audits the site against 50+ technical, on-page, content, link, mobile, performance and structured-data checks. Each
  finding has a recommendation and is verified fixed by the next audit.
- The public website reads from the panel: titles, descriptions, canonicals, robots directives, social tags, sitemap and
  JSON-LD edited here go live without a deployment.
- Numbers are labelled by trust: connected sources and the company's own crawl are *verified*; keyword-tool and competitor
  figures are *estimated*.
- robots.txt and schema are validated before they can be published, and every change is logged with a before/after diff.

---

## Website (CMS and public site)

**What it is.** Every company has its own public website, served at its automatic address or its own domain. The **Website
(CMS)** panel manages pages built from sections, navigation, footer, forms, themes and a colour palette, with page versions
and publishing. A starter website is created at sign-up so the site is live immediately. Companies can add collections such as
products and blog posts.

**Benefits**
- No developer needed for content, layout or theme changes.
- Lead forms feed the CRM directly; job applications feed HR careers.
- Display options (header, footer, section layout and width) are per theme.

---

## Client & Student Portal (`/portal`)

**What it is.** A separate, self-service portal for the company's clients, businesses, students, interns and job applicants,
with its own identity, separate from staff logins. Each person sees a dashboard that matches their role: project progress and
invoices for clients, schedule and certificates for students, application status and assessments for applicants, plus wallet,
credits and referrals.

**Benefits**
- Fewer "what is my status?" emails and calls.
- A clean security boundary: a portal account can never reach internal tools.

---

## Help & Support (`/support`)

**What it is.** The platform's help desk for every company. Companies get an **AI help chatbot** (one click from every
panel's top bar and aware of the panel and page the user is on), a searchable **help centre**, and **My requests** for
support requests, bug reports, feature requests, improvements and feedback. The chatbot answers only from published help
articles and can turn an unresolved chat into a request the user reviews before sending. Bug reports capture panel, page,
route, browser, OS and device automatically.

Requests are received centrally: the data lives in platform-level collections, every row carries its `companyId`, and
company-facing queries are always pinned to the caller's company. Platform staff work requests in the Platform Panel (assign,
prioritise, reply, internal notes, AI triage with summary, category, priority, team and duplicate suggestions, and a suggested reply). Request
types and their form fields, categories, priorities, severities, teams and the status workflow are configuration, not code.

---

## Platform Panel (`/platform`)

**What it is.** The console for the platform staff who run SelfRun Business. It is available only on the platform host and
only to platform staff, and is never offered to companies.

| Area | What it does |
| --- | --- |
| Companies | Registry of every company: status, plan, subscription, suspend and reactivate |
| Sign-ups | Approve or reject sign-ups when sign-up mode requires approval (modes: open, approval, closed) |
| Plans, add-ons, coupons | Plans and prices, which panels each plan includes, add-ons, and coupons or complimentary grants |
| Subscriptions, invoices, revenue | Subscription state and events, invoices, revenue metrics |
| Payments | Razorpay keys and billing webhook for charging companies |
| Panels | The Panel Registry: names, descriptions, icons, order and global on/off |
| Domains and SSL | Every company's domains and verification state |
| Usage | Usage per company and per panel |
| Support | Support requests, help articles and support settings |
| Platform users and roles | Platform staff accounts and what each may do |
| Settings and integrations | Platform name, root domain, email, billing seller details, sign-up mode and provider settings |
| Audit and notifications | A log of every platform action and platform notifications |

---

## The common thread

What ties the panels together is not only the shared look. It is one identity and sign-in, one permission system an admin
can see and control, one set of business data that every panel reads, and one audit trail. Companies start with the panels
they need and add more as they grow, without migrating data or training people on a new tool.
