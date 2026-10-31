# SelfRun Business — Products

SelfRun Business is a suite of products on one platform. A company signs up, picks a plan and gets the products it needs, all
sharing one identity, one design system, one permission model and one set of business data. This document explains what
each product is for and what it gives a company. For setup and deployment, see [README.md](../README.md).

## One platform instead of many tools

Growing companies end up with a pile of separate products: an HR system, a project tool, a CRM, an accounting package, a
chat app, a document tool. Each has its own login, its own billing and its own data silo, and none of them talk to each
other.

SelfRun Business is built the other way around:

- **One sign-in.** A user signs in once and reaches every product their roles allow (single sign-on across products).
- **One set of data.** A client created in Projects is the same client in Finance, CRM and the Portal. Nothing is re-typed.
- **One permission model.** Roles and per-person overrides are managed in one place, and every sensitive change is logged.
- **AI throughout.** Each product can use AI where it saves time, always under the user's own permissions.
- **Pay for what you use.** Plans decide which products a company gets; companies can add products later.

Every company is a separate tenant. Its data, users, website and settings are isolated from every other company.

## Product suite

| Group | Products |
| --- | --- |
| Core | [SelfRun CommandOS](#selfrun-commandos-commandos), [SelfRun Huddle AI](#selfrun-huddle-ai-huddle-ai) |
| People and operations | [SelfRun TalentOS](#selfrun-talentos-talentos), [SelfRun SprintOS](#selfrun-sprintos-sprintos), [SelfRun SpendIQ](#selfrun-spendiq-spendiq), [SelfRun Cohort AI](#selfrun-cohort-ai-cohort-ai), [SelfRun Playbook AI](#selfrun-playbook-ai-playbook-ai) |
| Sales and finance | [SelfRun DealFlow AI](#selfrun-dealflow-ai-dealflow-ai), [SelfRun CashFlow AI](#selfrun-cashflow-ai-cashflow-ai) |
| Documents and knowledge | [SelfRun ContractFlow AI](#selfrun-contractflow-ai-contractflow-ai), [SelfRun CyberVault](#selfrun-cybervault-cybervault), [SelfRun EvalIQ](#selfrun-evaliq-evaliq) |
| AI | [SelfRun AgentOS](#selfrun-agentos-agentos), [SelfRun DataBrain AI](#selfrun-databrain-ai-databrain-ai) |
| Marketing and web | [SelfRun ViralPulse AI](#selfrun-viralpulse-ai-viralpulse-ai), [SelfRun RankMax AI](#selfrun-rankmax-ai-rankmax-ai), [SelfRun SiteCraft AI](#selfrun-sitecraft-ai-sitecraft-ai), [SelfRun Sites](#selfrun-sites-on-each-company-website) |
| External users | [SelfRun ClientOS](#selfrun-clientos-clientos) |
| Customer support | [SelfRun ResolveIQ](#selfrun-resolveiq-resolveiq) |

The platform staff also use the [Platform Console](#platform-console-console), which is not part of any company.

---

## SelfRun CommandOS (`/commandos`)

**What it is.** The company's operating home: one sign-in page and a personal dashboard that shows the products each user can reach, with
live numbers from the products the company uses. It also holds the company's settings.

**Settings:** profile and branding (logo, colours, wordmark), users and roles, security, domains (automatic address and
custom domains with TLS), billing and plan, payments, integrations, automations, usage and the **audit log** of every
change across the company.

**Benefits**
- One place for leadership to see the business and for admins to control access.
- A new hire sees only what they can do, so onboarding is simple.
- Every change is auditable: who did what, when, with a before and after.
- Company-wide search (⌘K) finds a record in any product, and one notification inbox collects everything that needs a person, with preferences for which alerts reach them and where.
- The executive dashboard and a product performance matrix show live numbers and status for every product the company uses, with per-product analytics filtered by date, department and owner.
- Guided company setup walks a new company through its profile, departments, invitations and which products the team uses; invitations go out by email with a role, and accounts are email-verified before anyone gets access.
- Roles and permissions can be customised per product and per action, with per-person overrides, and seats used are always visible.
- Branding (logo, name, accent, theme) flows into every product, email and PDF, and the company can have its own installable web app plus Android, iOS, Windows, macOS and Linux apps.
- Automations ("when this happens, do that") start from ready-made templates, with a run history of what each workflow did and why, and signed webhooks to other software.
- A **Notification center** lists every email, in-app and push notification the workspace sends, with per-channel on/off, editable wording with live preview, and announcements the company can send now or schedule to everyone, a role or chosen people.
- **Documents & PDFs** lists every PDF the system makes, with a preview in the company's own letterhead and what each contains, when it is made, where it is used and how it reaches people.
- **Scheduled jobs** shows everything the workspace does by itself (backups, reminders, notification sweeps, billing checks), with its schedule in the company's own time zone and when it last ran.
- **AI prompts** lets a company reword the instructions behind its AI assistants for its own workspace only, with every version kept and restorable, and fixed security rules always applied around its wording.
- **Integrations** lets a company connect its own email, AI, voice, WhatsApp, push, social, Google and payment accounts; a company's own key is used first and SelfRun's is the fallback.
- Security shows every signed-in device (log out one or everywhere), sign-in history kept for 180 days and accounts that need attention; weekly backups can be downloaded and restored, and data can be imported from validated CSV files.
- Billing shows the plan, invoices, credit notes and usage (seats, AI, email, voice, storage) against the plan; when a free trial ends without a subscription the workspace locks to a subscribe page (nothing is deleted) until a plan is bought.

---

## SelfRun Huddle AI (`/huddle-ai`)

**What it is.** Direct messages, team and project channels, group chats, announcements, meetings with audio/video calls and
file sharing.

**Benefits**
- Channels follow real teams and projects, so membership stays accurate without manual set-up.
- Company conversations and files stay inside the company's own workspace.
- No separate per-seat chat subscription.
- Replies stay grouped in message threads; messages can be reacted to, forwarded, pinned or starred, and voice notes can be recorded from the composer.
- Announcements go to the whole business or a chosen audience, can be scheduled, and track who has read them.
- Search covers messages, people and files, shared files from every conversation are in one place, and presence shows who is around.
- Meetings and group calls run in the same workspace, with unread counts so nothing is missed.
- Roles, retention and permissions are settings, and activity is recorded in the central audit log.

---

## SelfRun TalentOS (`/talentos`)

**What it is.** Employee records, org structure (departments, designations, teams, reporting lines), attendance, leave,
payroll with payslips and payouts, and a recruitment pipeline that turns a shortlisted applicant into an employee.

**Benefits**
- One source of truth for every employee and their history.
- Self-service leave and attendance, with manager approval in the same system.
- Payroll is computed from real attendance and leave, with payslips and payout tracking.
- Bank details are encrypted at rest, and sensitive changes (status, salary, roles) are audit-logged.
- A role-aware staff dashboard shows HR work, employee changes and pending actions; the organisation tree shows who reports to whom.
- Each employee has a full profile with personal, job and salary details, documents (contracts, IDs, certificates) and bank accounts used for salary payouts.
- Employees get portal access for self-service: their own attendance check-in, leave requests and balance, salary and payslips, documents and a company directory.
- Leave types, balances, holidays and approval rules are configured by the company, and leave requests reach the right approver as a notification.
- Indian statutory payroll: PF (with EPS, EDLI and admin charges), ESI, professional tax by state, labour welfare fund, statutory bonus, gratuity, leave encashment and full-and-final settlement, with income tax (TDS) worked out monthly under the old or new regime from each employee's declaration.
- Paid days come from real attendance, approved leave and the holiday calendar (state-wise holidays, alternate Saturdays, half-days, sandwich rule), so loss of pay is calculated, not typed.
- Employees ask for overtime, partial leave (two a month) and expense claims for money they spent on work from the portal; managers approve, and payroll pays them automatically.
- Employees declare investments and choose the tax regime with a live comparison of old and new regime tax, worked out from their actual salary.
- Every payment goes through the company's own Razorpay account: salaries, vendor bills, refunds and reimbursements are paid by RazorpayX, customers pay invoices and payment links by Razorpay Checkout, and each payment is booked in CashFlow against the RazorpayX balance. The current account tops up RazorpayX; government dues (PF, ESI, tax) are paid on their portals from the current account and recorded.
- A government payments page shows what is owed to PF, ESI, income tax and the state each month, the due dates, and records the challans.
- Every run is checked before approval, with blocking and review warnings; individual salaries can be held, and one-off bonuses, recoveries, loans and advances are picked up automatically.
- PF ECR, ESI, professional tax and TDS files, a payroll register and an accounting journal download straight from the run.
- Payroll runs for a month in one flow, with salary revisions tracked, payslips generated for each employee and salary payouts posted to SelfRun CashFlow AI automatically.
- The recruitment pipeline runs from application to offer, and HR analytics show headcount, hiring, attendance and leave trends.

---

## SelfRun SprintOS (`/sprintos`)

**What it is.** Clients, projects, milestones, tasks, timesheets, shared documents, activity and project costing.

**Benefits**
- Real profitability: estimated versus actual cost and hours, from logged timesheets.
- Guarded status workflows keep pipeline data trustworthy.
- Timesheet-driven billing instead of month-end guesswork.
- Projects can be seen as a kanban board, task lists, a Gantt-style timeline or a calendar of deadlines and milestones.
- Tasks carry assignees, due dates and priorities, and each project keeps its documents, files and discussion with it.
- Milestones track and bill delivery stages, so billing follows the work; a project's financial summary can be downloaded as a PDF.
- Overdue warnings tell people before a project slips, and assigned or overdue tasks reach the person as a notification.
- Every team member gets a personal workspace: only the projects they are on, their own task list and a timesheet to log time in seconds, with timesheets approved by managers.
- Costing shows budget, cost and profitability per project, and project analytics show delivery and workload trends.

---

## SelfRun SpendIQ (`/spendiq`)

**What it is.** Vendors, requisitions, purchase orders, RFQs, goods receipt, assets and inventory, budgets, expenses,
infrastructure and software subscriptions, vendor invoices and payments.

**Benefits**
- Every purchase goes through a level-based approval chain before money moves.
- Spend against budget is visible as it happens.
- Full asset lifecycle: who has what, current value and status.
- Employees raise and follow their own purchase requests and expense claims from My requests and My expenses.
- Approval chains depend on the amount; RFQs collect and compare supplier quotes before a purchase order is issued.
- Goods receipt records what arrived, and vendor invoices are matched three ways (order, receipt, invoice) before approved invoices are paid.
- Vendors have a directory with history and performance, and supplier contracts are tracked with renewals.
- Budgets are set and watched, and procurement analytics show trends and detailed reports.
- Business assets are covered end to end: hardware registered and assigned to people, software subscriptions with renewal alerts, infrastructure (servers, domains, hosting) and inventory with stock movements.
- Supplier invoices and purchase payments connect to SelfRun CashFlow AI.

---

## SelfRun Cohort AI (`/cohort-ai`)

**What it is.** For companies that run training or internship programmes: programmes, batches, applications and enrolment,
classes and attendance, assignments and submissions, mentors, placements, fees, and certificates that anyone can verify
publicly at `/verify/<code>`.

**Benefits**
- The whole student journey (apply, enrol, learn, place, certify) in one system.
- Honest placement and revenue numbers for the training business.
- Fee plans, wallet credits and invoices tied to real enrolment data.
- Programmes hold the curriculum; batches add a schedule, mentors and capacity, and all batches appear on one batch calendar.
- Applications can be reviewed as a searchable list or moved through a board pipeline; accepted applicants become students.
- Classes carry schedules and attendance; assignments are set, submitted and reviewed; live projects give students real work; mentor tools guide students through the programme.
- Fees support instalments, receipts and reminders, and students pay online from their portal.
- Placements are tracked, and reports cover enrolment, attendance and revenue.
- Students get their own portal: dashboard, programme and batch, class schedule, assignments and projects, certificates, payments and profile.
- Certificates are issued with public verification, and student fees and receipts connect to SelfRun CashFlow AI.

---

## SelfRun Playbook AI (`/playbook-ai`)

**What it is.** Standard operating procedures with sections, checklists and links; versions and approval; confidentiality
levels; assignment to people and departments with acknowledgement tracking; feedback and an audit trail.

**Benefits**
- Everyone works from the current approved version, and you can prove who read it.
- A daily scheduled job keeps review and acknowledgement state up to date.
- Procedures are written in a block editor or started from a template, organised by department and category, each with an owner.
- Every revision is kept in version history, and two versions can be compared side by side for content and metadata differences.
- Assignments go to people, teams, departments or roles; "Assigned SOPs" shows each person what they must read and confirm, and overdue acknowledgements show in compliance reports.
- Review and expiry schedules remind owners before a procedure is due for review.
- Staff can leave feedback on a procedure, and reports and analytics show usage and compliance trends.
- Settings, permissions and the full history are recorded in the audit trail.

---

## SelfRun DealFlow AI (`/dealflow-ai`)

**What it is.** Inbound leads and clients, pipeline and timelines, messages, campaign analytics (including imported ad
platform data), career applicants, **festival offers and coupons**, and a **wallet and credits** system with referrals,
streaks and usage rules. It also manages the website's AI chatbot and voice assistant.

**Benefits**
- Every enquiry from the company's website becomes a tracked record from first contact to close.
- The chatbot and voice assistant give a first response around the clock.
- Offers, coupons and referral rewards are configured by the company with no deployment.
- Every lead has an owner, a status (New, In progress, Completed, Rejected), a source, a due date and notes, with saved filters to segment by category, status, source and date.
- Leads untouched for days are flagged as pending tasks, and two-way messages with leads and portal users keep the conversation on the record.
- Website forms create leads automatically, existing leads can be imported from CSV with validation, and the current view can be exported to CSV.
- Campaign analytics show pipeline health, spend, ROI and conversion; campaign reports can be imported (and the import undone), and leads can be filtered by campaign attribution.
- Career applicants are managed with status, notes, resumes and interview scheduling.
- Festival offers, coupons and claims, wallet and credits with referral campaigns, reward rules and usage rules are all set up by the company.
- The website chatbot is taught from a knowledge base, has configurable tone, behaviour and limits, and every chat and voice call is logged and searchable.

---

## SelfRun CashFlow AI (`/cashflow-ai`)

**What it is.** Invoices, receipts, credit notes, chart of accounts, ledger and journals, bank and cash accounts, fiscal
periods and financial reports.

**Benefits**
- Invoices, receipts and the ledger stay linked to the same clients and projects as the rest of the business.
- Bank account numbers are encrypted at rest.
- Wallet credits can be applied to eligible invoices.
- Money in: receivables, invoices, credit notes, receipts, payment links on any invoice, refunds with a trail, and customer records with history.
- Money out: payables, supplier bills, debit notes, payouts to suppliers and staff, a vendor and bank directory, advances and employee expenses with approvals.
- Banking: every bank and cash account with its transactions, transfers between accounts, and bank and cash reconciliation against statements.
- Books and reports: general ledger, trial balance, profit and loss, balance sheet, cash flow, tax reports, budget versus actual, project profitability, and revenue and expense reports.
- Control: approval rules with thresholds and approvers, a chart of accounts the company shapes itself, fiscal periods that can be opened and closed, document numbering, GST and tax rates, and multi-currency exchange rates.
- **No rates to type**: TDS rates and limits, the company's income-tax rate, surcharge, cess and MAT, the advance-tax instalment dates and the due date of every return and payment come from a *tax rulebook* the platform publishes once for every company (Console → Tax rulebook), financial year by financial year, with who checked it and when. A company only says which tax basis it is on, which TDS sections it does not use, and four yes/no facts about itself. Until the platform has checked a year's table, every screen that uses it says the figures are indicative.
- **Simple navigation** (see `docs/accounts-simplification.md`): the CashFlow sidebar has eight places — Home, Money in, Money out, Bank & cash, Taxes, Month & year-end, Reports, Settings. Bank & cash, Taxes and Month & year-end are hubs: big plain-language cards with one live status each, so a person who is not an accountant is sent to the right screen. Home starts with "Needs your attention" (the few checks that are not fine, worst first, each linking to where it is fixed) and a "Get started" list of the one-time setup steps. Every older page keeps its address.
- **Income tax** (`/cashflow-ai/income-tax`): the working behind the company's return, prepared for the CA (nothing is filed). *Tax for the year*: starts from the profit in the books, applies the additions and deductions the company enters with its CA, sets off the losses it chooses, and works the tax at the rate, surcharge, cess and (if the CA says it applies) MAT rate the company enters; every rate and adjustment is the company's, none is assumed, and the working says so wherever a rate is missing or not yet confirmed. Tax paid, TDS deducted by customers and self-assessment tax are subtracted to show the balance or refund. The year's tax can be put into the books as a provision (Income tax expense / Provision for income tax). *Advance tax & payments*: each payment of advance, self-assessment or assessment tax is recorded with its challan details (with accrual books on it posts to the ledger), against an instalment schedule the company types in from its CA; interest is left to the CA. *Losses carried forward*: a register typed in from the CA. *Return, audit & notices*: filing and e-verification status per year, the tax-audit status, and a register of notices with a reply-due countdown from the date on the notice.
- **TDS** (`/cashflow-ai/tds`): working for the tax the company deducts from vendor payments, prepared for the CA (nothing is filed). *Sections & rates*: the company enters each section it deducts under with the rate, single-payment limit, yearly limit and no-PAN rate its CA gives it, and ticks Confirmed once the CA agrees (who and when are recorded); nothing statutory is built in, and unconfirmed numbers make every check indicative. A vendor bill in SpendIQ can carry an optional TDS section. *Deductions & deposits*: every bill's deduction is checked against its section (short, excess, nothing deducted although the limit is crossed, PAN missing or wrong), by section and financial year. *Challans*: tax deposits are recorded (BSR code, serial, date) and compared month by month with what was deducted; with accrual books on a deposit posts Dr TDS payable / Cr bank and cancelling reverses it; salary TDS from payroll is shown read-only. *Quarterly statement*: deductee-wise rows by quarter with section subtotals and a CSV working file for the CA (not the government upload format). *Certificates*: Form 16A issued or still to issue per vendor and quarter, and a register of lower or nil deduction certificates (information only). *TDS deducted by customers*: upload a CSV of the Form 26AS credits and match them with the receipts that recorded TDS; the portal's own 26AS layout has not been checked.
- **GST** (`/cashflow-ai/gst`): the working behind a month's returns, prepared for the CA (nothing is filed). *Monthly summary*: tax on sales by rate and head (IGST / CGST / SGST), input credit by decision, and tax less credit head by head (set-off across heads is left to the CA). *Sales*: the month's issued invoices as B2B and B2C tables with a Needs-attention list (invalid recipient GSTIN, unknown place of supply, missing HSN / SAC, foreign currency) and a CSV for the CA's GSTR-1 tool; invoice lines now carry an optional HSN / SAC code (4, 6 or 8 digits) that shows on the PDF. *Purchases*: the month's vendor bills with the company's decision on each bill's input credit (to review, eligible, blocked, not eligible, reverse charge); only eligible and reverse-charge bills are counted, and which purchases are blocked is the CA's call. *Match with GSTR-2B*: upload the portal's GSTR-2B (JSON, or a simple CSV) and see which bills match, differ, are missing from the books or from the statement; the layout of the portal JSON follows public documentation and has not been checked against a live download.
- **Month-end close** (`/cashflow-ai/month-close`): a guided checklist for each month. Bank lines, Razorpay settlements, cash counts, payroll and dues, bill and receipt documents, unclassified entries, the ledger-versus-records check and the trial balance are checked from the books; the other reviews are recorded by a person with name and date. The last step locks the month through the fiscal-period close; a failing check blocks it unless an authorised person saves a reason, which is shown and audit-logged.
- **Party reconciliation** (`/cashflow-ai/party-reconciliation`): for each customer and vendor, a dated statement of account built from invoices, receipts, credit notes and refunds (customers) or bills, payments and debit notes (vendors), with ageing from the due date, unusual balances, unapplied advances, duplicates and old items. A balance the other party confirms is compared with ours and likely causes are listed. A write-off register records proposals and approvals by a second person; it posts nothing to the ledger.
- **Vendor controls** (`/cashflow-ai/vendor-controls`): a change to a vendor's bank details waits for a different person to verify it independently (payment code, method and note) before it can be paid; the earlier verified details stay in force meanwhile and the owners are alerted. MSME vendors carry a Udyam number and category; the payment days are entered by the company (nothing is assumed) and bills past them are flagged. Vendor advances and deposits are kept in a register and can be adjusted against a bill without exceeding either amount (the register does not post to the ledger).
- **TDS deducted by customers**: when accrual books are on, a receipt can record the TDS the customer deducted; the invoice is settled by the money received plus the TDS, and the TDS is kept as a tax credit (account 1510) to claim.
- **Accrual books** (`/cashflow-ai/settings/accrual`): switch the ledger to the accrual basis a company's books require. Invoices and vendor bills are posted when raised (receivable, revenue, GST; cost, GST input, payable, TDS), receipts and vendor payments settle them, opening balances come from the invoice and bill records, and the page shows whether the ledger agrees with those records.
- **Razorpay Settlements** (`/cashflow-ai/settlements`): reads what Razorpay settled to the bank, checks the fee, GST on the fee, refunds and net add up, matches each payment to a customer payment, and books fee, GST and net in one step. Anything odd (chargeback, unknown payment, mismatch) is held for a person.
- **CA & Compliance** (`/cashflow-ai/compliance`): a live book-health panel (balanced trial balance, unmatched bank lines, unlocked finished periods, overdue invoices and bills, GST rates, overdue payroll dues), the CA checklist (every section of the company's CA checklist with status, owner and a note for where the proof is kept) a filing calendar (GST, TDS, income tax, payroll dues, MCA/ROC) with proof of filing and daily reminders, notes on checklist items that the books can confirm or contradict, a "Books clean-up" page (duplicate vendor bills, bills with no document, entries with no account) and a "who does what" page naming the person or firm for each kind of work. Due dates are never assumed: they are entered, and marked when the CA has confirmed them.
- A central payment engine shows payment intents, successful collections and gateway status; invoices can be paid online through the company's own payment account.
- Salary payouts from SelfRun TalentOS, supplier invoices from SelfRun SpendIQ, milestone billing from SelfRun SprintOS and student fees from SelfRun Cohort AI post here automatically.

---

## SelfRun ContractFlow AI (`/contractflow-ai`)

**What it is.** A document maker for agreements and policies. Admins define **document types** (employment agreements,
NDAs, service agreements, privacy and internal policies) with fields and numbering, build **templates** from blocks
(headings, clauses, tables, variables, signature blocks), and run documents through **approval workflows**. Documents carry
versions, signature requests and a full audit trail, and export as PDF, DOCX or print.

**Benefits**
- Standard wording is written once and reused, with variables filled from HR, projects, finance and Digi Locker data.
- Every document has an owner, a status (draft, review, pending approval, approved, published, active, archived) and a history.
- Optional AI drafting from a short prompt.
- A legal documents dashboard shows document status, creation trends and approval activity.
- Maker types control who can create which kinds of documents; workflows define the approval chain for each document type; categories keep the library organised.
- Approvals and signature requests are tracked in one place, and document history shows who changed and approved what.
- Notifications go out when documents are issued, approved or expiring.

---

## SelfRun CyberVault (`/cybervault`)

**What it is.** A secure vault for logins, documents, URLs, accounts and notes. Every record belongs either to the **company
vault** or to exactly one client.

**Benefits**
- Passwords are encrypted at rest, masked by default, and revealed only to people with the reveal permission; each reveal is
  logged and secrets never appear in logs or notifications.
- One profile per client (credentials, URLs, documents, notes, expiry) built on the existing client record.
- Documents are private and versioned.
- A daily sweep flags credentials, domains, hosting and certificates that are expired or about to expire.
- Employees see only the clients (and optionally the company vault) they are assigned to.
- The vault covers credentials and keys, documents with version history, URLs and online accounts, and secure notes.
- Access is per record: share exactly what is needed, with roles and permissions in settings.
- An activity log shows who opened or changed what, and notifications report vault events and expiry alerts.

---

## SelfRun EvalIQ (`/evaliq`)

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
- Question categories and test categories keep the bank and the tests organised, and questions can be added one by one, in bulk by typing or pasting, or imported from files.
- Evaluators are notified of pending subjective answers, and results are released to candidates on the schedule the test sets.
- Candidates, employees and students take tests in their own portal, see their results and scores once released, and download certificates issued on passing.
- Hiring screening lets a test be assigned to a candidate straight from the hiring workflow.
- Test reports and analytics show performance across tests, and notifications keep everyone up to date on assignments and results.

---

## SelfRun AgentOS (`/agentos`)

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
- Each assistant is created with instructions and knowledge files, and can be paused, edited or deleted from a management screen.
- Access modes per assistant: the team, customers or both; people start a chat from Start new chat or Find a bot.
- Managers can read all chats and open any single conversation; usage and cost are tracked per assistant.
- The AI operations dashboard shows executions, token trends, failures, popular assistants and recent chats; every change is in the audit trail.
- A company can set general instructions that apply to all of its assistants, and instructions for each assistant on top of them.

---

## SelfRun DataBrain AI (`/databrain-ai`)

**What it is.** Ask questions about the business in plain language. The assistant plans which data it needs (clients,
projects, tasks, timesheets, employees, leave, leads, invoices, receipts, expenses, vendors, purchase orders), reads it with
the **asker's own permissions**, and answers with the numbers behind the answer.

**Benefits**
- Leaders get answers such as "which projects are delayed" or "what did we invoice this month" without building reports.
- Access is respected: a person without Finance access is told the information is not available to them, not given a partial answer.
- It reads the live data of the other products, so there is nothing to import or keep in sync.
- Answers come from live, read-only queries, never from guesses, and each answer shows how it was calculated.
- The right view is chosen for the answer (table, chart or KPI); answer tables can be copied or downloaded as a spreadsheet (CSV).
- Suggested questions start from what people ask most; past conversations can be searched, reopened and deleted from the sidebar.
- Sensitive fields are never offered to the AI.
- AI usage is metered against the plan's allowance.

---

## SelfRun ViralPulse AI (`/viralpulse-ai`)

**What it is.** An AI-first workspace for social media campaigns, ads and posts on Instagram, Facebook, YouTube, LinkedIn,
Google Ads and Google Business Profile, for image and video content. One flow: create, AI generate, edit, preview, schedule,
publish, analytics.

**Benefits**
- AI turns a campaign brief into strategy, audiences, keywords, hashtags and ad concepts per platform, and one post idea
  into a separate, within-limits version for each platform, including image and video scripts.
- Every AI output and every edit is a version that can be viewed and restored.
- AI writes from one central brand context; company details, services and live offers are read from the products that own them.
- **Nothing is published without a person.** A post goes out only through an explicit Publish (via a connected Meta, Google or
  LinkedIn account) or a schedule approved by someone with Publish permission. Paid ads are never launched or funded from
  the product.
- A private media library, role-based permissions (Employee, Specialist, Manager, Admin) and an append-only activity log.
- A dashboard shows post and campaign performance, publishing activity and recent AI generations.
- Campaigns and ads start from a brief with spend tracking; posts are adapted per platform and can be refined with one sentence (tone refinement).
- Post details keep a version history, and an earlier version can be restored.
- A calendar schedules publishing, and an approval workflow means nothing publishes without sign-off.
- Platform connections link the company's business pages; a media library keeps images and video in one place.
- Analytics show campaign and post performance, and settings control roles and permissions.

---

## SelfRun RankMax AI (`/rankmax-ai`)

**What it is.** The place where a company's search presence is managed: automated website audits, technical and on-page SEO,
keywords and rank tracking, content SEO, internal links, backlinks, competitors, sitemap, robots.txt and structured data, plus
the issue and task queue that gets problems fixed.

**Benefits**
- A crawler audits the site against 50+ technical, on-page, content, link, mobile, performance and structured-data checks. Each
  finding has a recommendation and is verified fixed by the next audit.
- The public website reads from the product: titles, descriptions, canonicals, robots directives, social tags, sitemap and
  JSON-LD edited here go live without a deployment.
- Numbers are labelled by trust: connected sources and the company's own crawl are *verified*; keyword-tool and competitor
  figures are *estimated*.
- robots.txt and schema are validated before they can be published, and every change is logged with a before/after diff.
- A dashboard shows organic traffic, rankings, search impressions and audit performance; a site-wide SEO overview shows the health of the whole website.
- Audits are split into technical SEO (speed, crawl and index health), on-page SEO (titles, headings and meta) and content SEO (scores per page), with every page's SEO listed.
- Keywords are grouped and ranks tracked over time; competitors show who outranks the site; internal links show structure and gaps; backlinks monitor who links to the site.
- Sitemap, robots.txt and structured data (schema) are managed from the product and drive the live website.
- SEO issues become a prioritised fix list, and SEO tasks assign the fixes to owners; reports share progress.

---

## SelfRun SiteCraft AI (`/sitecraft-ai`)

**What it is.** SelfRun SiteCraft AI manages pages built from sections, navigation, footer, forms, themes and a colour palette, with page versions
and publishing. A starter site is created at sign-up so the public website is live immediately. Companies can add collections such as
products and blog posts. SelfRun Sites serves that published website on the company's automatic address or custom domain.

**Benefits**
- No developer needed for content, layout or theme changes.
- Lead forms feed the CRM directly; job applications feed HR careers.
- Display options (header, footer, section layout and width) are per theme.
- Pages are built with a drag-and-drop builder, saved as drafts and published when ready; draft changes can be previewed before publishing.
- Services, blog posts (with SEO fields), careers, hiring models, products and forms each have their own management screen, with a media library for images and files.
- Themes can be browsed, previewed live and activated; colours, fonts, corner radius and components are customised, with a navigation (menu) builder, footer columns and links, and site identity (brand, contact and social details).
- Collections let the company define structured content types of its own.
- An AI website generator builds content and design from the business profile, with saved versions that can be reviewed or restored.
- Festival offers, coupons, wallet and credits, referral campaigns and push notifications to visitors' devices are managed from here as well.
- Maintenance mode lets the company work on the site safely, and tracking settings are in one place.
- The AI chatbot and voice assistant on the website answer from the company's knowledge base, and every conversation is logged.

### SelfRun Sites (`/` on each company website)

SelfRun Sites serves the company's published public website on its configured domain. It is the delivery and hosting product paired with SelfRun SiteCraft AI, rather than a separate `/sites` page on the marketing site.

---

## SelfRun ClientOS (`/clientos`)

**What it is.** A separate, self-service portal for the company's clients, businesses, students, interns and job applicants,
with its own identity, separate from staff logins. Each person sees a dashboard that matches their role: project progress and
invoices for clients, schedule and certificates for students, application status and assessments for applicants, plus wallet,
credits and referrals.

**Benefits**
- Fewer "what is my status?" emails and calls.
- A clean security boundary: a portal account can never reach internal tools.
- Clients see their projects and milestones, invoices (and can pay them online), shared documents, messages with the team and meetings.
- Students see their programme, class schedule, assignments, attendance, tests and exams (taken in a distraction-free exam runner), certificates and results once released, and trainee payments.
- Applicants see their application and its status, interview schedule and assigned assessments.
- Every person has a wallet, referral and daily and journey rewards, notification settings and a profile; people can register their own external-user account.
- The company can review external portal users and suspend access when needed.

---

## SelfRun ResolveIQ (`/resolveiq`)

**What it is.** Customer support for every company. Customers get an **AI help chatbot** (one click from every
product's top bar and aware of the product and page the user is on), a searchable **help centre**, and **My requests** for
support requests, bug reports, feature requests, improvements and feedback. The chatbot answers only from published help
articles and can turn an unresolved chat into a request the user reviews before sending. Bug reports capture product, page,
route, browser, OS and device automatically.

Requests are received centrally: the data lives in platform-level collections, every row carries its `companyId`, and
company-facing queries are always pinned to the caller's company. Platform staff work requests in the Platform Console (assign,
prioritise, reply, internal notes, AI triage with summary, category, priority, team and duplicate suggestions, and a suggested reply). Request
types and their form fields, categories, priorities, severities, teams and the status workflow are configuration, not code.

**Benefits**
- Help is one click away from every product, and the assistant knows which product and page the person is on.
- The chatbot answers only from published help articles, so answers stay accurate.
- An unresolved chat becomes a request the user reviews before sending, so nothing is sent without their say.
- Requests can carry attachments, can be searched by title or number and filtered by status, and replying to a resolved request reopens it.
- People are notified when the support team replies, and bug reports capture product, page, route, browser, OS and device automatically.
- Platform staff get AI triage (summary, category, priority, team, duplicate and suggested reply) and request types, forms, categories, priorities, teams and the status workflow are configuration, not code.

---

## Platform Console (`/console`)

**What it is.** The console for the platform staff who run SelfRun Business. It is available only on the platform host and
only to platform staff, and is never offered to companies.

| Area | What it does |
| --- | --- |
| Companies | Registry of every company: status, plan, subscription, suspend and reactivate |
| Sign-ups | Approve or reject sign-ups when sign-up mode requires approval (modes: open, approval, closed) |
| Plans, add-ons, coupons | Plans and prices, which products each plan includes, add-ons, and coupons or complimentary grants |
| Subscriptions, invoices, revenue | Subscription state and events, invoices, revenue metrics |
| Payments | Razorpay keys and billing webhook for charging companies |
| Products | The Product Registry: names, descriptions, icons, order and global on/off |
| Domains and SSL | Every company's domains and verification state |
| Usage | Usage per company and per product |
| Support | Support requests, help articles and support settings |
| Platform users and roles | Platform staff accounts and what each may do |
| Settings and integrations | Platform name, root domain, email, billing seller details, sign-up mode and provider settings |
| Audit and notifications | A log of every platform action and platform notifications |
| Notification center | Every email, in-app and push event for all companies, switched on or off per channel (security and billing emails cannot be switched off) |
| Documents and PDFs | Every kind of PDF the system makes, with a sample in the platform's letterhead and usage across companies; any kind can be switched off for everyone |
| AI prompts | Every instruction sent to an AI model, editable with full version history and restore, a test run, and control over which prompts companies may reword for their own workspace |
| Cron jobs | Every scheduled job with its schedule, last run, run history, pause and failure alerts |
| AI usage | AI token history per company and feature |
| Incidents and maintenance | The public status page's incidents, and maintenance mode |

---

## The common thread

What ties the products together is not only the shared look. It is one identity and sign-in, one permission system an admin
can see and control, one set of business data that every product reads, and one audit trail. Companies start with the products
they need and add more as they grow, without migrating data or training people on a new tool.

### CashFlow AI — My work (`/cashflow-ai/work`)
The catalog (`work/catalog.ts`) lists every daily, weekly, monthly, quarterly and yearly piece of work as short steps that open the exact screen; the full list is in `docs/work-plan.md`. The pure engine (`work/engine.ts`) turns it into dated items for the company (due dates come from the Tax rulebook; others are marked "our suggestion"); only the company's ticks, skips and the plan start day are stored (`fms_work_log`, `fms_work_plan`). Steps CashFlow can prove itself (bank matched, no overdue bills, month locked …) show "Done by CashFlow", recomputed on the server. Work is done only when every step is ticked; skipping needs a reason and stays on record. Overdue work is never dropped. Home shows today's work, the sidebar starts with My work, and the daily sweep sends at most one "Work overdue" and one "Work due today" notification. Server actions only. Tests: `npm run test:work`. Pages not yet opened in a browser.
