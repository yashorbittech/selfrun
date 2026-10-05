# Workspace audit

Scope: make the existing **Workspace** (`/workspace`) the company-level root. One
company = its users, roles, panels, features, its own subscription and data.
The **Platform Panel** (`/platform/*`) stays separate and is not touched,
except for one conditional link.

Legend for "Verified": `test: <name>` = a check in `scripts/test-workspace-access.ts`
that was run; `e2e` = covered by `scripts/e2e/workspace.e2e.mjs` (written, **not run
by the author**); `code read` = checked by reading the code only.

---

## 1. Inventory

### 1.1 Identity and sessions

| Thing | Where | Notes |
|---|---|---|
| Identity store | `admin_users` (company-scoped through `getDb()`) | `roles: string[]`, `permissionOverrides: Record<string, boolean>` |
| Workspace session | `src/lib/hub-auth.ts`, cookie `hub_session`, collection `hub_sessions` | No role gate: any account of the company can sign in |
| Admin session | removed (`src/lib/admin-auth.ts` deleted) | The Workspace session is the only company sign-in; see 2.3 |
| Single sign-on | `src/lib/cross-module-sso.ts` | Signing in to any panel mints a session in every panel the roles allow; sign-out destroys all of them, on every device |
| Role catalog | `src/lib/workspace/role-catalog.ts` (built from each panel's `*-roles.ts`) | Assigned at `/workspace/users` |
| Permission catalog | `src/lib/workspace/permission-catalog.ts`, resolved by `src/lib/permission-overrides.ts` | Per-user overrides of single capabilities; `super_admin` always passes |
| Plan / modules | `src/lib/platform/billing/entitlements.ts` (`getEntitlements`), `onboarding/state.ts` (`enabledModules`) | Panel in plan + switched on |
| Company-wide data tier | `src/lib/platform/access.ts` (`accessibleAreas`) | Behind KPIs, search, recent activity, AI assistant |
| Tenant isolation | `getDb()` (company-scoped), `getPlatformDb()` (cross-company) | See findings F9 |

### 1.2 Workspace routes

| Route | What it does | Server-side check | Actions / APIs and their authorization |
|---|---|---|---|
| `/workspace/login` | Sign-in form | none (public); redirects when already signed in | `hubLoginAction`: `verifyHubCredentials` (lockout after 5 failures), then `provisionAccessibleSessions` |
| `/workspace/change-password` | Change own password | `getCurrentHubUser()` | `changeOwnHubPassword` on the signed-in user's own id |
| `/workspace` (Dashboard) | The one dashboard: executive overview (Command Center permission), company strip, panel tiles, personal HR/PMS sections | layout + page: `getCurrentHubUser()`; layout also forces a pending password change | `hub-actions.ts` (search, ask, notifications): each calls `getCurrentHubUser()`; data filtered by `accessibleAreas(user)` |
| `/workspace/analytics/[panel]` | Read-only analytics per panel (fms, hrms, lms, messenger, pms, portal, prms, tms, workspace) | `getCurrentHubUser()` + a per-panel role check **in the page** | loaders in `src/lib/workspace/panel-analytics.ts`, no own check (called only from this page and `/admin/analytics`) |
| `/workspace/notifications` | Own notifications | `getCurrentHubUser()` | `listNotifications(user.id)` — own rows only |
| `/workspace/invite`, `/workspace/handoff` | Accept invitation, post-sign-up hand-off | token based | unchanged, out of scope |

### 1.3 The former admin panel (`/admin`, "Command Center") — as it was before the move

35 pages under `src/app/admin/(protected)/`, 33 export/download routes under `/api/admin/**`, its own sign-in (`/admin/login`), session (`admin_session`) and shell (`src/components/admin`). Everything was `super_admin` only. All of it now lives in the Workspace — see 2.1 for the page-by-page table and 2.3 for sign-in.

### 1.4 Company settings routes

All pages check `getCurrentHubUser()` + `roles.includes("super_admin")` in the
page itself; every server action file has a `requireOwner()` with the same two
checks; the two import route handlers repeat it and answer 401/403.

| Route | What it does | Actions / APIs |
|---|---|---|
| `/workspace/settings` | Hub of cards | none |
| `/workspace/onboarding` | Setup wizard: profile, departments, invitations, branding, panels | `onboarding/actions.ts` (`requireOwner`) |
| `/workspace/settings/branding` | Logo, name, colour | `branding/actions.ts` |
| `/workspace/settings/domains` | Workspace address, custom domains | `domains/actions.ts`; lib filters every query by `companyId` |
| `/workspace/settings/billing` | Plan, checkout, change plan, cancel / resume, coupon, GST details | `billing/actions.ts` (company id from the host, never from input) |
| `/workspace/settings/billing/invoices` | SaaS invoices and credit notes | `listCompanySaasInvoices(companyId)`; PDF at `/api/platform/billing/invoices/[id]/pdf` (see F5) |
| `/workspace/settings/payments` | The company's own Razorpay account | `payments/actions.ts` |
| `/workspace/settings/automations` | Event → email / notification / webhook | `automations/actions.ts` |
| `/workspace/settings/import` | CSV import | `import/run`, `import/sample` route handlers |
| `/workspace/settings/audit-log` | The one Audit log: workspace events (`listEvents()`, Super Admin only) and panel activity (`searchActivityLog()`, Audit log permission) behind a source switch | `requireWorkspaceAccess("company.audit")`; each source re-checked on the page (`canViewAuditLog`, `canViewWorkspaceEvents`) | `/api/workspace/activity-log/export` → `authorizeWorkspaceApi("company.audit")` |
| `/workspace/upgrade` | "This panel is not in your plan" | the Workspace layout (signed in, password change first); see F8 | none |

### 1.5 Scoping that exists today (department / team / data)

- **Company**: every collection read through `getDb()` is filtered to the company of the request host.
- **Panel role tier**: each panel decides its own "see everything" tier; `accessibleAreas()` reuses those tiers for cross-panel data.
- **Own data**: HR and Project analytics in Workspace pass `restrictToEmployeeId`; notifications, SOP assignments, AI chats, tests on the Staff Hub are filtered to the signed-in user.
- **Department / team scoping in Workspace or `/admin`: does not exist.** `/admin` is all-or-nothing (`super_admin`). Panels that have manager/team rules (HRMS, PMS) apply them inside the panel. Nothing was added here.

---

## 2. Mapping: existing feature → Workspace

Navigation is defined once in `src/lib/workspace/nav.ts`; `resolveWorkspaceNav(user)`
(`src/lib/workspace/access.ts`) returns only what the user may open; pages call
`requireWorkspaceAccess(key)` / `checkWorkspaceAccess(user, key)` with the same key.

Permission shorthand: **SA** = `super_admin`; **role(x)** = any role of panel x;
**plan(x)** = panel x is in the company's plan and switched on.

### 2.1 Old admin feature → new Workspace location

The separate admin panel is gone. `/admin` and `/admin/*` redirect permanently to the Workspace path (`next.config.ts`), so bookmarks and stored notification links keep working.

Management permissions live in the permission catalog (`src/lib/workspace/permission-catalog.ts`, group "Workspace management"). `super_admin` holds all of them; nobody else by default; a Super Admin can grant single ones to a person at Users & roles → permission overrides. "plan(x)" = panel x in the plan and switched on (closes F12).

| Old admin feature | New Workspace location | Permission | API authorization | UI access | Verified |
|---|---|---|---|---|---|
| Command Center `/admin` | the dashboard `/workspace` (executive sections; **no separate page or nav item**) | `workspace.viewCommandCenter` | `loadExecutiveOverview()` returns `null` for anyone without it, so the data is never loaded or rendered for them; `/workspace/command-center` redirects to `/workspace` | none (`canViewCommandCenter(user)` in `nav.ts`) | test: "the merged dashboard loader returns executive data only to the Command Center permission" |
| Audit log `/admin/activity-log` | Company → Audit log `/workspace/settings/audit-log` (source "Panel activity"; merged with the old Company activity log) | `workspace.viewAuditLog` | `/api/workspace/activity-log/export` → `authorizeWorkspaceApi("company.audit")` | Company → nav key `company.audit` | test: "Audit log: panel activity needs the Audit log permission…" |
| Documents `/admin/documents` | Account → Documents `/workspace/account/documents` | `workspace.manageDocuments` | `requireWorkspaceAction("account.documents")` in every action; `/api/workspace/documents/export` → `authorizeWorkspaceApi("account.documents")` | Account → nav key `account.documents` | test: "every moved page calls requireWorkspaceAccess with the key of its own path" |
| CRM leads `/admin/crm/leads` | `/workspace/crm/leads` | `workspace.manageCrm` + plan(lms) | `requireWorkspaceAction("manage.crm.leads")` in every action; `/api/workspace/crm/leads/export` → `authorizeWorkspaceApi("manage.crm.leads")` (was `/api/admin/crm/leads/export`) | Management → nav key `manage.crm.leads` | test: "every moved page calls requireWorkspaceAccess…", "every server action…", "every /api/workspace route…", "each moved page key per role…"; e2e |
| CRM clients `/admin/crm/clients` | `/workspace/crm/clients` | `workspace.manageCrm` + plan(pms) | `requireWorkspaceAction("manage.crm.clients")` in every action; `/api/workspace/crm/clients/export` → `authorizeWorkspaceApi("manage.crm.clients")` (was `/api/admin/crm/clients/export`) | Management → nav key `manage.crm.clients` | test: "every moved page calls requireWorkspaceAccess…", "every server action…", "every /api/workspace route…", "each moved page key per role…"; e2e |
| PMS projects `/admin/pms/projects` | `/workspace/pms/projects` | `workspace.manageProjects` + plan(pms) | `requireWorkspaceAction("manage.pms.projects")` in every action; `/api/workspace/pms/projects/export` → `authorizeWorkspaceApi("manage.pms.projects")` (was `/api/admin/pms/projects/export`) | Management → nav key `manage.pms.projects` | test: "every moved page calls requireWorkspaceAccess…", "every server action…", "every /api/workspace route…", "each moved page key per role…"; e2e |
| PMS tasks `/admin/pms/tasks` | `/workspace/pms/tasks` | `workspace.manageProjects` + plan(pms) | `requireWorkspaceAction("manage.pms.tasks")` in every action; `/api/workspace/pms/tasks/export` → `authorizeWorkspaceApi("manage.pms.tasks")` (was `/api/admin/pms/tasks/export`) | Management → nav key `manage.pms.tasks` | test: "every moved page calls requireWorkspaceAccess…", "every server action…", "every /api/workspace route…", "each moved page key per role…"; e2e |
| PMS milestones `/admin/pms/milestones` | `/workspace/pms/milestones` | `workspace.manageProjects` + plan(pms) | `requireWorkspaceAction("manage.pms.milestones")` in every action; `/api/workspace/pms/milestones/export` → `authorizeWorkspaceApi("manage.pms.milestones")` (was `/api/admin/pms/milestones/export`) | Management → nav key `manage.pms.milestones` | test: "every moved page calls requireWorkspaceAccess…", "every server action…", "every /api/workspace route…", "each moved page key per role…"; e2e |
| PMS timesheets `/admin/pms/timesheets` | `/workspace/pms/timesheets` | `workspace.manageProjects` + plan(pms) | `requireWorkspaceAction("manage.pms.timesheets")` in every action; `/api/workspace/pms/timesheets/export` → `authorizeWorkspaceApi("manage.pms.timesheets")` (was `/api/admin/pms/timesheets/export`) | Management → nav key `manage.pms.timesheets` | test: "every moved page calls requireWorkspaceAccess…", "every server action…", "every /api/workspace route…", "each moved page key per role…"; e2e |
| PRMS vendors `/admin/prms/vendors` | `/workspace/prms/vendors` | `workspace.manageProcurement` + plan(prms) | `requireWorkspaceAction("manage.prms.vendors")` in every action; `/api/workspace/prms/vendors/export` → `authorizeWorkspaceApi("manage.prms.vendors")` (was `/api/admin/prms/vendors/export`) | Management → nav key `manage.prms.vendors` | test: "every moved page calls requireWorkspaceAccess…", "every server action…", "every /api/workspace route…", "each moved page key per role…"; e2e |
| PRMS requisitions `/admin/prms/requisitions` | `/workspace/prms/requisitions` | `workspace.manageProcurement` + plan(prms) | `requireWorkspaceAction("manage.prms.requisitions")` in every action; `/api/workspace/prms/requisitions/export` → `authorizeWorkspaceApi("manage.prms.requisitions")` (was `/api/admin/prms/requisitions/export`) | Management → nav key `manage.prms.requisitions` | test: "every moved page calls requireWorkspaceAccess…", "every server action…", "every /api/workspace route…", "each moved page key per role…"; e2e |
| PRMS rfqs `/admin/prms/rfqs` | `/workspace/prms/rfqs` | `workspace.manageProcurement` + plan(prms) | `requireWorkspaceAction("manage.prms.rfqs")` in every action; `/api/workspace/prms/rfqs/export` → `authorizeWorkspaceApi("manage.prms.rfqs")` (was `/api/admin/prms/rfqs/export`) | Management → nav key `manage.prms.rfqs` | test: "every moved page calls requireWorkspaceAccess…", "every server action…", "every /api/workspace route…", "each moved page key per role…"; e2e |
| PRMS purchase-orders `/admin/prms/purchase-orders` | `/workspace/prms/purchase-orders` | `workspace.manageProcurement` + plan(prms) | `requireWorkspaceAction("manage.prms.purchase-orders")` in every action; `/api/workspace/prms/purchase-orders/export` → `authorizeWorkspaceApi("manage.prms.purchase-orders")` (was `/api/admin/prms/purchase-orders/export`) | Management → nav key `manage.prms.purchase-orders` | test: "every moved page calls requireWorkspaceAccess…", "every server action…", "every /api/workspace route…", "each moved page key per role…"; e2e |
| PRMS invoices `/admin/prms/invoices` | `/workspace/prms/invoices` | `workspace.manageProcurement` + plan(prms) | `requireWorkspaceAction("manage.prms.invoices")` in every action; `/api/workspace/prms/invoices/export` → `authorizeWorkspaceApi("manage.prms.invoices")` (was `/api/admin/prms/invoices/export`) | Management → nav key `manage.prms.invoices` | test: "every moved page calls requireWorkspaceAccess…", "every server action…", "every /api/workspace route…", "each moved page key per role…"; e2e |
| PRMS payments `/admin/prms/payments` | `/workspace/prms/payments` | `workspace.manageProcurement` + plan(prms) | `requireWorkspaceAction("manage.prms.payments")` in every action; `/api/workspace/prms/payments/export` → `authorizeWorkspaceApi("manage.prms.payments")` (was `/api/admin/prms/payments/export`) | Management → nav key `manage.prms.payments` | test: "every moved page calls requireWorkspaceAccess…", "every server action…", "every /api/workspace route…", "each moved page key per role…"; e2e |
| PRMS expenses `/admin/prms/expenses` | `/workspace/prms/expenses` | `workspace.manageProcurement` + plan(prms) | `requireWorkspaceAction("manage.prms.expenses")` in every action; `/api/workspace/prms/expenses/export` → `authorizeWorkspaceApi("manage.prms.expenses")` (was `/api/admin/prms/expenses/export`) | Management → nav key `manage.prms.expenses` | test: "every moved page calls requireWorkspaceAccess…", "every server action…", "every /api/workspace route…", "each moved page key per role…"; e2e |
| PRMS assets `/admin/prms/assets` | `/workspace/prms/assets` | `workspace.manageProcurement` + plan(prms) | `requireWorkspaceAction("manage.prms.assets")` in every action; `/api/workspace/prms/assets/export` → `authorizeWorkspaceApi("manage.prms.assets")` (was `/api/admin/prms/assets/export`) | Management → nav key `manage.prms.assets` | test: "every moved page calls requireWorkspaceAccess…", "every server action…", "every /api/workspace route…", "each moved page key per role…"; e2e |
| PRMS inventory `/admin/prms/inventory` | `/workspace/prms/inventory` | `workspace.manageProcurement` + plan(prms) | `requireWorkspaceAction("manage.prms.inventory")` in every action; `/api/workspace/prms/inventory/export` → `authorizeWorkspaceApi("manage.prms.inventory")` (was `/api/admin/prms/inventory/export`) | Management → nav key `manage.prms.inventory` | test: "every moved page calls requireWorkspaceAccess…", "every server action…", "every /api/workspace route…", "each moved page key per role…"; e2e |
| PRMS infrastructure `/admin/prms/infrastructure` | `/workspace/prms/infrastructure` | `workspace.manageProcurement` + plan(prms) | `requireWorkspaceAction("manage.prms.infrastructure")` in every action; `/api/workspace/prms/infrastructure/export` → `authorizeWorkspaceApi("manage.prms.infrastructure")` (was `/api/admin/prms/infrastructure/export`) | Management → nav key `manage.prms.infrastructure` | test: "every moved page calls requireWorkspaceAccess…", "every server action…", "every /api/workspace route…", "each moved page key per role…"; e2e |
| PRMS subscriptions `/admin/prms/subscriptions` | `/workspace/prms/subscriptions` | `workspace.manageProcurement` + plan(prms) | `requireWorkspaceAction("manage.prms.subscriptions")` in every action; `/api/workspace/prms/subscriptions/export` → `authorizeWorkspaceApi("manage.prms.subscriptions")` (was `/api/admin/prms/subscriptions/export`) | Management → nav key `manage.prms.subscriptions` | test: "every moved page calls requireWorkspaceAccess…", "every server action…", "every /api/workspace route…", "each moved page key per role…"; e2e |
| TMS programs `/admin/tms/programs` | `/workspace/tms/programs` | `workspace.manageTraining` + plan(tms) | `requireWorkspaceAction("manage.tms.programs")` in every action; `/api/workspace/tms/programs/export` → `authorizeWorkspaceApi("manage.tms.programs")` (was `/api/admin/tms/programs/export`) | Management → nav key `manage.tms.programs` | test: "every moved page calls requireWorkspaceAccess…", "every server action…", "every /api/workspace route…", "each moved page key per role…"; e2e |
| TMS batches `/admin/tms/batches` | `/workspace/tms/batches` | `workspace.manageTraining` + plan(tms) | `requireWorkspaceAction("manage.tms.batches")` in every action; `/api/workspace/tms/batches/export` → `authorizeWorkspaceApi("manage.tms.batches")` (was `/api/admin/tms/batches/export`) | Management → nav key `manage.tms.batches` | test: "every moved page calls requireWorkspaceAccess…", "every server action…", "every /api/workspace route…", "each moved page key per role…"; e2e |
| TMS students `/admin/tms/students` | `/workspace/tms/students` | `workspace.manageTraining` + plan(tms) | `requireWorkspaceAction("manage.tms.students")` in every action; `/api/workspace/tms/students/export` → `authorizeWorkspaceApi("manage.tms.students")` (was `/api/admin/tms/students/export`) | Management → nav key `manage.tms.students` | test: "every moved page calls requireWorkspaceAccess…", "every server action…", "every /api/workspace route…", "each moved page key per role…"; e2e |
| TMS certificates `/admin/tms/certificates` | `/workspace/tms/certificates` | `workspace.manageTraining` + plan(tms) | `requireWorkspaceAction("manage.tms.certificates")` in every action; `/api/workspace/tms/certificates/export` → `authorizeWorkspaceApi("manage.tms.certificates")` (was `/api/admin/tms/certificates/export`) | Management → nav key `manage.tms.certificates` | test: "every moved page calls requireWorkspaceAccess…", "every server action…", "every /api/workspace route…", "each moved page key per role…"; e2e |
| TMS payments `/admin/tms/payments` | `/workspace/tms/payments` | `workspace.manageTraining` + plan(tms) | `requireWorkspaceAction("manage.tms.payments")` in every action; `/api/workspace/tms/payments/export` → `authorizeWorkspaceApi("manage.tms.payments")` (was `/api/admin/tms/payments/export`) | Management → nav key `manage.tms.payments` | test: "every moved page calls requireWorkspaceAccess…", "every server action…", "every /api/workspace route…", "each moved page key per role…"; e2e |
| Chat channels `/admin/teamchat/channels` | `/workspace/teamchat/channels` | `workspace.manageChat` + plan(messenger) | `requireWorkspaceAction("manage.teamchat.channels")` in every action; `/api/workspace/teamchat/channels/export` → `authorizeWorkspaceApi("manage.teamchat.channels")` (was `/api/admin/teamchat/channels/export`) | Management → nav key `manage.teamchat.channels` | test: "every moved page calls requireWorkspaceAccess…", "every server action…", "every /api/workspace route…", "each moved page key per role…"; e2e |
| Chat direct-messages `/admin/teamchat/direct-messages` | `/workspace/teamchat/direct-messages` | `workspace.manageChat` + plan(messenger) | `requireWorkspaceAction("manage.teamchat.direct-messages")` in every action; `/api/workspace/teamchat/direct-messages/export` → `authorizeWorkspaceApi("manage.teamchat.direct-messages")` (was `/api/admin/teamchat/direct-messages/export`) | Management → nav key `manage.teamchat.direct-messages` | test: "every moved page calls requireWorkspaceAccess…", "every server action…", "every /api/workspace route…", "each moved page key per role…"; e2e |
| Chat meetings `/admin/teamchat/meetings` | `/workspace/teamchat/meetings` | `workspace.manageChat` + plan(messenger) | `requireWorkspaceAction("manage.teamchat.meetings")` in every action; `/api/workspace/teamchat/meetings/export` → `authorizeWorkspaceApi("manage.teamchat.meetings")` (was `/api/admin/teamchat/meetings/export`) | Management → nav key `manage.teamchat.meetings` | test: "every moved page calls requireWorkspaceAccess…", "every server action…", "every /api/workspace route…", "each moved page key per role…"; e2e |
| Portal users `/admin/portal/users` | `/workspace/portal/users` | `workspace.managePortalUsers` + plan(portal) | `requireWorkspaceAction("manage.portal.users")` in every action; `/api/workspace/portal/users/export` → `authorizeWorkspaceApi("manage.portal.users")` (was `/api/admin/portal/users/export`) | Management → nav key `manage.portal.users` | test: "every moved page calls requireWorkspaceAccess…", "every server action…", "every /api/workspace route…", "each moved page key per role…"; e2e |
| Job applicants `/admin/careers/applicants` | `/workspace/careers/applicants` | `workspace.manageCareers` | `requireWorkspaceAction("manage.careers.applicants")` in every action; `/api/workspace/careers/applicants/export` → `authorizeWorkspaceApi("manage.careers.applicants")` (was `/api/admin/careers/applicants/export`); `/api/workspace/careers/applicants/[id]/resume` same key | Management → nav key `manage.careers.applicants` | test: "every moved page calls requireWorkspaceAccess…", "every server action…", "every /api/workspace route…", "each moved page key per role…"; e2e |
| Chatbot conversations `/admin/chatbot/conversations` | `/workspace/chatbot/conversations` | `workspace.manageChatbot` | `requireWorkspaceAction("manage.chatbot.conversations")` in every action; `/api/workspace/chatbot/conversations/export` → `authorizeWorkspaceApi("manage.chatbot.conversations")` (was `/api/admin/chatbot/conversations/export`) | Management → nav key `manage.chatbot.conversations` | test: "every moved page calls requireWorkspaceAccess…", "every server action…", "every /api/workspace route…", "each moved page key per role…"; e2e |
| Chatbot voice conversations `/admin/chatbot/voice-conversations` | `/workspace/chatbot/voice-conversations` | `workspace.manageChatbot` | `requireWorkspaceAction("manage.chatbot.voice-conversations")` in every action; `/api/workspace/chatbot/voice-conversations/export` → `authorizeWorkspaceApi("manage.chatbot.voice-conversations")` (was `/api/admin/chatbot/voice-conversations/export`) | Management → nav key `manage.chatbot.voice-conversations` | test: "every moved page calls requireWorkspaceAccess…", "every server action…", "every /api/workspace route…", "each moved page key per role…"; e2e |
| Users, roles, permission overrides `/admin/users` | `/workspace/users` | `workspace.manageUsers`; granting Super Admin, changing a Super Admin and permission overrides: Super Admin only | `requireWorkspaceAction("company.users")` + `delegatedManagerBlock`; `/api/workspace/users/export` → `authorizeWorkspaceApi("company.users")` | Company → `company.users` | test: "every moved page calls requireWorkspaceAccess…", "every server action…", "every /api/workspace route…", "each moved page key per role…"; e2e; test: "a delegated user manager can't grant Super Admin…" |
| Admin analytics `/admin/analytics/[panel]` | `/workspace/analytics/[panel]` (one page; `ExecutiveViews.tsx` is the former admin view, shown to holders of `workspace.viewCommandCenter`; everyone else gets the role-scoped view) | panel analytics rule or `workspace.viewCommandCenter`, + plan(panel) | `checkWorkspaceAccess` in the page | Analytics → `analytics.<panel>` | tests: "who sees what", "the Command Center permission opens the full analytics…"; e2e |
| Executive notifications `/admin/notifications` + bell | `/workspace/notifications` and the one bell in the top bar (`lib/workspace/notifications.ts`): Workspace notifications for everyone, plus the panels' stores for holders of `workspace.viewCommandCenter` | signed-in; panel stores: `workspace.viewCommandCenter` | `hub-actions.ts`: `getCurrentHubUser()`; mark-read goes to the store the item came from, always the user's own | Account → `account.notifications` | test: "workspace and panel notifications in one list; mark-read goes to the right store"; e2e |
| Admin sign-in `/admin/login`, `/admin/change-password`, admin session | removed: `/workspace/login`, `/workspace/change-password`, the Workspace session | — | `src/lib/admin-auth.ts` deleted | — | test: "an old admin-panel session grants nothing"; e2e (redirects) |
| Panel analytics `/workspace/analytics/*` | unchanged | fms/hrms/pms/prms/tms/messenger: SA or role(x); lms: `lms.canViewAnalytics`; workspace: `workspace.canViewAnalytics`; portal: SA or `portal_admin`; all + plan(x) | `checkWorkspaceAccess` in the page | `analytics.<panel>` | test: "navigation = guard", "who sees what" |
| Panels (HRMS, PMS, …) | Panels → one item per panel | role(x) + plan(x); CRM: every account | each panel's own layout and auth module | `panel.<key>`; outside the plan = locked tile on the Staff Hub | tests: "who sees what", "for other roles it opens exactly the panels their roles allow" |

### 2.2 Company SaaS management

| Existing feature | Workspace location | Permission | API authorization | UI access | Verified |
|---|---|---|---|---|---|
| Onboarding `/workspace/onboarding` | Company → Company setup | SA | page + `requireOwner()` in actions | `company.setup` | test: "navigation = guard" (13 users × 74 keys); page/action check: code read; e2e |
| Organization profile | Company → Organization profile `/workspace/settings/profile` (**new page**, reuses the onboarding profile form and `saveProfileAction`) | SA | `requireWorkspaceAccess`; action `requireOwner()` | `company.profile` | test: "navigation = guard" (13 users × 74 keys); page guard `requireWorkspaceAccess`: code read; save: e2e only |
| Workspace settings / company settings | Company (section header) → `/workspace/settings` | SA | page | section link | code read; e2e |
| Plan, subscription, upgrade, downgrade, renewal (cancel / resume) | Company → Plan & billing `/workspace/settings/billing` | SA | `billing/actions.ts` `requireOwner()` | `company.billing` | test: "navigation = guard" (13 users × 74 keys); page/action check: code read; e2e (existing `scripts/e2e/subscriptions.e2e.mjs` covers the flows; not re-run) |
| Upgrade prompt `/workspace/upgrade` | reached from locked tiles | any (F8) | none | not a nav item | code read; e2e (frame, phone width) |
| Billing details (GST) | Company → Plan & billing | SA | same | `company.billing` | code read |
| Invoices | Company → Invoices & payments `/workspace/settings/billing/invoices` | SA | page; PDF route (F5) | `company.invoices` | test: "navigation = guard" (13 users × 74 keys); page/action check: code read; e2e |
| Payments / transactions | same page, "Payments & refunds" card (**added**, from paid invoices and credit notes) | SA | same loader | `company.invoices` | test: "payments: paid invoices and credit notes of this company only"; e2e |
| Usage | Company → Usage `/workspace/settings/usage` (**new page**, read-only) | SA | `requireWorkspaceAccess` | `company.usage` | tests: "usage: own seats, AI tokens and storage against the plan's limits", "usage levels"; e2e |
| Users / seats | Company → Users, roles & seats `/workspace/users` (seats badge **added**) | `workspace.manageUsers` | `requireWorkspaceAction("company.users")` | `company.users` | code read; e2e |
| Roles & permissions | same page (role editor, permission overrides) | SA | same | `company.users` | code read |
| Domains | Company → Custom domains `/workspace/settings/domains` | SA | page + actions | `company.domains` | test: "navigation = guard" (13 users × 74 keys); page/action check: code read; e2e |
| Branding | Company → Branding `/workspace/settings/branding` | SA | page + actions | `company.branding` | test: "navigation = guard" (13 users × 74 keys); page/action check: code read; e2e |
| Own payment gateway | Company → Payment account `/workspace/settings/payments` | SA | page + actions | `company.payments` | test: "navigation = guard" (13 users × 74 keys); page/action check: code read; e2e |
| Integrations | Company → Integrations `/workspace/settings/integrations` (**new page**, a list with status and links) | SA | `requireWorkspaceAccess` | `company.integrations` | test: "integrations: status from the company's own gateway, webhooks and domains"; e2e |
| Automations (incl. webhooks) | Company → Automations | SA | page + actions | `company.automations` | test: "navigation = guard" (13 users × 74 keys); page/action check: code read; e2e |
| Import | Company → Import data | SA | page + route handlers | `company.import` | test: "navigation = guard" (13 users × 74 keys); page/action check: code read; e2e |
| Activity log | merged into Company → Audit log `/workspace/settings/audit-log` (source "Workspace events") | SA | `requireWorkspaceAccess("company.audit")` + `canViewWorkspaceEvents` | `company.audit` | test: "Audit log: panel activity needs the Audit log permission…" |
| Security | Company → Security `/workspace/settings/security` (**new page**: last sign-in, change password, sign out everywhere, account lock / forced-change counts) | SA | `requireWorkspaceAccess`; existing `hubLogoutAction` | `company.security` | test: "security: own accounts and own sessions only"; e2e |
| Notifications, change password | Account | any signed-in account | `getCurrentHubUser()` | `account.*` | test: "navigation = guard" (13 users × 74 keys); test: "an account without roles…"; e2e |
| Platform Panel | single link, bottom of the sidebar and on `/workspace/settings` | owner company **and** platform access (`getPlatformAccessForUser`) | `/platform` layout `requirePlatformAccess()` (unchanged) | `platform.panel` | tests: "Platform link: only owner company + platform access", "a platform role gives the link without any Workspace permission…", "the nav never contains a Platform Panel page other than the single link"; e2e |

### 2.3 Panel sign-in

| Panel | Before | Now |
|---|---|---|
| hrms, pms, fms, prms, tms, ots, sop, dlms, cms, seo, smms, aibots, messenger | Own `/<panel>/login` form, own cookie (`<panel>_session`) and session collection, own credential check with the panel's role rule. Signing in to any panel already minted a session in every other panel the roles allowed (`cross-module-sso.ts`), but a role granted later, or an expired panel cookie, meant signing in again. | `/<panel>/login` is a redirect: to the panel when the account may use it, to `/workspace` when signed in without that panel's role, else to `/workspace/login?next=/<panel>`. The panel's auth (`getCurrent<Panel>User`, and the three API helpers that read the cookie themselves) accepts its own session **or** the Workspace session of the same account, and applies the same role rule to the account's current roles either way. |
| lms (CRM) | Own form; no role rule (any account) | Same redirect and fallback; still no role rule |
| admin | Own form, `super_admin` only | Deleted; pages moved to the Workspace |
| workspace | `/workspace/login`, any account | The one sign-in. `?next=` returns to a panel after sign-in; only same-origin paths pass `safeNextPath` (no scheme, no `//host`, no backslash or control characters, never the sign-in page itself); checked in the page and again in the action |
| portal (`/portal`), public exam pages, `/pay`, public site, Platform Panel permissions | — | not touched |

Sign-out: every panel's sign-out and the Workspace's call `destroySessionsEverywhere`, which deletes the account's sessions in every panel and the Workspace, on every device (unchanged), and now also drops a leftover `admin_session` cookie. Forced password change: the Workspace layouts and guards redirect to `/workspace/change-password`; each panel's layout still redirects to its own change-password page, which works with the Workspace session. What was reused: the existing SSO minting at sign-in and the existing sign-out; what was added: the Workspace-session fallback in each panel's auth (`src/lib/workspace-session.ts`).

Not changed and worth knowing: the panels' per-panel sessions still exist (minted at sign-in) and each panel's now-unused `verify<Panel>Credentials` function is still in its auth module.

Not built, because the data does not exist: two-factor sign-in, password policy,
"sign out other sessions only" (sessions carry no per-login id that links the
panels' sessions; only "sign out everywhere" exists), per-department or per-team
scoping of Workspace or `/admin`.

---

## 3. Findings

| # | Finding | Severity | Status |
|---|---|---|---|
| F1 | 33 of 35 `/admin` pages had no check of their own; only `admin/(protected)/layout.tsx` checked the session. Layouts are not re-rendered on navigation, so a page's loader could run without the check. | high | **fixed**: the pages moved into the Workspace; each one calls `requireWorkspaceAccess(<its key>)`, each action `requireWorkspaceAction`, each API `authorizeWorkspaceApi`. Test: "every moved page / server action / route…" |
| F2 | `/workspace/analytics/portal`, `/lms`, `/workspace`: the page authorized **every** signed-in account, while the sidebar hid Portal analytics from non-admins. Company-wide lead and account numbers were readable by any employee. | medium | **fixed**: the page calls `checkWorkspaceAccess(user, "analytics.<panel>")`. Lead analytics now needs `lms.canViewAnalytics` (LMS admin/manager, or an override), Workspace analytics `workspace.canViewAnalytics` (every invitation preset includes `workspace_member`), Portal analytics `super_admin` / `portal_admin`. **Behaviour change** for accounts without those roles. Tests: "who sees what" |
| F3 | Workspace analytics ignored the plan and the switched-on panels (a company without Finance in its plan could still open Finance analytics). | medium | **fixed**: analytics items need the panel in the plan and switched on. Tests: "plan without Finance…", "a panel the company switched off disappears" |
| F4 | Staff Hub sidebar: hardcoded role checks duplicated the page's checks; "Lead Analytics" and "Workspace Analytics" were shown unconditionally; Staff Hub quick links pointed at `/hrms/me`, `/messenger`, `/pms` for people without those roles. | low | **fixed**: sidebar, mobile sidebar, Staff Hub tiles, quick links and settings cards render from `resolveWorkspaceNav` |
| F5 | `/api/platform/billing/invoices/[id]/pdf` treated **any** `super_admin` of the platform-owner company as a platform admin, even when their Platform Panel access was revoked or their platform role lacks `invoices.read`; they could download any company's invoice. | medium | **fixed**: "any company" now needs the owner company **and** platform access with `invoices.read`; everyone else gets only their own company's document. Code read (not exercised by a test here; `scripts/e2e/invoices.e2e.mjs` covers the route) |
| F6 | `/workspace/settings` showed the "Platform Panel" card to every `super_admin` of the owner company without checking platform access. | low | **fixed**: the card is the nav item `platform.panel`. Tests: "Platform link…" |
| F7 | Duplication: `/admin/analytics/[panel]` and `/workspace/analytics/[panel]` render the same analytics; `/admin/login` and `/workspace/login` are two sign-ins for one identity; the `/admin` sidebar links `/admin/users` twice ("User Management", "Access & Roles"). | low | **fixed**: one analytics page, one notifications page and bell, one sign-in; the admin sidebar is gone |
| F8 | `/workspace/upgrade` has no session check; an anonymous visitor on a company's host can read that company's plan name. | low | **fixed**: the page now lives under the Workspace layout, which needs a signed-in session. |
| F9 | `getPlatformDb()` in company-side code: `domains/custom.ts`, `branding`, `onboarding/state.ts`, `billing/{subscription,addons,coupons,invoices,limits}` — every query read is keyed by the current `companyId` (or is a platform catalogue: plans, add-ons). No unfiltered company-side use found. | info | no change needed |
| F10 | `/workspace/settings/*` and `/workspace/onboarding` did not enforce a pending forced password change (the Workspace layout does). | low | **fixed** in the shared layout (`src/app/workspace/(protected)/layout.tsx`, which also replaced the three parallel `CompanyPagesLayout` wrappers): redirects to `/workspace/change-password` first. Code read |
| F11 | `/platform/invoices/export` checks owner company + `super_admin` rather than the platform permission `invoices.read`. Platform Panel code, out of scope here. | medium | **fixed** by the lead (commit e5e0a11) |
| F12 | `/admin` grids for a panel outside the company's plan (e.g. `/admin/tms/*` on a plan without Training) stay reachable for the `super_admin`. They read the company's own data only. | low | **fixed**: each register needs its panel in the plan and switched on. Test: "registers of a panel outside the plan or switched off are closed even to the super admin" |
| F13 | Panel analytics for fms / prms / tms / messenger are company-wide and open to **any** role of that panel (HR and Projects are restricted to the viewer's own records). No finer rule exists in the page today. | low | open |

---

## 4. What was run

| Check | Result |
|---|---|
| `scripts/test-workspace-access.ts` (local mongod, throwaway `ws_test_*` database, dropped) | 46 checks passed (56 after the restructure in section 5) |
| `test-platform-roles`, `test-enforcement`, `test-search-notifications`, `test-import`, `test-events-workflows` | 99, 25, 22, 15, 30 checks passed |
| `npx next typegen` + `npx tsc --noEmit -p .` | clean |
| `scripts/e2e/workspace.e2e.mjs` | updated for the move and again for section 5, syntax-checked, **not run** |
| The 14 existing `scripts/e2e/*.e2e.mjs` | **not run**; none referenced `/admin`, `/api/admin` or a panel `/login`, so none was changed |
| `next build`, the redirects in `next.config.ts`, rendering of the moved pages | **not run / not verified** here |

"navigation = guard": for 13 representative users and every nav key, `resolveWorkspaceNav` lists an item exactly
when `checkWorkspaceAccess` allows it. The static checks read the source of every moved page, action file and API
route and assert that it calls the Workspace guard with the nav key of its own path. The guards themselves
(`requireWorkspaceAccess`, `requireWorkspaceAction`, `authorizeWorkspaceApi`) read the request cookie, so their
redirect / 401 / 403 behaviour is covered only by the browser test.

---

## 5. Restructure: one dashboard, one audit log, everything workspace-specific under `/workspace`

### 5.1 Old → new routes

Every old URL is a **permanent redirect** (`next.config.ts`, 308, query string kept; the patterns are anchored and name
exact prefixes, so `/api/*`, `/platform/*`, a panel's own `/<panel>/settings` and the public site are never touched).

| Old | New |
|---|---|
| `/settings` | `/workspace/settings` |
| `/settings/*` (profile, billing, billing/invoices, usage, security, integrations, domains, branding, payments, automations, import, import/run, import/sample) | `/workspace/settings/*` |
| `/settings/activity` | `/workspace/settings/audit-log?source=workspace` |
| `/onboarding` | `/workspace/onboarding` |
| `/upgrade?module=x` | `/workspace/upgrade?module=x` |
| `/workspace/command-center` | `/workspace` (the Command Center is the dashboard) |
| `/workspace/activity-log` | `/workspace/settings/audit-log?source=panels` |
| `/workspace/documents` | `/workspace/account/documents` |

Not moved on purpose: `/signup`, `/verify`, `/pay`, `/portal`, the public site, each business panel's own routes,
`/platform/*`, `/api/platform/*` (Razorpay webhook, crons: URLs registered with external services stay stable) and
`/workspace-not-found` (the page the proxy rewrites to for a host that has **no** company, so it cannot live in a
company's Workspace). `/workspace/invite`, `/workspace/handoff` and the hub server actions moved physically from
`src/app/(platform)/workspace/` to `src/app/workspace/` (same URLs).

All pages sit in the one `src/app/workspace/(protected)/` layout (sidebar, top bar, billing notice); the three parallel
`(platform)/{settings,onboarding,upgrade}/layout.tsx` wrappers and `CompanyPagesLayout` are gone.
Guards: every moved page keeps its guard (`requireWorkspaceAccess(<key>)` or the company-Super-Admin check it always had),
plus the forced password change from the layout. API URLs under `/api/workspace/**` did not change; their guard keys did
where the nav item moved (`company.audit`, `account.documents`).

### 5.2 The one dashboard

`/workspace` = the Command Center. In order:

1. Welcome header (roles, employee code).
2. **Executive overview** — only when `loadExecutiveOverview()` returns data, i.e. for holders of
   `workspace.viewCommandCenter` (Super Admin always): date/granularity filters, Financial Position (FMS), Business
   Overview, Financial Intelligence charts, Sales & CRM, Operations, Training, Procurement, AI & Communication, Panel
   Performance Matrix (`src/components/workspace/CommandCenterSections.tsx`, the former page body). Without the permission
   nothing of this is queried or rendered.
3. Company strip (`CompanyToday`: Ask box, company KPIs filtered by `accessibleAreas`, recent activity; global search is in
   the top bar).
4. Panel tiles (`data-module` / `data-locked`, "Upgrade to unlock" tiles pointing at `/workspace/upgrade?module=x`).
5. The person's own sections (attendance, leave, pay, projects & tasks, privileges, quick links) — unchanged.

Everyone else gets 1, 3, 4, 5. The Management section no longer has a Command Center item; the permission is checked with
`canViewCommandCenter(user)` (`nav.ts`) by the dashboard, the analytics pages and the notification bell.

### 5.3 The one Audit log (Company → Audit log, `/workspace/settings/audit-log`)

| Source | Rows | Who may read it (unchanged) | Filters |
|---|---|---|---|
| Workspace events | `platform_events` (event bus, 180 days) | company Super Admin (`canViewWorkspaceEvents`) | event type, person, from/to; paging |
| Panel activity | the panels' audit collections (Procurement, Projects, Team Chat, Training, HR, Portal, Online Tests) | `workspace.viewAuditLog` (`canViewAuditLog`) | search, module, action, from/to; CSV export |
| All | both, newest first (newest 200 of each paged) | both of the above | from/to |

The page guard is the nav key `company.audit` (= `workspace.viewAuditLog`); the `source` query parameter can only narrow
what the viewer may already read (`resolveAuditSource`). Someone holding only the Audit log permission sees Panel activity
only. The Platform Panel's `/platform/audit` (SaaS-provider audit across companies) is a different log and is untouched.

### 5.4 Documents

Account → Documents (`/workspace/account/documents`, key `account.documents`, permission `workspace.manageDocuments`,
export API `/api/workspace/documents/export`). No second Documents location exists in the Workspace (the Digi Locker
panel `/dlms` is a different product and was left alone).

### 5.5 Workspace vs Platform

| Lives in the **Platform Panel** (`/platform/*`, SaaS provider only) | Lives in the **Workspace** (`/workspace/*`, one company) |
|---|---|
| Companies, sign-ups & approvals, domains & SSL, plans, subscriptions, SaaS invoices, coupons, add-ons, payments / Razorpay config, tax, revenue, usage & limits, platform users & roles, integrations, platform audit log, platform settings | the company's dashboard, panels, analytics, registers, users & roles, its own plan & billing, usage, branding, domains, payment account, automations, import, security, audit log, onboarding, documents, notifications |

Why: the Platform Panel answers "how is the SaaS business doing, across all companies"; the Workspace answers "how does
this company run". The only link from Platform to a company surface is a plain **Workspace** link (it used to read
"Staff Hub"); the only Platform item in the Workspace is the single conditional **Platform Panel** link
(`platform.panel`, owner company and a platform role). Audited: every page under `(platform)/platform/**`, the console
libraries and the Platform sidebar/shell contain only SaaS functionality; nothing needed moving (only the link label changed).

### 5.6 Registration, Workspace, onboarding

`/signup` stays a single simple form (company name, workspace address, owner name, e-mail, password, terms) — it has no
setup questions, so nothing had to be moved into the wizard. Flow:

1. Sign-up -> e-mail link -> `confirmSignup` creates the company and owner (30-day trial starts here, unchanged) and a
   one-time handoff with `next: "/workspace"`; the handoff signs the owner in on the company host and lands on `/workspace`.
2. Approval mode: `approveSignup` creates the same company and e-mails a link to `/workspace/login`; signing in lands on `/workspace`.
3. **Login landing, decided in one place** (`postLoginTarget`, `src/lib/platform/onboarding/gate.ts`, pure; called through
   `loginLanding()` by `/workspace/login` and `/workspace/handoff`, which covers sign-up confirmation and the approval
   e-mail sign-in): a Super Admin of a customer company whose setup is **neither completed nor skipped** lands on
   `/workspace/onboarding` at every sign-in, existing never-finished companies included. A valid explicit `next` (a deep
   link, a panel's `/login?next=/hrms`) is honoured and never overridden. Invited employees, other roles and the platform
   owner's company never land there (invitation acceptance goes to `/workspace`).
4. **No page redirects.** `/workspace` always shows the dashboard, and everything in the Workspace works with setup
   unfinished. The only redirect is the one at sign-in, so no loop is possible.
5. **The strip** (`SetupBanner`, in `WorkspaceShell`, on every Workspace page including the dashboard): while setup is
   **not completed** — skipped or not — the owner sees "Your workspace setup isn't finished — N of 5 steps done" with a
   "Complete setup" link to `/workspace/onboarding`. Hidden on the wizard, for non-owners, the platform owner's company and
   once completed. The wizard's "Skip for now" writes `dismissedAt`: it only stops the login landing, the strip stays. Wizard
   actions revalidate the Workspace layout so the strip updates / disappears without a reload. The wizard stays reachable
   from Company → Company setup.

### 5.7 What was run for section 5

`scripts/test-signup-onboarding-flow.ts` (13 checks: sign-up -> handoff, approval path, the pure login-landing and strip rules,
explicit `next`, invited teammate), `test-workspace-access` (56), and the platform-roles, enforcement, search-notifications,
import, events-workflows, billing-foundation and console tests; `npx tsc --noEmit -p .` clean. `scripts/e2e/registration.e2e.mjs`
and the extended `scripts/e2e/workspace.e2e.mjs` are written and syntax-checked, **not run** by the author; `next build` was
not run.
