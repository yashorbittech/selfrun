# SelfRun Business Platform — Panels Overview

This document explains what SelfRun Business actually is: one integrated suite of
internal and external panels, rather than a single app. It covers what each
panel does, why it exists, and the concrete benefits it delivers. For setup
and local-development instructions, see [README.md](./README.md).

## Why one platform instead of many separate tools

A growing company like SelfRun Business typically ends up stitching together a pile
of separate SaaS products — an HR system, a project tool, a procurement
system, an LMS, a chat app, a CRM, a client portal — each with its own login,
its own billing, its own data silo, and none of them talking to each other.

SelfRun Business was built the other way around: **one shared identity, one design
system, nine purpose-built panels.** Every internal employee account lives in
a single `admin_users` collection; logging into any one panel automatically
provisions real sessions in every other panel that account actually has a
role in (cross-module single sign-on) — no second password, no "which URL do
I use for that." A Super Admin gets one executive dashboard aggregating real,
live numbers from every module instead of seven separate logins to piece
together the picture. Every panel shares the same visual language, the same
sidebar/topbar shell, and the same underlying permission system, so moving
between them feels like one product, not seven.

The result: lower cost than a pile of SaaS subscriptions, full ownership of
the data, and — because it's purpose-built — every panel fits exactly how
SelfRun Business actually works instead of forcing SelfRun Business's process into a
generic tool's assumptions.

---

## Public Website (`/`)

**What it is**: SelfRun Business's public marketing site — company profile, service
listings, portfolio/case studies, blog, and a careers page.

**Why it exists**: it's the front door. Prospective clients and job
candidates land here before they're anyone in the system at all.

**Benefits**:
- Every lead-capture form and every job application on the site feeds
  straight into the internal CRM (LMS) and Careers pipeline (HRMS) — no
  manual re-typing of a form submission into a spreadsheet.
- One brand, one design system, shared straight through into every internal
  panel a visitor might later log into (as a client, a trainee, an employee).

---

## Admin Panel — Super Admin Command Center (`/admin`)

**What it is**: the executive control center. A real-time dashboard
aggregating live numbers from every other panel (revenue, projects, leads,
students, procurement spend, AI usage), plus centralized user, role and
permission management for the whole platform.

**Why it exists**: leadership needs to see the health of the whole business
in one place, without opening seven different tools and mentally averaging
seven different numbers. And *someone* needs one place to grant, adjust, or
revoke a person's access across the entire company — not a CLI script and a
prayer.

**Benefits**:
- One dashboard, real numbers pulled live from HRMS/PMS/PRMS/TMS/CRM/Chat —
  nothing here is fabricated or estimated.
- Centralized, auditable access control: create an account, assign exactly
  the roles it needs, grant or deny individual capabilities, deactivate
  access — all from one screen, all logged.
- Quick, safe reach into every other panel's deep functionality for
  cross-module troubleshooting or oversight.

---

## Staff Hub / Workspace (`/workspace`)

**What it is**: the universal front door for every employee — one login page,
one personalized dashboard showing exactly the panels *that account* can
reach, with real-time SSO into any of them.

**Why it exists**: most staff only use two or three of the internal tools.
Before this existed, that meant remembering which of seven login pages was
theirs. Now there's one.

**Benefits**:
- One login, one password, for everyone — not just the Super Admin.
- The dashboard only ever shows panels the account genuinely has a role in,
  so it doubles as a friendly "here's what you can do" onboarding screen for
  new hires.
- Fewer IT help-desk tickets asking "which URL do I use again?"

---

## HRMS — Human Resource Management System (`/hrms`)

**What it is**: employee records, org structure (departments, designations,
teams, reporting lines), attendance, leave, payroll, and a recruitment
pipeline that converts a shortlisted job applicant straight into an employee
record.

**Why it exists**: HR run on spreadsheets and email doesn't scale, isn't
auditable, and makes payroll error-prone. HRMS gives HR one structured,
searchable, permission-gated system of record.

**Benefits**:
- Single source of truth for every employee's data and employment history.
- Self-service leave and attendance — employees don't need to email HR for
  routine requests, and managers approve from the same system.
- Payroll computation, payslips, and payout tracking happen against real
  attendance/leave data, not a re-typed summary.
- A full audit trail on every sensitive change (status, salary, roles).

---

## PMS — Project Management System (`/pms`)

**What it is**: clients, projects, tasks, milestones, timesheets, and project
costing/profitability for every delivery team.

