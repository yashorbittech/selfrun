# SelfRun Business — architecture

How the platform is put together: hosts, tenants, products and the pieces that make a new deployment work. For setup see
[../README.md](../README.md); for hosting see [deploy-vercel.md](./deploy-vercel.md); for what each product does see
[products.md](./products.md).

## The two sides of every company

Every company, including the platform operator, has two hosts:

| Side | SelfRun Business | A customer on an automatic address | A customer with its own domain |
| --- | --- | --- | --- |
| **Site**: public pages only | `selfrunbusiness.com`, `www.…` (product website, `/signup`, `/login`) | `<slug>.selfrunbusiness.com` | `acme.com` |
| **App**: products only | `app.selfrunbusiness.com` | `<slug>-app.selfrunbusiness.com` | `app.acme.com` |

The site host never serves a product and the app host never serves a website. `src/proxy.ts` enforces it for page requests:

- a product path (`/workspace`, `/console`, `/talentos`, `/clientos`, `/login`, … see `src/lib/platform/tenancy/surfaces.ts`) on a site
  host is redirected to the same path on the app host;
- `/` on an app host goes to `/workspace`; any other website path on an app host is redirected to the site host;
- payment links (`/pay/…`) and certificate verification (`/verify/…`) work on both;
- APIs are not split: public forms and webhooks keep working on the site host, and every product API still requires its
  own sign-in;
- app hosts are never indexed (`noindex`, robots `Disallow: /`, empty sitemap).

Session cookies are per host, so a visitor on the website host never holds a product session. Signing up on the product
website ends with a one-time hand-off that signs the new owner in on their app host.

## Hosts

`src/lib/platform/saas/hosts.ts` lists the hosts of the product itself:

- site hosts: `SAAS_HOSTS` (comma separated; the `www.` or apex variant is added), in development `localhost` and `saas.localhost`;
- app hosts: `app.` plus every site host without `www.` (`app.selfrunbusiness.com`; in development `app.localhost`).

`resolveHostInfo` in `src/lib/platform/tenancy/companies.ts` resolves every request host to a company and a side, in this order:

1. a product site or app host, which resolves to the operator company;
2. a verified custom domain (site), or `app.<verified domain>` (app), which resolves to its company;
3. `<slug>-app.<root domain>` (app) or `<slug>.<root domain>` (site; in development `*.localhost`), which resolves to that company;
4. anything else, which shows "No workspace here".

A workspace address (slug) cannot end in `-app`. For custom domains the `app.` record is shown next to the website's in
Workspace → Settings → Domains and is attached at the hosting provider with the domain.

## Operator company and tenants

- The **operator company** is flagged `isPlatformOwner`. It holds the platform staff accounts and the Platform Console, served on `app.<SaaS host>`. It is
  created on the first start of an empty database when `SAAS_ADMIN_EMAIL` is set (`src/instrumentation.ts` calls
  `ensureOperator` in `src/lib/platform/saas/bootstrap.ts`, once per process). If `SAAS_ADMIN_PASSWORD` is not set, a temporary
  password is logged once.
- A **customer** is any other company. It is created by `/signup` (`createCompanyWithOwner`), with a Super Admin account, a
  trial subscription, the product set of its plan and a starter website. No customer is special-cased.

## Tenant isolation

Data sits in shared collections with a `companyId` field. `scopeDb` (`src/lib/platform/tenancy/scoped-db.ts`) wraps the
database so that:

- reads, updates and deletes always include the company's `companyId`,
- inserts are stamped with it and updates can never change it,
- aggregations are confined, including joins into other collections,
- unique indexes include `companyId` as their first key, so emails, slugs and codes are unique per company,
- operations that cannot be scoped (drop, rename, change streams) throw.

Keyed collections (counters, settings singletons, themes) store their `_id` as `<companyId>::<key>`, translated
transparently. Platform-level collections (companies, domains, billing, product registry, support, sign-ups) are listed in
`src/lib/platform/tenancy/collections.ts`; everything not listed there is isolated by default. Cross-company work must ask for
the unscoped database explicitly.

## Products and plans

The Product Registry lists every product: key, name, description, icon, route, order and global on/off. Plans
(`billing_plans`) list which products they include, and add-ons can add more. A company's sidebar shows the products its
subscription allows. Staff manage the registry and plans in the Platform Console.

## The installable app and push notifications

