# Platform (multi-tenant SaaS layer)

Everything that makes this app a SaaS platform — rather than one company's
tools — lives here. Its provider-side pages are in `src/app/(platform)/`
(`/signup`, `/platform/*`, `/api/platform/*`; the brackets make that a Next.js route
group: it organises files without changing URLs). Everything that belongs to ONE
company — its settings, billing, onboarding, upgrade page, audit log — is part of the
Workspace under `src/app/workspace/(protected)/` and lives at `/workspace/*`.

The 18 business panels (HRMS, PMS, FMS …) stay in their own folders and are
unaware of this layer beyond calling `getDb()`, which is company-scoped.

## Layout

| Path | What it does |
|---|---|
| `tenancy/` | Company registry, host → company routing, the company-scoped DB layer, per-company caching, provisioning a new company |
| `website/` | Neutral starter website published for every new company (Home, Services, About, Contact, Privacy) |
| `branding/` | Company logo, wordmark and colour (`getCompanyBrand`, `BrandProvider`, branded titles, logo uploads). UI in `src/app/workspace/(protected)/settings/branding` |
| `onboarding/` | Setup wizard catalog (industries, department templates, role presets, panels) and progress (`state.ts`). `gate.ts` = the pure redirect rule: a customer company's Super Admin whose setup is neither completed nor skipped is sent from `/workspace` (only) to `/workspace/onboarding`; nobody else. The wizard lives at `/workspace/onboarding` |
| `signup.ts` | Self-serve sign-up (one simple form, no setup steps): open mode creates the company immediately (no email gate; owner `emailVerified: false`), approval mode stores the request for a platform admin, hand-off sign-in (`next: "/workspace"`, where onboarding takes over), the approval queue (approve/reject; the approval e-mail links to `/workspace/login`) |
| `console/` | Platform Panel back end (cross-company, raw DB): company list/detail, suspend/reactivate, platform KPIs. `access.ts` = guards (`requirePlatformPermission`, `checkPlatformPermission`, `can`); `permissions.ts` = permission catalogue + route→permission map (client-safe); `roles.ts` = platform roles (`platform_roles`) and platform users (`platformRoleId` on the owner company's `admin_users`); `audit-log.ts` = audit log queries/CSV. UI in `src/app/(platform)/platform` |
| `email-verification.ts` (+ `-rule.ts`, client-safe) | Verifying a user's email without ever blocking anything: `admin_users.emailVerified` (missing = verified), company-scoped single-use 24h hashed tokens in `email_verifications`, 3 sends/user/hour, `/workspace/verify-email` (button consumes, not the GET), the Workspace "Verify email" strip (`components/workspace/VerifyEmailBanner.tsx`) |
| `invitations.ts` | Team invitations and acceptance (creates HRMS employee + login) |
| `settings.ts` | Platform-wide settings (sign-up mode) |
| `email/` | Outgoing email behind a swappable provider (`EMAIL_PROVIDER`: Resend, console) |
| `domains/` | Hostname attach/verify/SSL behind a swappable provider (`DOMAIN_PROVIDER`: Vercel, manual) |
| `domains/custom.ts` | A company's own domains: add, TXT ownership check, primary, remove, daily re-check (UI in `src/app/workspace/(protected)/settings/domains`, cron `/api/platform/domains/cron`) |
| `billing/` | Plans, subscriptions, entitlements (`getEntitlements()` — what the current company may use), usage metering, SaaS invoices. Contract in `billing/types.ts` |
| `billing/invoices.ts`, `billing/gst.ts` | SaaS GST tax invoices + credit notes. `issueSaasInvoice({companyId, quote|lines, period, paymentRef, paidAt})` (idempotent on `paymentRef`), `issueSaasCreditNote` (idempotent on `refundRef`), mark paid / void. `{prefix}/26-27/00001` and `CN/26-27/00001` numbering (≤16 characters, GST rule 46); seller, GST rate, SAC, prefix, texts all from `getBillingSettings()`. `gst.ts`: pure tax maths (CGST+SGST / IGST, rounding) and the one GSTIN validator. PDF `src/components/platform/billing/SaasInvoicePdf.tsx` via `/api/platform/billing/invoices/[id]/pdf` (tenant-isolated); UI `/platform/invoices`, company-side `/workspace/settings/billing/invoices` |
| `billing/plans.ts`, `billing/pricing.ts` | Plans catalogue management (billing cycles, price versions, panels, flags, highlights, limits; one default; reorder/activate/delete) — UI `src/app/(platform)/platform/plans`. `pricing.ts` reads prices (`planPrice`, `planPriceAtVersion`, `resolveTrialDays`) |
| `billing/trials.ts`, `billing/lifecycle.ts` | Free-trial lifecycle: reminders at the platform's reminder days, expiry → grace (grace days) → read-only, extend trial (company page). Cron `/api/platform/billing/trials/cron`; banner `src/components/platform/TrialBanner.tsx` |
| `billing/` | Plans, subscriptions, entitlements (`getEntitlements()` — what the current company may use), usage metering, SaaS invoices. Contract in `billing/types.ts`. Razorpay subscriptions: `subscriptions.ts` (checkout, webhook, dunning), `subscriptions-admin.ts` (Platform Panel actions), `razorpay.ts` + `razorpay-config.ts` (keys saved encrypted in the panel); webhook `/api/platform/billing/webhook`, daily cron `/api/platform/billing/subscriptions/cron` |
| `billing/metrics.ts`, `billing/events.ts`, `billing/backfill.ts` | Platform revenue & subscription analytics (MRR, ARR, ARPA, net new MRR, churn, trial conversion, plan/cycle mix, billed vs collected, GST) for `/platform/revenue` and the `/platform` dashboard cards; `backfill.ts` + `scripts/backfill-subscription-events.ts` seed history for companies that predate events; append-only `subscription_events` history — subscription/trial code calls `recordSubscriptionEvent()` after every status or plan change |
| `request.ts` | Request origin / client key helpers |
| `events/` | Company event bus. `emitEvent(type, { entity, actorId, data })` writes one row to the company's `platform_events` (kept 180 days) and runs matching workflows after the response; it never throws. `catalog.ts` = the typed event catalogue (label, fields, sample), client-safe. Emitted from the panels' own lib functions: `lead.created` / `lead.status_changed` (`lead-management/records.ts`), `client.created`, `project.created`, `task.created` / `task.completed` (`pms/`), `invoice.created` / `invoice.paid` (`fms/invoices.ts`), `employee.created`, `leave.requested` (`hrms/`). Also the company audit trail: `listEvents()` — UI Company → Audit log, source "Workspace events" (`/workspace/settings/audit-log`) |
| `workflows/` | Automations: trigger (event type) → conditions (all must match: eq, neq, contains, gt, lt) → up to 5 actions (email, in-app notification, signed webhook). `shared.ts` = shapes, validation, `{{field}}` templating (client-safe); `index.ts` = CRUD on `workflows` + `workflow_runs` (90 days), 50 per company; `run.ts` = execution, run log, "Send test", loop guard; `webhook.ts` = https-only delivery with SSRF blocking (public addresses only, pinned DNS, no redirects, 5 s) and `X-Webhook-Signature: t=…,v1=HMAC-SHA256(secret, "t.body")`; `templates.ts` = the four ready-made automations. UI `/workspace/settings/automations` |
| `notifications/` | Cross-panel in-app notifications (`platform_notifications`, per user, 90 days): `notify({ to: { userId } \| { role }, title, body, url })`, list / unread count / mark read. Shown by the Staff Hub bell and `/workspace/notifications`. The panels' own bells are separate and untouched |
| `access.ts` | `accessibleAreas(user)` — which cross-panel areas (leads, clients, projects, tasks, invoices, employees, leave) a person may see company-wide: panel in the plan, switched on, and the role tier each panel uses for its own "see everything" views. The one rule behind KPIs, search, recent activity and the AI assistant |
| `dashboard.ts` | "Your company today" on the dashboard (`/workspace`): `getCompanyKpis(user)` (open leads, active projects, tasks due this week, unpaid invoices, employees, pending leave — reusing each panel's count helpers, each failing soft) and `getRecentActivity(user)`. UI `src/components/platform/hub/CompanyToday.tsx` |
| `search/` | Global search for the Cmd/Ctrl+K palette: `globalSearch(user, query)` — escaped case-insensitive match on leads, clients, projects, tasks, employees, invoices, 5 per type, in parallel, straight against the panels' collections (no index). UI `src/components/platform/hub/HubSearch.tsx` |
| `../intelligence/` (+ `src/app/intelligence`, `/api/intelligence/chat`) | AI Intelligence (AI Data Analyst panel). `catalog/registry.ts` = the declarative, company-independent entity registry (14 entities: collection, fields with types/enums/money units, many-to-one relations, access grants; one entry per new entity); `catalog/access.ts` = who may read what (built on `access.ts` + the PRMS role helpers; never looser than the owning panel: projects, project members and tasks need PMS `canViewAllProjects`, timesheets `canReviewTimesheets`, so a `pms_manager` gets only clients; sensitive fields are never offered); `catalog/view.ts` = the per-request view (plan + enabled panels + this user's grants + cached live stats). `query/` = the structured plan, validator and the translator to a fixed-shape, allowlisted, read-only aggregation (10 s limit, 500 rows). `engine.ts` = the tool loop on the metered `getOpenAI()`; `answer.ts` = builds the answer blocks from REAL results (the model only names a queryId and columns); `conversations.ts` = per-user history + the hourly rate limit; `turn.ts` = preflight, answer, store, audit (`intelligence.question`). Panel access (`intelligence_admin` / `intelligence_user`) decides only who may open the panel — never what data a question may touch |
| `ai/assistant.ts` | "Ask about your business": `askBusiness(user, question)` through the metered `getOpenAI()` with three read-only tools (KPIs, search, recent activity) that run with the asking user's permissions. No history, no write tools; tool results are treated as untrusted data |
| `import/` | CSV import for leads, clients and employees (≤ 1,000 rows, 2 MB): `shared.ts` = field definitions, CSV parser, header auto-mapping, sample files (client-safe); `index.ts` = `previewImport()` (dry run: valid rows, row errors, duplicates by email/phone) and `runImport()`, which creates rows through each panel's own validator and create function. Employee invitations are opt-in and limited by the plan's seats. UI `/workspace/settings/import` (`/workspace/settings/import/run`, `/workspace/settings/import/sample`) |
| `integrations/` | Platform-level provider configuration (email, domains, payments). Company-facing integrations are outbound webhooks only — a workflow action (see `workflows/webhook.ts`) |

## The company side: Workspace

A company signs in once, at `/workspace/login`, and reaches everything from the
Workspace: its panels, analytics, the management registers (formerly a separate
admin panel), its own settings and billing. See `src/lib/workspace/`
(`nav.ts` = the one navigation and its access rules, `access.ts` = the guards
for pages, actions and APIs, `notifications.ts` = the one notification feed)
and `src/lib/workspace-session.ts` (the Workspace session every panel accepts).
The Platform Panel is separate and appears in the Workspace only as one link
for people the platform's own access check accepts.

## Rules

- Platform-level collections (shared by all companies) are listed in
  `tenancy/collections.ts` → `GLOBAL_COLLECTIONS` and read via `getPlatformDb()`.
  Everything else is company-scoped by default.
- Provider credentials (Resend, Vercel, …) are server-side env vars only.
- Anything that links to "this company's website" (sitemap, robots, canonical /
  Open Graph URLs, JSON-LD, SEO crawler, certificate verification, payment
  links) uses `companySiteUrl()` from `tenancy/site-url.ts`, never `siteUrl`
  from `src/lib/seo.ts` (that constant is the platform owner's own origin).
