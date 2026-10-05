# SelfRun Business Platform

One integrated suite of public, internal and external-user panels built on a
single Next.js app, a single MongoDB database, one shared identity and one
design system.

- **Public website:** marketing site, blog, careers, offers, rewards, register/login
- **Internal panels:** Admin, Workspace, HRMS, PMS, PRMS, TMS, FMS, Messenger, LMS
- **External portal:** for students, interns, clients, businesses and job applicants, with a wallet, credits and referral system

For what each panel is and why it exists, see [PANELS.md](./PANELS.md). This
file covers setup, running, seeding demo data, configuration and deployment.

---

## SaaS setup — step by step

SelfRun Business runs as one SaaS: the product website, sign-up and the Platform Panel on the SaaS host, and every
customer (including your own company) as an ordinary tenant on its own address. Everything below runs from the project
folder.

### 1. Environment (`.env`)

| Variable | Value |
| --- | --- |
| `MONGODB_URI` | a NEW, empty database for the SaaS (e.g. `…mongodb.net/selfrun`) |
| `SAAS_ADMIN_EMAIL` | the platform staff login, e.g. `info@selfrunbusiness.ai` |
| `SAAS_ADMIN_PASSWORD` | optional; omitted = a temporary password is printed once in the server log |
| `SAAS_HOSTS` | production only: `selfrunbusiness.ai` (in development `localhost` is a SaaS host automatically) |
| `PLATFORM_ROOT_DOMAIN` | production only: `selfrunbusiness.ai` (customers get `<slug>.selfrunbusiness.ai`) |

Keep the encryption keys and storage tokens (`PLATFORM_ENCRYPTION_KEY`, `HRMS_ENCRYPTION_KEY`, `FMS_ENCRYPTION_KEY`,
`DLMS_ENCRYPTION_KEY`, `SMMS_ENCRYPTION_KEY`, `BLOB_READ_WRITE_TOKEN` …) identical to the deployment you import data from.

### 2. First run

```bash
npm install
npm run dev
```

On the first start the server creates the platform operator and your staff account from `SAAS_ADMIN_EMAIL` and prints
`[saas] Platform operator … created`. `http://localhost:3000` is the product website; staff sign in at
`/workspace/login` and manage plans, prices and companies at `/platform`.

(Manual alternative: `npm run db:init-saas -- --email you@company.com`.)

### 3. Register a company

Open `http://localhost:3000/signup`, fill in company name, workspace address (the slug), work email, password, business
categories and accept the terms. The company's workspace is `http://<slug>.localhost:3000` in development and
`https://<slug>.<PLATFORM_ROOT_DOMAIN>` in production; the sign-up creates its Super Admin account.

### 4. Import an existing business (one time)

To bring a business that already runs on an older database onto the SaaS, register it first (step 3), then:

```bash
# dry run — shows what would be copied, writes nothing
SOURCE_MONGODB_URI='mongodb+srv://<user>:<password>@<cluster>/<old_database>' \
  npm run db:import-company -- --to-company <slug>

# copy it
SOURCE_MONGODB_URI='mongodb+srv://<user>:<password>@<cluster>/<old_database>' \
  npm run db:import-company -- --to-company <slug> --apply
```

Options: `--from-company <id|slug>` (which company of the old database; default the one flagged as owner),
`--only a,b,c` (just these collections; each is replaced, so it is safe to re-run), `--keep-script`.

- The old database is only read.
- Documents keep their `_id`s; settings, counters and themes are re-keyed for the new company.
- The target's own starter content in the imported collections is replaced; users are merged by email, so the account
  created at sign-up is kept.
- Every failure is printed (`✗ <collection>: … FAILED — <reason>`). The script deletes itself and its npm command only
  after a fully successful `--apply`.

Afterwards check `http://<slug>.localhost:3000` (website, products, offers), sign in at `/workspace/login` with an old
user's credentials, and set the company's two-tone wordmark in Settings → Branding if needed. Rotate the credentials you
used for `SOURCE_MONGODB_URI`.

### 5. Production (Vercel)

