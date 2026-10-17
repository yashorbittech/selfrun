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

### Apps and automatic desktop builds

`lib/apps/assets.tsx` draws every asset (PWA, Android, iOS, desktop icons, splash, feature graphic) from the company's brand and settings on demand;
`/api/apps/assets/file/<id>.png` and `/api/apps/assets/pack/<kind>` (ZIP) serve them (public on app hosts, rate limited, because the mobile
and desktop builds download them). `mobile/` builds Android and iOS projects from the pack (Capacitor). A build covers five platforms (`win`, `mac`,
`linux`, `android`, `ios`) and a scope (`all`, `desktop`, `mobile`); out-of-scope platforms are `skipped`. `generation.automatic` (Mobile app settings)
switches the automatic triggers; a person pressing Generate always works. `getAppsOverview` derives, per tab, whether manual generation is paused
(automatic running), enabled because automatic is stalled (no build service or failed), or enabled because automatic is off.

`lib/apps/`: `enqueue.ts` (`enqueueBuild`, `dispatchBuild`, `runBuildCron`), `callback.ts` (what the build service may report),
`store.ts` (`app_builds`, a platform-level collection whose rows carry their `companyId`), `overview.ts` (what the Apps page shows).
`markOnboardingStep` (`platform/onboarding/state.ts`) calls `enqueueBuild` the moment onboarding completes. A build is a row with
a status per platform (win, mac, linux). `dispatchBuild` starts `.github/workflows/desktop.yml`, which builds each platform with
`desktop/scripts/build-company.mjs`, publishes to the releases repository (`publish-build.mjs`) and POSTs to
`/api/apps/builds/callback` (bearer `DESKTOP_BUILD_SECRET`; only GitHub release download links are accepted). `/api/apps/builds/cron`
runs daily. What an installer bakes in (name, icon, address) is `PwaIdentity.buildHash`; everything else is read at run time.
The page is Workspace → Settings → Apps (`workspace/(protected)/settings/apps`).

### Desktop app

`desktop/` (own `package.json`, plain CommonJS, not part of the Next.js build) is an Electron shell for any workspace. The server gives it
two public-to-the-app endpoints on app hosts: `/api/desktop/branding` (the app identity from `lib/pwa/identity.ts`, so the same
Mobile app settings drive the desktop app) and `/api/desktop/notifications` (the signed-in person's unread items, polled with the
app's session because Electron has no Web Push). The app adds `SelfRunDesktop/<version>` to its user agent; the web app uses it
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