Only app hosts are an app. `src/app/manifest.webmanifest/route.ts` serves a manifest per app host (404 on website hosts), built from
`src/lib/pwa/identity.ts`: the company's brand and theme (light and dark colours) overridden by its `pwa_settings` (`lib/pwa/settings.ts`,
`store.ts`, edited at Workspace → Settings → Mobile app), with icons from `/pwa/icons/<size>.png` (`src/lib/pwa/icon.tsx`, maskable
variants included). Icon URLs carry a `?v=<hash>` of everything that affects the look, so a change reaches devices without waiting for caches. `public/sw.js` handles offline (only a static offline page; pages and API responses are never cached),
caches immutable build files, and shows push notifications. The root layout registers it and shows the install prompt only
when the host is a app host.

Push uses Web Push with VAPID (`web-push`). `src/lib/push/`: `categories.ts` (categories, preferences, quiet hours, type to category),
`store.ts` (`push_subscriptions`, `push_preferences`, company-scoped), `send.ts` (`queuePush` / `pushToUsers`: honours the master switch,
categories and quiet hours, prunes dead subscriptions), `api.ts` (the guard for `/api/push/*`: app hosts only, signed-in people
only, push-service allow-list). Every product's `notify()` (HR, Projects, Procurement, Training, Team Chat and the products that use it,
workflow notifications, and the client portal) calls `queuePush` after it stores the in-app notification, so a push never exists
without its bell entry. People manage themselves at `/workspace/notifications/settings` and `/clientos/notifications/settings`.

### Apps and the Generate buttons

`lib/apps/assets.tsx` draws every asset (PWA, Android, iOS, desktop icons, splash, feature graphic) from the company's brand and settings on demand;
`/api/apps/assets/file/<id>.png` and `/api/apps/assets/pack/<kind>` (ZIP) serve them (public on app hosts, rate limited, because the mobile
and desktop builds download them). `mobile/` builds Android and iOS projects from the pack (Capacitor). A build covers five platforms (`win`, `mac`,
`linux`, `android`, `ios`); the Apps page only ever asks for one (scope = that platform), and out-of-scope platforms are `skipped`. **Nothing is built
automatically**: the only way to start a build is a Super Admin pressing a platform's button (`buildAppAction`). A build blocks another only when they
share a platform, so Android can be generated while Windows builds. `getAppsOverview` gives each platform an action: `ready`, `running` or `unavailable`
(no build service connected).

`lib/apps/`: `enqueue.ts` (`enqueueBuild`, `dispatchBuild`, `runBuildCron`), `callback.ts` (what the build service may report),
`store.ts` (`app_builds`, a platform-level collection whose rows carry their `companyId`), `overview.ts` (what the Apps page shows).
Onboarding no longer starts builds. A build is a row with
a status per platform (win, mac, linux, android, ios). `dispatchBuild` starts `.github/workflows/desktop.yml`, which builds each platform with
`desktop/scripts/build-company.mjs`, publishes to the releases repository (`publish-build.mjs`) and POSTs to
`/api/apps/builds/callback` (bearer `DESKTOP_BUILD_SECRET`; only GitHub release download links are accepted). `/api/apps/builds/cron`
runs daily and only hands over builds that a person already requested and fails ones that never finished. What an installer bakes in (name, icon, address) is `PwaIdentity.buildHash`; everything else is read at run time.
The page is Workspace → Settings → Apps (`workspace/(protected)/settings/apps`).

### Desktop app