1. Make `selfrunbusiness.ai` the project's production domain; add each customer's own domain as a custom domain.
2. Set `MONGODB_URI` (the new database), `SAAS_ADMIN_EMAIL`, `SAAS_ADMIN_PASSWORD`, `SAAS_HOSTS`,
   `PLATFORM_ROOT_DOMAIN` and the keys/tokens from step 1, then deploy. The first start creates the operator.
3. Register the company at `https://selfrunbusiness.ai/signup`; import with the same commands, with `MONGODB_URI` pointing
   at the production SaaS database.
4. Verify each customer's domain in Settings → Domains.

A local-only copy of these steps with your real values lives in `SETUP.local.md` (git-ignored).

More detail: [docs/saas-product-separation.md](./docs/saas-product-separation.md) and
[docs/deploy-vercel.md](./docs/deploy-vercel.md).

---

## Table of contents

0. [SaaS setup — step by step](#saas-setup--step-by-step)
1. [Tech stack](#tech-stack)
2. [Panels and routes](#panels-and-routes)
3. [Quick start](#quick-start)
4. [Environment variables](#environment-variables)
5. [NPM scripts](#npm-scripts)
6. [Database and demo data](#database-and-demo-data)
7. [Demo logins](#demo-logins)
8. [Project structure](#project-structure)
9. [Architecture notes](#architecture-notes)
10. [Wallet, credits and referrals](#wallet-credits-and-referrals)
11. [AI chatbot and knowledge base](#ai-chatbot-and-knowledge-base)
12. [Build, verify and deploy](#build-verify-and-deploy)
13. [Troubleshooting](#troubleshooting)
14. [Contributing notes](#contributing-notes)

---

## Tech stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| Styling / UI | Tailwind CSS 4, shadcn-style components (`components.json`), Base UI, lucide-react, next-themes |
| Charts / motion | Recharts, Framer Motion |
| Data | MongoDB (official `mongodb` driver, no ODM) |
| Drag and drop | dnd-kit (Kanban boards) |
| Documents / exports | ExcelJS, `@react-pdf/renderer` |
| AI | OpenAI Responses API with file_search (chatbot), ElevenLabs (voice) |
| Payments (optional) | Razorpay / RazorpayX (payouts) |
| Hosting | Vercel (cron in `vercel.json`) |

> **Important: this is Next.js 16.** APIs, conventions and file structure differ
> from older versions (for example `src/proxy.ts` replaces middleware). Before
> writing framework-level code, read the relevant guide in
> `node_modules/next/dist/docs/` and heed deprecation notices. See
> [AGENTS.md](./AGENTS.md).

---

## Panels and routes

Each internal panel has its own login page (`/<panel>/login`) and its own
session cookie. Internal accounts all live in one `admin_users` collection with
per-panel `roles`. Logging into one panel provisions sessions for every other
panel the account has a role in (cross-module single sign-on).

| Panel | Route | Purpose |
| --- | --- | --- |
| Public website | `/` | Marketing pages, services, blog, careers, offers, FAQs |
| Register / Login / Rewards | `/register`, `/login`, `/rewards` | Public account creation, sign-in, "ways to earn credits" guide |
| Admin | `/admin` | Super-admin command center, users, roles, permissions, cross-module analytics |
| Workspace | `/workspace` | Staff hub for employees |
| HRMS | `/hrms` | Employees, org structure, leave, payroll, careers pipeline, offers |
| PMS | `/pms` | Clients, projects, milestones, tasks, timesheets, documents, activity |
| PRMS | `/prms` | Vendors, requisitions, purchase orders, assets, expenses, subscriptions, budgets, invoices |
| TMS | `/tms` | Programs, batches, students, classes, attendance, assignments, certificates, fees |
| FMS | `/fms` | Invoices, receipts, credit notes, ledger, chart of accounts, banking, reports |
| Messenger | `/messenger` | Channels, DMs, groups, project channels, announcements, meetings, WebRTC calls |
| LMS (lead management) | `/lms` | CRM, campaigns, offers, wallet controls, AI chatbot management |
| External portal | `/portal` | Role-based dashboards for students, interns, clients, businesses, hiring |
| Public links | `/pay/[token]`, `/verify/[code]` | Public invoice checkout link and certificate verification |

---

## Quick start

### Prerequisites

- Node.js **20.9 or newer** (developed on 20.x)
- npm (the repo uses `package-lock.json`)
- A MongoDB database (Atlas or local). No replica set is required.
- Optional: OpenAI, ElevenLabs and Razorpay keys for the features that use them

### Install and run

```bash
git clone <repo-url>
cd website
npm install

cp .env.example .env
# edit .env and set at least MONGODB_URI

npm run dev
```

Open <http://localhost:3000>.

### First-time data

Pick one:

```bash
# A) Just the super admin (empty system)
npm run db:seed-super-admin

# B) Full demo dataset for every panel (recommended for demos)
npm run db:reset-demo
```

Then sign in at `/admin/login` (or any panel's login) with the
[demo logins](#demo-logins).

---

## Environment variables

Copy `.env.example` to `.env`. `.env*` files are git-ignored. Only
`MONGODB_URI` is needed to boot; the rest enable specific features.

| Variable | Required | Used for |
| --- | --- | --- |
| `MONGODB_URI` | **Yes** | MongoDB connection string. The database name is the URI path |
| `OPENAI_API_KEY` | For chatbot | RAG chatbot (Responses API + file_search) |
| `OPENAI_CHATBOT_VECTOR_STORE_ID` | No | Existing vector store; auto-created on first index if unset |
| `CHATBOT_CRAWL_BASE_URL` | No | Base URL the knowledge-base crawler fetches (use `http://localhost:3000` locally) |
| `CHATBOT_ADMIN_API_SECRET` | No | Bearer secret to trigger `POST /api/admin/chatbot/reindex` from cron or CI |
| `ELEVENLABS_API_KEY` | For voice | Voice mode (speech-to-text and text-to-speech) on the Ask page |
| `LEADS_API_SECRET` | No | Bearer secret for lead/PII API endpoints and CSV exports |
| `HRMS_API_SECRET` | No | Bearer secret for HRMS API endpoints (for example the employee CSV export) |
| `HRMS_ENCRYPTION_KEY` | Before storing bank details | AES-256-GCM key for employee bank data. `openssl rand -base64 32`. Do not swap without re-encrypting rows |
| `FMS_ENCRYPTION_KEY` | Before storing bank accounts | Separate AES-256-GCM key for company bank accounts |
| `HRMS_PAYOUT_PROVIDER` | No | `manual` (default) or `razorpay` |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_ACCOUNT_NUMBER`, `RAZORPAY_WEBHOOK_SECRET` | If provider is `razorpay` | RazorpayX payouts |
| `INDEXING_API_SECRET` | No | Bearer secret for the Google Indexing notification endpoint |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | No | Search Console verification token (public) |
| `MESSENGER_TURN_URL`, `MESSENGER_TURN_USERNAME`, `MESSENGER_TURN_CREDENTIAL` | No | TURN relay for calls across arbitrary networks (STUN is the default) |
| `MESSENGER_CALL_MAX` | No | Max participants in a mesh call (default 12) |
| `CRON_SECRET` or `WALLET_CRON_SECRET` | For wallet cron | Bearer secret protecting `/api/wallet/expiry-sweep` |

Never commit secrets. Treat encryption keys as permanent once data is written.

---

## NPM scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server on port 3000 |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run create-lms` | Create an LMS (lead management) admin account |
| `npm run index-kb` | Crawl the site and index the AI chatbot knowledge base |
| `npm run db:truncate` | **Delete all data** in the configured database |
| `npm run db:seed-super-admin` | Create the super admin account |
| `npm run db:seed-all-panels` | Base data for all panels (admin users and basic records) |
| `npm run db:seed-demo-portal` | Large demo dataset layer (see below) |
| `npm run db:seed-demo` | Base seed then demo layer (no truncate) |
| `npm run db:reset-demo` | Truncate, base seed, then demo layer |
| `npm run db:seed-wallet-rules` | Seed the default wallet reward rules only |

All `db:*` and script commands load `.env` through `node --env-file=.env`.

---

## Database and demo data

### One-command reset (recommended)

```bash
npm run db:reset-demo
```

### Step by step

```bash
npm run db:truncate           # deletes all data
npm run db:seed-all-panels    # base data
npm run db:seed-demo-portal   # large demo layer
```

> **Warning:** `db:truncate` and `db:reset-demo` wipe the database named in
> `MONGODB_URI`. Never run them against a real or production database.

### Seed into a separate database (safe testing)

The demo layer supports an override so your main database stays untouched:

```bash
SEED_DB=demo_seedtest node --env-file=.env scripts/seed-demo-portal.mjs
```

(This applies to the demo layer only. Truncate and base seed always use the
database in `MONGODB_URI`. To run everything against another database, point
`MONGODB_URI` at it.)

### What the demo layer creates

Scripts live in `scripts/demo/` and run from `scripts/seed-demo-portal.mjs`.
They use a deterministic random generator, so results are repeatable, and all
demo records use `demo-` ids (or a `_demo: true` flag), so re-running replaces
the previous demo data instead of duplicating it.

| Module | Data |
| --- | --- |
| TMS | Programs, batches, about 130 students, classes, attendance, assignments, submissions, certificates, fee plans, placements |
| PMS | 24 clients, 72 projects, milestones, documents, tasks, team members, timesheets, task comments, activity timelines |
| FMS | Invoices, receipts, credit notes, chart of accounts, bank and cash accounts, ledger transactions, audit trails |
| PRMS | Vendors, requisitions, purchase orders, assets, expenses, subscriptions, infrastructure, budgets, vendor invoices, payments |
| HRMS | 150 employees, departments, designations, teams, leave types/balances/requests, payroll runs and payslips |
| Portal and leads | External users of every type, leads, timelines, messages, documents, applications, interviews, offers |
| Offers and wallet | Campaigns, offers, coupons, claims, analytics events, reward and usage rules, referral network, wallet ledger, streaks |
| Messenger | Project, group and team channels, DMs, announcements, meetings, shared files |
| Chatbot | Sessions, messages, voice conversations |
| LMS marketing | Campaign import history |

Known gap: the LMS chatbot **Knowledge Base** page stays empty until you upload
or index documents (`npm run index-kb`, needs `OPENAI_API_KEY`).

### FMS side effect to know about

The FMS dashboard calls `src/lib/fms/seed-realistic-data.ts` on load, which
writes fixed sample finance records into whatever database is connected. That is
fine for demo databases; do not point a real production database at this build
without removing that call.

---

## Demo logins

After `npm run db:reset-demo`:

| Account | Email | Password |
| --- | --- | --- |
| Super admin (all panels) | `admin@example.com` | `Admin#2026pw` |
| Student portal | `demo.student@example.com` | `Demo@12345` |
| Intern portal | `demo.intern@example.com` | `Demo@12345` |
| Client portal | `demo.client@example.com` | `Demo@12345` |
| Business portal | `demo.business@example.com` | `Demo@12345` |
| Hiring portal | `demo.hiring@example.com` | `Demo@12345` |

Login URLs: `/admin/login`, `/hrms/login`, `/pms/login`, `/prms/login`,
`/tms/login`, `/fms/login`, `/messenger/login`, `/lms/login`,
`/workspace/login`, and `/portal/login` (or the public `/login`) for the portal.

These are demo credentials. Change them, or do not seed, in any shared or
production environment.

---

## Project structure

```
src/
  app/
    (site)/            Public website, /register, /login, /rewards, /blog, /careers, /offers
    admin/ hrms/ pms/ prms/ tms/ fms/ lms/ messenger/ workspace/
    portal/            External user portal (app, register, join)
    api/               Route handlers (intake, wallet, messenger, chatbot, cron)
    pay/ verify/       Public invoice checkout and certificate verification
  components/          UI by area (portal, offers, lms, messenger, pms, prms, ...)
  lib/                 Server logic by module
    wallet/            Wallet, ledger, referrals, campaigns, usage rules, reversals, expiry
    portal/            Portal data, dashboards, notifications, registration
    lead-management/   Lead provisioning and workflows
    offers/            Offers, coupons, claims
    hrms/ pms/ prms/ tms/ fms/ messenger/   Panel data layers
  proxy.ts             Request proxy (Next 16 replacement for middleware), referral capture
scripts/
  seed-*.mjs, truncate-all-data.mjs, create-lms.mjs, index-knowledge-base.mjs
  demo/                Demo data modules (tms, pms, people, growth, panels, messenger,
                       chatbot, procurement, prms-ops, marketing)
public/                Static assets
uploads/               Local file storage for documents and attachments (git-ignored data)
vercel.json            Cron schedule
PANELS.md              Product overview of every panel
AGENTS.md / CLAUDE.md  Instructions for AI coding agents
```

---

## Architecture notes

- **Identity:** internal users are `admin_users` with a `roles` array; external
  people are `external_users` with one of four roles (`job_applicant`,
  `intern`, `trainee`, `client`). Portal dashboards (Student, Intern, Client,
  Business, Hiring) are generated from the role plus the lead category.
  Sessions are separate cookies per panel.
- **IDs and audit fields:** documents use string ids and shared audit fields
  (`createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `deletedAt` for soft
  delete). Several pages assume these exist.
- **No multi-document transactions.** Atomicity comes from single-document
  `findOneAndUpdate` with guard filters, plus an idempotency-lock collection
  for the wallet.
- **Server/client split:** files that import `server-only` must not be imported
  by client components. Shared constants live in client-safe files
  (for example `src/lib/wallet/constants.ts`).
- **Realtime:** Messenger uses Server-Sent Events over a `chat_events` log, and
  WebRTC (mesh) for calls with signaling over SSE.
- **Design system:** plain glass cards, centered `max-w-*` page wrappers, no
  custom per-page hover shadows. Match the existing panels when adding UI.
- **Brand wordmark:** use `brandify()` from `src/lib/brand.tsx` so the brand name
  renders with its first part in the normal colour and its second in the accent colour.

---

## Wallet, credits and referrals

A centralized wallet gives every portal user credits that can be earned and spent.

- **Earning:** signup bonus, referral rewards (referrer and referee), daily
  visit streaks, stage-completion and activity rewards, admin adjustments.
  Rules are editable in LMS (`/lms/wallet`) with no redeploy.
- **Referral flow:** share `/register?ref=CODE`; the code is captured
  first-touch, attributed at account creation, and rewarded once, with
  fraud checks (self-referral, shared IP, shared device, velocity).
- **Spending:** credits apply to festival offers, TMS fees and FMS invoices,
  governed by usage rules per module and user role.
- **Ledger:** immutable `wallet_transactions` with before/after balances, FIFO
  lot expiry, reversals and refunds. Wallet balances are buckets
  (available, pending, locked, lifetime totals).
- **Expiry cron:** `vercel.json` schedules `/api/wallet/expiry-sweep` daily at
  02:30 UTC. Protect it with `CRON_SECRET` or `WALLET_CRON_SECRET`.
- **Portal pages:** `/portal/wallet`, `/portal/referrals`, `/portal/rewards/*`.
  **LMS pages:** `/lms/wallet/*` (rules, usage rules, campaigns, referrals,
  wallets, ledger, users).

---

## AI chatbot and knowledge base

- Public "Ask SelfRun Business" assistant using the OpenAI Responses API with hosted
  vector-store file search. Optional voice mode via ElevenLabs.
- Index the site into the vector store:

  ```bash
  CHATBOT_CRAWL_BASE_URL=http://localhost:3000 npm run index-kb
  ```

- Manage configuration, documents, sessions and analytics under `/lms/chatbot`.
- Without `OPENAI_API_KEY` the chatbot is disabled; the rest of the app is unaffected.

---

## Build, verify and deploy

### Verify before shipping

```bash
npm run lint
npm run build
echo $?        # must print 0
```

`tsc --noEmit` alone is not a reliable gate in this repo. Always check the exit
code of a real `next build`, and do not run other heavy tasks while it runs
(a concurrent run can fail with a missing `.next/server/*manifest` error).

### Deploy on Vercel

1. Import the repository into Vercel.
2. Set the environment variables from the table above (at minimum `MONGODB_URI`;
   add `CRON_SECRET` for the wallet expiry cron).
3. Deploy. Cron jobs from `vercel.json` register automatically.
4. Use MongoDB Atlas with the deployment's IPs allow-listed.
5. Local file uploads under `uploads/` are not persistent on serverless hosting.
   Use a persistent storage layer before relying on uploads in production.

### Self-hosting

```bash
npm run build
npm start          # serves on port 3000; use PORT to change
```

Run a scheduler that calls `/api/wallet/expiry-sweep` daily with the cron bearer secret.

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Pages crash after seeding with "cannot read properties of undefined" | Old base-seed documents with a different shape. Run `npm run db:reset-demo` for a clean, consistent dataset |
| Login works but a panel shows no data | You seeded only the base layer. Run `npm run db:seed-demo-portal` |
| Messenger "Project Channels" empty for admin | Project channels sync from PMS teams by employee link. Re-run the demo seeder, which links the admin account to a demo employee |
| Chatbot says it is unavailable | Set `OPENAI_API_KEY` and run `npm run index-kb` |
| Voice mode missing | Set `ELEVENLABS_API_KEY` and enable it in LMS, Chatbot, Conversation AI |
| Bank details cannot be saved | Set `HRMS_ENCRYPTION_KEY` / `FMS_ENCRYPTION_KEY` |
| Calls connect only on the same network | Add a TURN server via the `MESSENGER_TURN_*` variables |
| Build fails with `pages-manifest.json` ENOENT | Another process touched `.next` during the build. Stop other tasks and rebuild |
| `db:*` script cannot connect | Check `MONGODB_URI` in `.env` and your Atlas IP allow-list |

---

## Contributing notes

- Read [AGENTS.md](./AGENTS.md): this Next.js version has breaking changes, so
  check `node_modules/next/dist/docs/` before writing framework code.
- Match the surrounding code: naming, comment density and UI patterns.
- Keep new panel UI inside the shared design system.
- When you add a module that shows data, add its records to `scripts/demo/` so
  demos never show blank sections.
- Commit only source and docs. Never commit `.env` or uploaded files.



==========================================================================
✨ Done. Portal demo logins (password for all: Demo@12345) — sign in at /login
==========================================================================
  • Student (industrial training)      demo.student@example.com
  • Intern                             demo.intern@example.com
  • Client                             demo.client@example.com
  • Business (hiring + services)       demo.business@example.com
  • Hiring (job applicant)             demo.hiring@example.com


Needed in Vercel before going live

SMMS_ENCRYPTION_KEY (your local .env already has one).
CRON_SECRET.
For publishing: META_APP_ID/META_APP_SECRET, GOOGLE_OAUTH_CLIENT_ID/GOOGLE_OAUTH_CLIENT_SECRET, LINKEDIN_CLIENT_ID/LINKEDIN_CLIENT_SECRET.
For demo data, run npm run db:seed-smms. It creates the logins demo.smms.{admin,manager,specialist,employee}@example.com (password Demo@12345). Testing used a scratch database, which I dropped afterwards.

# demo (the database in .env)
npm run db:migrate-cms-content                 # dry run: prints the database name and what it will create
npm run db:migrate-cms-content -- --apply

# platform: same cluster connection string, database name changed
MONGODB_URI="mongodb+srv://…/platform?…" npm run db:migrate-cms-content -- --apply


npm run db:migrate-cms-content -- --apply


Before you push or deploy
Migrate the production database: npm run db:migrate-tenancy -- --apply against platform.
Add PLATFORM_ENCRYPTION_KEY, RAZORPAY_BILLING_WEBHOOK_SECRET and CRON_SECRET to Vercel.
After deploy, run scripts/backfill-subscription-events.ts so revenue analytics aren't empty. It is a dry run unless you pass --apply.
Enter your Razorpay test keys in Platform Panel → Payments & Razorpay


npm run db:migrate-cms-content
npm run db:migrate-cms-content -- --apply
npm run db:add-products-nav
npm run db:add-products-nav -- --apply


npm run db:migrate-cms-content          # naya product aur uske text keys banata hai
npm run db:migrate-cms-content -- --apply
npm run db:add-products-nav             # Products menu me naya item
npm run db:add-products-nav -- --apply
npm run db:revert-services-nav          # sirf agar aapne pehle db:update-services-nav live par chalayi thi
npm run db:revert-services-nav -- --apply

npm run db:migrate-cms-content
npm run db:add-products-nav
npm run db:revert-services-nav     # sirf agar aapne pehle db:update-services-nav live par chalayi thi