**Why it exists**: generic project tools (Trello, Jira) don't know what a
project *costs* SelfRun Business or what it should *bill*. PMS was built around
SelfRun Business's own client/billing model from day one.

**Benefits**:
- Real project profitability visibility — estimated vs. actual cost and
  hours, per project, computed from actual logged timesheets.
- Guarded status workflows (a project can't jump straight from "planning" to
  "completed") keep the pipeline data trustworthy.
- Timesheet-driven billing accuracy instead of end-of-month guesswork.

---

## PRMS — Procurement & Resource Management System (`/prms`)

**What it is**: vendor management, purchase requisitions and orders, RFQs,
goods receipt, asset and inventory tracking, budgets, expenses, infrastructure
and SaaS subscription tracking, vendor invoices and payments.

**Why it exists**: procurement spend and company assets need an approval
trail — not an email chain and a shared spreadsheet nobody trusts.

**Benefits**:
- Every purchase goes through a real, level-based approval chain before
  money moves.
- Budget enforcement — spend against a budget is visible and tracked, not
  discovered at quarter-end.
- Full asset lifecycle tracking (who has what, current value, status).
- Reduces the risk of untracked, duplicate, or unauthorized spend.

---

## TMS — Training Management System (`/tms`)

**What it is**: manages SelfRun Business's own paid training and internship
programs — programs, batches, student enrollment and applications, classes,
mentors, project assignments, placements, certificates, and payments.

**Why it exists**: training/internship is a real business line for
SelfRun Business, with its own lifecycle (apply → enroll → learn → placement →
certify) that has nothing to do with internal HR headcount.

**Benefits**:
- One system covering the full student journey from application to
  certificate, instead of scattered spreadsheets per batch.
- Placement tracking gives real, honest numbers to back the "why train with
  us" pitch to prospective students.
- Payment/revenue tracking for the training business line, tied to real
  enrollment and batch data.

---

## Messenger — Team Chat (`/messenger`)

**What it is**: internal team communication — direct messages, team and
project-linked channels, group chats, announcements, meetings, and file
sharing.

**Why it exists**: to keep internal comms tied directly into real company
context (a project's own channel, an employee's real identity) instead of
depending on an external chat SaaS that knows nothing about SelfRun Business's data.

**Benefits**:
- No per-seat licensing cost for an external chat tool.
- Project channels and org structure are real, not manually recreated —
  channel membership can reflect actual project teams.
- Company communication data stays in-house rather than living on a
  third-party's servers.

---

## LMS — Lead Management System (`/lms`)

**What it is**: despite the internal name, this is SelfRun Business's marketing CRM
— inbound leads, clients, campaign analytics, career applicants, and an AI
chatbot + voice assistant that qualifies and responds to inbound interest
around the clock.

**Why it exists**: every inbound lead from the public website needs to be
tracked, followed up, and converted — not lost in an inbox.

**Benefits**:
- No lead falls through the cracks — every inquiry becomes a tracked record
  from first contact to close.
- The AI chatbot/voice assistant gives instant 24/7 first response before a
  human ever gets involved.
- Campaign-level analytics show which marketing actually produces leads
  worth having.

---

## External Portal (`/portal`)

**What it is**: a separate, external-facing self-service portal for clients,
job applicants, interns, and trainees — using its own independent identity
system, entirely separate from internal staff logins.

**Why it exists**: clients want to see their project's progress and
invoices; candidates want to see their application status; trainees want to
see their schedule and certificates — none of them should ever need, or be
given, access to internal systems to get that.

**Benefits**:
- Professional, self-service visibility for every external stakeholder —
  fewer "what's my status?" emails and calls.
- Clean security boundary: the external identity store is structurally
  separate from the internal one, so a client account can never reach
  internal tooling by design, not just by convention.

---

## SEO Panel (`/seo`)

**What it is**: the single place SelfRun Business's search presence is managed —
automated website audits, technical and on-page SEO, keywords and rank
tracking, content SEO, internal links, backlinks, competitors, the sitemap,
robots.txt and structured data, plus the issue and task queue that gets
problems fixed. It is SEO only: campaigns and leads stay in the LMS.

**Why it exists**: search visibility was spread across hard-coded page
metadata, a static robots.txt, Search Console and spreadsheets. The panel
is now the source of truth, and the public website reads from it. Page
titles, descriptions, canonicals, robots directives, social tags, sitemap
inclusion, robots.txt and JSON-LD edited here go live without a deploy.