`desktop/` (own `package.json`, plain CommonJS, not part of the Next.js build) is an Electron shell for any workspace. The server gives it
two public-to-the-app endpoints on app hosts: `/api/desktop/branding` (the app identity from `lib/pwa/identity.ts`, so the same
Mobile app settings drive the desktop app) and `/api/desktop/notifications` (the signed-in person's unread items, polled with the
app's session because Electron has no Web Push). The app adds `WorkspaceDesktop/<version>` to its user agent; the web app uses it
(`isDesktopApp()` in `lib/pwa/client.ts`) to skip the service worker, install prompts and Web Push inside it.
`desktop/scripts/build-company.mjs` builds installers for one company from its live branding.

### Website push (a company's visitors)

Separate from the app above and from the app's subscriptions. On a company's website host `public/web-sw.js` (notifications only: it
caches nothing and makes nothing installable) and `components/webpush/WebPushPrompt.tsx` (mounted in the `(site)` layout) let a
visitor opt in per topic. `src/lib/webpush/`: `topics.ts` (topics, settings, validation), `store.ts` (`web_push_subscribers`,
`web_push_broadcasts`, `web_push_settings`), `send.ts` (`sendBroadcast`: switches, daily cap, batching with a time budget, dead
subscription pruning, history row; `queueBroadcast` for automations), `api.ts` (website-host-only guard and rate limit for
`/api/web-push/*`). Automations: an offer campaign going live (`offers/subscriptions.ts`), a reward campaign switched on
(`wallet/campaigns.ts`), a blog post published (`cms/collections/store.ts`). The business manages it at `/sitecraft-ai/push`.

## The product website

`src/app/(platform)/saas/*` holds the marketing pages (home, features, modules, AI, automation, use cases, industries, how it works,
integrations, security, pricing, about, contact and demo, resources, FAQ, privacy, terms). The `(platform)` route group is an
organizational folder and does not add `/console` to the public URL. Pricing reads the live plans. Demo and contact requests are
stored with a honeypot and rate limit. Brand, colours and copy live in `src/lib/platform/saas/` (`brand.ts`, `theme.ts`,
`content.ts`); marketing components live in `src/components/platform/saas/`. The logo, mark and favicon are in `public/selfrun/`.
Robots and sitemap are host-aware.

## Repository layout and product URLs

Product route folders use the same branded slug as their customer-facing app URL. The route group keeps the filesystem organized
without adding a URL segment. API route folders follow the same slug, so for example `src/app/(products)/api/sitecraft-ai/`
serves `/api/sitecraft-ai/`.

| Product | App URL | Route folder |
| --- | --- | --- |
| CommandOS | `/commandos` | `src/app/(products)/commandos/` |
| DealFlow AI | `/dealflow-ai` | `src/app/(products)/dealflow-ai/` |
| CashFlow AI | `/cashflow-ai` | `src/app/(products)/cashflow-ai/` |
| SpendIQ | `/spendiq` | `src/app/(products)/spendiq/` |
| Cohort AI | `/cohort-ai` | `src/app/(products)/cohort-ai/` |
| Playbook AI | `/playbook-ai` | `src/app/(products)/playbook-ai/` |
| ContractFlow AI | `/contractflow-ai` | `src/app/(products)/contractflow-ai/` |
| CyberVault | `/cybervault` | `src/app/(products)/cybervault/` |
| EvalIQ | `/evaliq` | `src/app/(products)/evaliq/` |
| AgentOS | `/agentos` | `src/app/(products)/agentos/` |
| DataBrain AI | `/databrain-ai` | `src/app/(products)/databrain-ai/` |
| ViralPulse AI | `/viralpulse-ai` | `src/app/(products)/viralpulse-ai/` |
| RankMax AI | `/rankmax-ai` | `src/app/(products)/rankmax-ai/` |
| SiteCraft AI | `/sitecraft-ai` | `src/app/(products)/sitecraft-ai/` |
| TalentOS | `/talentos` | `src/app/(products)/talentos/` |
| SprintOS | `/sprintos` | `src/app/(products)/sprintos/` |
| Huddle AI | `/huddle-ai` | `src/app/(products)/huddle-ai/` |
| ClientOS | `/clientos` | `src/app/(products)/clientos/` |
| ResolveIQ | `/resolveiq` | `src/app/(products)/resolveiq/` |
| SelfRun Sites | `/` on the company's site host | Public site is served by the `(site)` routes; there is no `/sites` app URL |

Product UI is grouped in `src/components/products/<slug>/`; product-specific server logic is grouped in
`src/lib/products/<slug>/` where that product has a dedicated library. Shared platform services stay in `src/lib/platform/` and
shared UI stays outside the product folders. Marketing code is grouped under `src/app/(platform)/saas/`,
`src/components/platform/saas/` and `src/lib/platform/saas/`.

The platform operator's console is served at `/console` from `src/app/(platform)/console/`. Platform UI and services live under
`src/components/platform/` and `src/lib/platform/`; its APIs remain under `src/app/(platform)/api/platform/` at `/api/platform/`.
The old `/platform/...` product URLs permanently redirect to their `/console/...` equivalents. The `(platform)` route group itself
never appears in public URLs.

## AI prompts

Every instruction the system sends to an AI model is a **prompt** described once in `src/lib/prompts/registry.ts` (key, name, group, product, kind, variables with examples, default text). Code never holds prompt text: it calls `getPrompt("key", { vars })` from `src/lib/prompts/store.ts`.

- **Overrides.** A platform admin can change any prompt in Platform Console → *AI prompts* (`/console/prompts`; read needs `settings.read`, changes need `settings.manage`). An override is stored in `prompt_overrides`, applies to every company within about 10 seconds, and can be switched off or reset at any time. History is append-only: every save, restore, reset and on/off switch is a new numbered version in `prompt_versions` (also written to the platform audit log), nothing is deleted, numbering never restarts, and any version (or the built-in text) can be restored at any time, which creates a new version. The page also has a *Test run* tab that tries a draft against the platform's OpenAI key without saving it (rate limited, not for image prompts).
- **Safe by construction.** `{{name}}` placeholders are filled from the variables the prompt declares; an override that drops a required variable, uses an undeclared one, is empty or exceeds 60,000 characters is refused. If the database can't be read, or a stored override is no longer valid, the built-in text is used, so a prompt never breaks a feature.
- **Usage.** Uses per prompt per day are counted in memory and flushed at most every 30 seconds to `prompt_stats` (expires after 100 days).
- **Adding a prompt.** Add a `PromptDef` to the registry and call `getPrompt` where it is used. `npm run test:prompts` fails if a key doesn't exist, a registry entry is never asked for, a file calls an AI model without taking its prompt from the registry, or a prompt helper is used in a template literal without `await`.
- **Company prompts.** A handful of instruction prompts (`companyEditable` in the registry: the Ask AI agent and its website editor, the workspace assistant, ContractFlow, and the social-media system/post/ad/campaign prompts) can be reworded by each company in Settings → AI prompts (`company.prompts`). Scope, language, data-access, support, bot, website-builder and classifier prompts are never open to companies. A company's wording lives in the company-scoped `company_prompt_overrides` / `company_prompt_versions` (append-only, same version rules as the platform's), is used only for that company, and is always sent inside a fixed security header and footer written in `src/lib/prompts/guard.ts` (this one place; no screen edits it). Saving checks that the variables carrying scope, language and identity are kept, that nothing is undeclared, hidden or over 8,000 characters, and refuses wording that mentions other companies, secrets or the database, tries to switch the rules off or reveal hidden instructions. These are defence in depth: the real tenant boundary is the company-scoped data layer, which limits every query to the current company before any model is involved. Platform Console → AI prompts can switch company prompts off for everyone or per prompt (what companies saved is kept and applies again when switched back on).
- **Not in the registry on purpose:** tool/JSON schemas (they are code contracts), labels and data that are filled into prompts, canned replies, and text each company writes itself (its chatbot persona, bot instructions); the registry holds the *starting* text for those.