**Benefits**:
- A crawler audits the whole site against 50+ technical, on-page, content,
  link, mobile, performance and structured-data checks. Every finding comes
  with a recommendation, and a fix is verified automatically by the next
  audit.
- Numbers are labelled by trust. Search Console, Analytics and our own crawl
  are *verified*; keyword-tool and competitor figures are *estimated*.
  Nothing is presented as more certain than it is.
- Guard-railed changes: robots.txt and schema are validated before they can
  be published, and every change is audit-logged with a before/after diff.

---

## Digi Locker — DLMS (`/dlms`)

**What it is**: the secure vault for the logins, documents, URLs, accounts and
notes that belong either to SelfRun Business itself (the **Company Vault**) or to one
specific client. Every record is owned by *Company* or by exactly one client.

**Why it exists**: shared logins, registrar and hosting accounts, agreements,
KYC files and certificates were scattered across chats, spreadsheets and
personal drives, with no record of who opened what and no warning before
something expired.

**Benefits**:
- Passwords are encrypted at rest, masked by default, and shown or copied only
  by people with the *reveal* permission — each reveal is logged, and secrets
  never appear in logs, notifications or list payloads.
- One profile per client (credentials, URLs, documents, notes, expiry) built on
  the existing client master and company record — nothing is duplicated.
- Documents are private, versioned, and served only after a permission check.
- A daily expiry sweep flags expired and soon-to-expire credentials, domains,
  hosting, certificates and licences to DLMS managers.
- Employees only see the clients (and, optionally, the company vault) they are
  assigned to; managers and admins see everything.

---

## AI Bots (`/aibots`)

**What it is**: a catalogue of purpose-built AI assistants — ProposalGPT,
Requirement Analyzer AI, Meeting Assistant AI and whatever else the team
creates — each with its own instructions, OpenAI model, private knowledge base
and access list, plus a chat workspace for every one of them.

**Why it exists**: people were pasting the same company profile, templates and
"act as…" prompts into a general chatbot over and over. A bot captures that
setup once so everyone gets consistent, grounded answers.

**Benefits**:
- A new bot is configuration, not code: create it, upload its knowledge files,
  choose who can use it, and it appears in their sidebar straight away.
- Every bot's knowledge lives in its own OpenAI vector store, searched only by
  that bot. Chats keep their context in their own OpenAI Conversation.
- Only application metadata is stored in the database (bots, file records,
  chat pointers, a usage ledger). Transcripts are read back from OpenAI, and
  the API key never leaves the server.
- Role- and person-level access per bot, manager oversight of all chats, and an
  audit log of every bot, file and chat change.
- A dashboard of chats, executions, token usage, estimated cost and failures.

---

## Social Media Marketing — SMMS (`/smms`)

**What it is**: an AI-first workspace for social media campaigns, ads and posts
on Instagram, Facebook, YouTube, LinkedIn, Google Ads and Google Business
Profile — both image and video content. The work moves through one flow:
create → AI generate → edit → preview → schedule → publish → analytics.

**Why it exists**: campaign strategy, ad copy, captions, video scripts and
per-platform versions were being written by hand, one platform at a time, and
nobody could see what was scheduled, approved or live.

**Benefits**:
- OpenAI turns a campaign brief into a strategy, audiences, keywords, hashtags
  and ad concepts per platform. It turns one post idea into a separate,
  within-limits version for each selected platform. It writes image and video
  creatives (prompts, hooks, scene-by-scene scripts, thumbnails) and can
  generate the images themselves.
- Every AI output and every saved edit is a version that can be viewed and
  restored. Regenerate, refine ("shorter", "lead with the offer"), duplicate,
  and adapt an ad to another platform.
- The AI writes from one central brand context. Company details, the service
  catalogue, live Festival Offers and PMS clients are read live from the panels
  that own them, never copied.
- A central, private media library of images and videos. Uploads go straight
  from the browser to storage, so large videos aren't capped.
- Nothing is published without a person. A post goes out only through an
  explicit Publish (via a connected Meta, Google or LinkedIn account, or by
  "mark as published" after posting natively), or through a schedule that
  someone with Publish permission approved. Editing withdraws the approval.
  Paid ads are never launched or funded from the panel.
- Ad spend and results aren't duplicated. Campaigns link to the LMS's imported
  ad-platform data, and organic post performance is recorded per platform.