## Legal pages

The public policies (Terms, Privacy, Refund & Cancellation, Cookie, Data Policy, Data Processing Addendum, Sub-processors, Data Rights, Grievance Redressal) are written for India in `src/lib/platform/saas/legal-india.ts` (Information Technology Act and rules, CERT-In directions, Digital Personal Data Protection Act, Consumer Protection and E-Commerce Rules, CGST Act, Contract and Arbitration Acts). They are built per request from the operator's profile in Platform Console → **Legal & compliance** (entity, registered office, registration number, Grievance Officer, courts, effective date; legal name and GSTIN from Tax & invoicing). A field that is not entered is left out, never replaced by a placeholder, and the Console lists what is still missing. `npm run test:legal` guards this. Websites generated for companies get an India-law Privacy Policy and Terms of Service page of their own.

## Environment

| Variable | Meaning |
| --- | --- |
| `MONGODB_URI` | The platform database. Use a new, empty one |
| `SAAS_ADMIN_EMAIL`, `SAAS_ADMIN_PASSWORD` | First platform staff account (password optional; quote it if it contains `#`) |
| `SAAS_HOSTS` | Production hosts of the product site |
| `PLATFORM_ROOT_DOMAIN` | Root of customers' automatic addresses |
| `SAAS_HELLO_EMAIL`, `SAAS_SALES_EMAIL`, `SAAS_SUPPORT_EMAIL`, `SAAS_SECURITY_EMAIL` | Public mailboxes (default `<name>@<saas host>`) |
| `SAAS_OPERATOR_NAME` | Optional operating company named in the footer and legal pages |

The full list is in the README and `.env.example`.

## Where things live

| Path | Contents |
| --- | --- |
| `src/proxy.ts` | Host routing and rewrites |
| `src/instrumentation.ts` | First-start operator setup |
| `src/app/(platform)/console/` | Platform operator product, served at `/console` |
| `src/app/(platform)/saas/` | SaaS marketing pages, organized under the platform route group |
| `src/lib/platform/saas/`, `src/components/platform/saas/` | SaaS brand, hosts, routes, marketing components and content |
| `src/lib/push/`, `src/lib/pwa/`, `public/sw.js` | Push notifications and the installable app |
| `src/lib/platform/` | Tenancy, companies, billing, product registry, domains, email, website starter |
| `src/components/products/<slug>/`, `src/lib/products/<slug>/` | Product UI and product-specific server logic |
| `src/lib/products/sitecraft-ai/` | SiteCraft AI collections, themes and sections |
| `src/app/(platform)/` | Sign-up, SaaS routes, console, maintenance and workspace-not-found |
| `scripts/demo-seeders.ts`, `scripts/demo/` | The demo data command |