- Five roles (Employee → Specialist → Manager → Admin, plus Super Admin), 13
  overridable permissions, notifications and an append-only activity log.

---

## Online Test System — OTS (`/ots`)

**What it is**: one test engine for every kind of assessment — employee
technical and compliance tests, certification exams, applicant screening, and
course, chapter, mock and final exams for students. It covers the whole flow:
create → configure → add questions → assign → take → submit → evaluate →
result → history. Staff build and assign tests at `/ots`. Employees take their
tests under OTS → My Tests. Applicants and students take theirs in the External
Portal (Tests & Exams / Assessments). All three groups use the same engine and
the same exam screen.

**Why it exists**: hiring screens, training quizzes, compliance checks and
course exams were each run with separate forms and spreadsheets. None of them
could be reused, timed, marked consistently or compared.

**Benefits**:
- One reusable question bank with 17 question types:
  - choice, true/false and yes/no;
  - short answer, long answer and fill-in-the-blank;
  - code output, coding, SQL and debugging;
  - match-the-following and ordering;
  - image-, audio- and video-based questions.

  It supports import/export (CSV/Excel), bulk creation and "used in N tests"
  tracking. Each question type is one registry entry, so adding a new type
  doesn't touch the test engine.
- Tests are built step by step: sections, section timers and section marks,
  questions picked by hand, and automatic rules (e.g. "10 beginner +
  10 intermediate + 5 advanced"). The builder also covers random question and
  option order, questions per attempt, negative marking, attempts with
  latest/highest/average scoring, navigation rules, result visibility and
  certificates.
- Tests can be assigned to a department, role/designation, team, employee
  type, platform role, individual employee or staff user, individual
  applicant, applicants for a position, a student, a TMS batch or a course.
  People are resolved live from HRMS, Careers and TMS. The same test is never
  assigned twice to someone who already has it open, and a later re-sync picks
  up people who joined since.
- Timing is enforced on the server. A reload or closed tab never adds time.
  Timed-out attempts are submitted as `TIMEOUT_AUTO_SUBMISSION`, and
  submitting twice has no effect.
- Configurable exam security:
  - full screen required;
  - tab-switch detection;
  - copy/paste and right-click blocking;
  - one window at a time;
  - IP and device recorded;
  - automatic submission after N violations.

  Every event goes to the audit log. This makes cheating harder and visible; it
  does not make an online exam cheat-proof.
- Objective answers are marked automatically. Subjective ones go to an
  evaluation queue. Evaluators can override marks, managers publish held
  results, and pass/fail, section-wise scores and certificates follow
  automatically.
- Certificates can be verified publicly at the same `/verify/<code>` page as
  training certificates.
- Reports and analytics show performance by test, person, department, role,
  applicant, student, batch, course, question (hardest, most-missed,
  most-skipped, time per question), section, attempt, pass/fail, time and
  difficulty, with CSV/Excel export.
- OTS never becomes a people master. Employees, applicants, students,
  departments, roles, batches and courses stay in HRMS, Careers and TMS.
  Recruiters, HR and trainers see a person's tests right on the applicant,
  employee and student pages.

---

## Help & Support (`/support`)

SelfRun Business's own help desk for every company on the platform. Companies get an **AI Help Chatbot** (also one click away from every panel's top bar, aware of the panel and page the user is on), a searchable **Help Center**, and **My Requests** for support requests, bug reports, feature requests, improvements and feedback. The chatbot answers only from help articles SelfRun Business publishes and offers to turn an unresolved chat into a request the user reviews before sending. Bug reports capture panel, page, route, browser, OS and device automatically.

All requests are received centrally: the data lives in platform-level collections (`support_*`), every row carries its `companyId`, and company-facing queries are always pinned to the caller's company. SelfRun Business staff work them in the Platform Panel (**Support requests**, **Help content**, **Support settings**; permissions `support.read` / `support.manage`): assign, prioritise, reply, add internal notes, and use AI triage (summary, category/priority/team suggestions, duplicates, suggested reply). Request types and their form fields, categories, priorities, severities, teams and the status workflow are configuration, not code.

## The common thread

Every panel above is real, in active use, and built specifically around how
SelfRun Business works — not a generic template. What ties them together isn't just
shared visual design: it's one identity store, one login experience via the
Staff Hub, one granular permission system a Super Admin can actually see and
control, and one executive dashboard that can honestly say it's showing real
numbers from every one of them.
