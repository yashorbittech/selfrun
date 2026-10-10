# SelfRun Business

AI-powered business automation as a multi-tenant SaaS. A company signs up, gets its own workspace and website address, and
runs its whole business from one place: people, projects, sales, finance, procurement, training, documents, marketing and
support, with AI built into every panel.

One Next.js app and one MongoDB database serve three audiences:

| Who | What they use |
| --- | --- |
| **Visitors** | The product website: features, modules, pricing, resources, demo request and `/signup` |
| **Customers** (companies) | Their public website on `<slug>.<root domain>` or their own domain, and their panels (workspace, portal, …) on a separate app address |
| **Platform staff** | The Platform Panel: companies, plans, billing, coupons, domains, support and platform settings |

For what every panel does, see [docs/panels.md](./docs/panels.md). Architecture and deployment details are in
[docs/architecture.md](./docs/architecture.md) and [docs/deploy-vercel.md](./docs/deploy-vercel.md).

> **Next.js 16.** APIs and file conventions differ from older versions (for example `src/proxy.ts` replaces
> middleware). Read the relevant guide in `node_modules/next/dist/docs/` before writing framework-level code.
> See [AGENTS.md](./AGENTS.md).

## Contents

1. [Product overview](#product-overview)
2. [How it works](#how-it-works)
3. [Tech stack](#tech-stack)
4. [Third-party services and costs](#third-party-services-and-costs)
5. [Environment variables](#environment-variables)
6. [Run locally](#run-locally)
7. [Register a company](#register-a-company)
8. [Demo data](#demo-data)
9. [Deploy to production (Vercel)](#deploy-to-production-vercel)
10. [NPM scripts](#npm-scripts)
11. [Project structure](#project-structure)
12. [Architecture notes](#architecture-notes)
13. [Troubleshooting](#troubleshooting)
14. [Contributing](#contributing)

(The installable app and push notifications are described under [Mobile app and push notifications](#mobile-app-and-push-notifications).)

---

## Product overview

Every company gets the panels its plan includes. Panels are switched on or off per plan, and the platform staff manage the
plans and prices.

| Area | Panels |
| --- | --- |
| **Core** | Workspace (dashboard, users, roles, branding, domains, billing, audit log), Team Chat |
| **People and operations** | HR & Payroll, Projects, Procurement & Assets, Training, SOPs & Policies |
| **Sales and finance** | CRM & Sales (leads, pipeline, campaigns, offers, wallet), Finance |
| **Documents and knowledge** | Legal & Documents, Digi Locker, Online Tests |
| **AI** | AI Assistants (custom bots), AI Intelligence (ask questions about your business data) |
| **Marketing and web** | Social Media, SEO, Website (CMS) with a public site per company |
| **External users** | Client & Student Portal for clients, students, interns and applicants |
| **Help** | Help & Support: AI help chatbot, help center and support requests to the platform team |

Customer self-service: sign-up with email confirmation, a 30-day trial, plan upgrade and billing, add-ons, coupons, custom
domains with automatic TLS, and a starter website that is live from the first minute.

Platform staff: company registry, plans and prices, subscriptions, revenue metrics, invoices, coupons, add-ons, usage,
domains and SSL, support requests and help content, platform roles, audit log and integrations.

---

## How it works

Every company has **two addresses**: one for its **website** and one for its **panels**. The website host serves only the
website; the panels host serves only the panels. A page that belongs to the other side is redirected there.

| Who | Website (public pages only) | Panels (Workspace, HR, Finance, … and the portal) |
| --- | --- | --- |
| SelfRun Business | `selfrunbusiness.com`, `www.selfrunbusiness.com` (product website, `/signup`, `/login`) | `app.selfrunbusiness.com` (Platform Panel and Workspace for platform staff) |
| A customer on an automatic address | `<slug>.selfrunbusiness.com` | `<slug>-app.selfrunbusiness.com` |
| A customer with its own domain | `acme.com` | `app.acme.com` |
| Anything else | "No workspace here" | |

In development: `localhost:3000` is the product website and `app.localhost:3000` its panels; a customer is
`<slug>.localhost:3000` (website) and `<slug>-app.localhost:3000` (panels).

- **Operator company.** The first start creates the company that runs the product (flagged as the platform owner) and the
  first platform staff account. Staff sign in at `app.selfrunbusiness.com/workspace/login` and manage the product at `/platform`.
- **Customers are all equal.** A company registers at `/signup` and gets a Super Admin account, its panels and a starter
  website. Nothing is special-cased for any customer.
- **Tenancy.** Data lives in shared collections scoped by `companyId`; the database layer adds the scope automatically, so a
  query cannot see another company's rows.
- **Host routing.** `src/lib/saas/hosts.ts` decides which hosts serve the product (site and app); `src/proxy.ts` rewrites the
  product website's marketing paths to `/saas/*` and sends a page to the other side's host when it is requested on the wrong one
  (`src/lib/platform/tenancy/surfaces.ts`). Panels hosts are never indexed (`noindex`, `Disallow: /`).
- **Slugs.** A workspace address can't end in `-app` (that is the panels host of another address).

---

## Tech stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| Styling / UI | Tailwind CSS 4, shadcn-style components, Base UI, lucide-react, next-themes |
| Data | MongoDB (official driver, no ODM) |
| Charts / motion | Recharts, Framer Motion |
| Documents / exports | ExcelJS, `@react-pdf/renderer` |
| AI | OpenAI (Responses API, file search, image generation), ElevenLabs (voice) |
| Payments | Razorpay (subscriptions, payouts) |
| Storage | Vercel Blob (private) |
| Email | Resend |
| Hosting | Vercel (cron jobs in `vercel.json`) |

---

## Third-party services and costs

Everything the platform depends on outside this repository. "Required" means the product needs it to run; the rest switch on one feature each.
Prices change, so none are listed: the last column says how each one is billed. Keys for these services are listed under
[Environment variables](#environment-variables).

| # | Service | Used for | Required? | Cost | How it is billed |
| --- | --- | --- | --- | --- | --- |
| 1 | **Vercel** (server / hosting) | App, API, cron jobs, SSL, CDN, domains | Yes | Paid | Pro plan (per seat, monthly) plus bandwidth and function usage |
| 2 | **MongoDB Atlas** (database) | All data, every company's | Yes | Paid | Paid cluster (M10 or above), with storage and backups |
| 3 | **Vercel Blob** (storage) | Resumes, documents, chat attachments, voice files | Yes | Paid | GB stored plus transfer |
| 4 | **Resend** (email) | Verification, invitation, invoice and reminder emails | Yes | Free limit, then paid | Monthly plan after the free limit |
| 5 | **Razorpay** (payments) | SaaS subscriptions and payments | Yes | Per transaction | About 2% plus GST per transaction, no monthly fee |
| 6 | **Domain registrar** (your main domain) | The product address, `app.` and `*.` subdomains | Yes | Paid | Yearly |
| 7 | **Customers' custom domains** (e.g. `acme.com`) | A company's own address | When a company wants one | Paid by the customer | The customer's registrar fee. Your side: adding domains to the Vercel project (included in Pro) |
| 8 | **OpenAI** | AI chatbot, assistants, Intelligence, SOP and social-post generation, file search | When AI is used | Paid | Per token, plus vector-store storage |
| 9 | **ElevenLabs** | Voice / text to speech | When voice is used | Paid | Monthly plan or per character |
| 10 | **SMS provider** (MSG91, Twilio, Fast2SMS) | OTP and alerts | Not built in yet | Paid | Per SMS, once added |
| 11 | **RazorpayX** (payouts) | Direct payouts from Finance | Only for payouts | Paid | Per payout fee plus account |
| 12 | **GitHub Actions** | Desktop and mobile app builds | Only for apps | Free minutes, then paid | Private repositories get limited free minutes; Windows and macOS minutes count extra |
| 13 | **Apple Developer** | iOS app and macOS signing | Only for iOS / macOS apps | Paid | Yearly |
| 14 | **Google Play Developer** | Publishing the Android app | Only for the Android app | Paid | One time |
| 15 | **Windows code-signing certificate** | Removes the "unknown publisher" warning on the installer | Optional | Paid | Yearly |
| 16 | **TURN server** (Twilio, Metered, or your own coturn) | Team Chat calls across different networks | When calls are used | Paid | Per GB or server cost |
| 17 | **Error monitoring** (e.g. Sentry) | Catching production errors | Recommended, not built in | Free to paid | Monthly |
| 18 | **Uptime monitor** (UptimeRobot, Better Stack) | Alerts when the site is down | Recommended | Free to paid | Monthly |
| 19 | **Web Push** (VAPID keys) | Notifications for the app and the website | Yes | Free | Generate the keys once |
| 20 | **Google APIs** (Search Console, Indexing, OAuth) | SEO panel and Google sign-in | When SEO is used | Free | Service-account setup only |
| 21 | **Meta and LinkedIn APIs** | Social media publishing | When Social Media is used | Free | App review, no fee |
| 22 | **Tawk.to** (live chat) | Website live-chat widget | Optional | Free tier | Free tier |

The first running costs come from rows 1 to 6 and row 8. OpenAI is usage-based, so set AI limits on the plans.

---

## Environment variables

Copy `.env.example` to `.env` (git-ignored) and fill it in. Never commit real values, and never paste them into chat,
tickets or docs.

### Required

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string. Use a **new, empty** database; the database name is the URI path |
| `SAAS_ADMIN_EMAIL` | Email of the first platform staff account, created automatically on first start |

### Platform setup

| Variable | Purpose |
| --- | --- |
| `SAAS_ADMIN_PASSWORD` | Optional. Password for that account. If omitted, a temporary one is printed once in the server log. **Wrap it in quotes** if it contains `#` or spaces, otherwise `.env` treats the rest as a comment |
| `SAAS_HOSTS` | Production: comma-separated hosts serving the product website (`www.` variants are added). Required in production (it is the only thing that marks a host as the product's). Development: `localhost` is included |
| `PLATFORM_ROOT_DOMAIN` | Production: the domain under which company addresses live (`<slug>.<domain>`) |
| `PLATFORM_WILDCARD_SUBDOMAINS` | `1` once `*.<root domain>` is served by Vercel (see the deploy guide) |
| `PLATFORM_ENCRYPTION_KEY` | Encrypts platform secrets stored in the database. Generate once and keep it |
| `CRON_SECRET` | Bearer secret protecting cron endpoints |
| `NEXT_PUBLIC_APP_URL` | Public base URL |
| `SAAS_OPERATOR_NAME` | Optional legal name shown in the footer and legal pages |
| `SAAS_HELLO_EMAIL`, `SAAS_SALES_EMAIL`, `SAAS_SUPPORT_EMAIL`, `SAAS_SECURITY_EMAIL` | Optional public contact addresses |

### Storage, email, domains

| Variable | Purpose |
| --- | --- |
| `BLOB_READ_WRITE_TOKEN`, `BLOB_STORE_ID`, `BLOB_WEBHOOK_PUBLIC_KEY` | Vercel Blob (private store) for every file upload |
| `EMAIL_PROVIDER`, `RESEND_API_KEY`, `EMAIL_FROM` | Outgoing email (`console` only logs mail in development) |
| `DOMAIN_PROVIDER`, `VERCEL_API_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID` | Automatic custom-domain attach on Vercel |

### Feature keys (each is optional and enables one feature)

| Variable | Feature |
| --- | --- |
| `OPENAI_API_KEY`, `OPENAI_CHATBOT_VECTOR_STORE_ID`, `CHATBOT_CRAWL_BASE_URL`, `CHATBOT_ADMIN_API_SECRET` | AI chatbot, AI assistants, AI Intelligence and AI generation |
| `ELEVENLABS_API_KEY` | Voice mode |
| `HRMS_ENCRYPTION_KEY`, `FMS_ENCRYPTION_KEY`, `DLMS_ENCRYPTION_KEY`, `SMMS_ENCRYPTION_KEY` | Encryption of bank details, finance accounts, Digi Locker credentials and social tokens. Generate each with `openssl rand -base64 32` |
| `HRMS_API_SECRET`, `LEADS_API_SECRET`, `INDEXING_API_SECRET` | Bearer secrets for API and export endpoints |
| `HRMS_PAYOUT_PROVIDER`, `RAZORPAY_*` | Salary payouts and subscription billing |
| `MESSENGER_TURN_URL`, `MESSENGER_TURN_USERNAME`, `MESSENGER_TURN_CREDENTIAL`, `MESSENGER_CALL_MAX` | TURN relay for Team Chat calls |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Push notifications to the installed app. Generate the pair once with `npx web-push generate-vapid-keys`; `VAPID_SUBJECT` (a `mailto:` address) is optional and defaults to `SAAS_ADMIN_EMAIL` |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Search Console token |
| `META_*`, `GOOGLE_OAUTH_*`, `LINKEDIN_*` | Social publishing |

> Treat encryption keys as permanent once data is written. Do not change them without re-encrypting the stored data.

---

## Run locally

Requirements: Node.js 20.9 or newer, npm, and a MongoDB database (Atlas or local).

```bash
npm install
cp .env.example .env
# edit .env: set MONGODB_URI (a new empty database) and SAAS_ADMIN_EMAIL
npm run dev
```

On the first start the server creates the operator company and the staff account, and logs
`[saas] Platform operator … created`.

| URL | What you see |
| --- | --- |
| `http://localhost:3000` | The SelfRun Business website |
| `http://localhost:3000/signup` | Company sign-up |
| `http://app.localhost:3000/workspace/login` | Staff sign-in (panels host) |
| `http://app.localhost:3000/platform` | Platform Panel (staff only) |

`*.localhost` addresses resolve to your machine in Chrome; if your browser does not resolve them, add them to `/etc/hosts`.

---

## Register a company

1. Open `/signup`.
2. Enter the company name, workspace address (slug), work email, password and business categories, and accept the terms.
3. Confirm the email (in development with `EMAIL_PROVIDER=console`, the link is printed in the server log).
4. The company is created with a Super Admin account, a 30-day trial, its panels and a starter website.

Its website is `http://<slug>.localhost:3000` in development and `https://<slug>.<PLATFORM_ROOT_DOMAIN>` in production; its
panels are at `http://<slug>-app.localhost:3000` and `https://<slug>-app.<PLATFORM_ROOT_DOMAIN>`. After sign-up the owner is
signed in on the panels address.

---

## Mobile app and push notifications

There are two separate things:

1. **The app, for the company's team** (and its portal users): the **panels** (every `app.…` / `<slug>-app.…` address) are an
   installable app (PWA) with push notifications, so a business can be run from a phone.
2. **Website push, for the company's visitors**: the public website can ask visitors for notification permission and the
   business sends them offers, rewards and news. See [Website push](#website-push-for-a-companys-visitors) below.

A company's website is **not** an installable app: it has no manifest and no offline mode, only the opt-in bell.

| Where | How to install |
| --- | --- |
| Android, Windows, Linux, ChromeOS, macOS (Chrome, Edge, Brave, Opera, Samsung Internet) | The browser offers “Install app”; the app also shows its own Install button |
| iPhone and iPad (Safari) | Share → **Add to Home Screen** (push works only from the installed app, iOS/iPadOS 16.4+) |
| macOS Safari | File → **Add to Dock** |
| Firefox | Android: Add to Home screen. Desktop Firefox cannot install web apps but still gets push in the browser |

- **Every company's app is its own, and dynamic.** Name (`Acme — Workspace`), short name, logo or initials, status-bar colour
  (light and dark mode), splash background, start page, shortcuts and more all come from the company's branding and theme
  automatically, and a Super Admin can override each of them in **Workspace → Settings → Mobile app**: names, an app icon (the
  Branding logo, an uploaded icon or initials) with its background, custom colours, which panel the app opens on, up to 4
  long-press shortcuts, window style, orientation, the iPhone status bar and whether the install banner shows, with a live
  preview. Icons (including maskable ones for Android) are generated from these settings. The product's own panels host is
  “SelfRun Business — Workspace” and is fixed.
- **Offline.** Installed or not, a lost connection shows a friendly offline page. Pages and data are never cached, so a shared
  device never shows another person's data.
- **Push.** Business events, reminders, alerts, workflow updates, AI activity, messages and system notices that already appear in a
  panel's bell are also pushed to that person's devices: HR, Projects, Procurement, Training, Team Chat, SOPs, Digi Locker, SEO,
  Social, AI assistants, Online Tests, automations and the client portal.
- **Controls.** Each person opens Workspace → Notifications → **Settings** (portal: Notifications → Settings) to turn notifications on
  per device, switch each category on or off, set quiet hours with a time zone, send a test, and remove devices. Alerts ignore
  quiet hours; the in-app bell always shows everything.
- **Set up.** Set `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`, then redeploy. Without them push is simply off (the install button and
  everything else still work). Never change the pair later: every device would have to subscribe again.
- **Safety.** Subscriptions are per company and per person; only addresses of the real browser push services are accepted; a link in a
  notification can only point inside the app; dead subscriptions are removed automatically.

### Apps (generated for every company)

**Workspace → Settings → Apps & downloads** (Super Admin) is one place for all of a company's apps, in three tabs, plus the
settings that shape them (name, icon, colours, start page, shortcuts, desktop defaults). Everything is per company and dynamic.

| Tab | What it is | Output |
| --- | --- | --- |
| **PWA Application** (all devices) | The installable web app. Ready as soon as the workspace exists; no build | Address, QR code, install steps per device, live preview, asset pack |
| **Mobile Application** (Android & iOS) | A native shell that opens the workspace | Android APK and Android Studio project, Xcode project (you sign with your own Apple account), previews, asset packs |
| **Desktop Application** (Windows, Linux, macOS) | Electron apps | `.exe`, `.dmg`, `.AppImage`, `.deb` |

Every image the apps need is **generated from the company's own name, logo and colours** and previewed on the page: icons for every
density and size, Android adaptive and round icons, Play Store icon and feature graphic, the iOS icon set, splash screens, and the
desktop icons. Each tab has a downloadable asset pack (ZIP). Change the name, logo or colours and all of it follows.

**Two ways to generate.** Each of the Mobile and Desktop tabs shows both:

- **Automatic** (on by default, switchable): the moment a company completes onboarding, its apps are queued and handed to the
  build service (a GitHub Actions workflow); after a rename or new icon they are rebuilt; a daily job fills in anything missing.
  While an automatic build is running, the **Generate manually** button stays visible but paused, with a message saying why. If
  automatic generation isn't producing anything (the build service isn't connected, or the last build failed), the button becomes
  available with a message so the company can generate by hand. With automatic generation switched off, manual is the only way.
- **Manual**: the **Generate manually** button starts a build of that tab's apps right now.

Each platform of a build reports back and the download links appear on the Apps page, which updates while it waits. A daily
job generates apps for companies that finished onboarding earlier, restarts builds that never finished (up to 3 tries), and
rebuilds the apps when the company's name or icon changes (switchable).
Colours, shortcuts and the start page need no rebuild: every installed desktop app reads them from the server. One-time platform setup:
[docs/deploy-vercel.md](./docs/deploy-vercel.md#15-optional-automatic-desktop-and-mobile-apps). Until the build service is connected, builds wait in
the queue and start by themselves once it is.

### Desktop app (Windows, macOS, Linux)

`desktop/` is an Electron app that opens a company's workspace in its own window with a tray icon and native notifications. It is
**fully dynamic**: nothing about a company is built in. On every start it reads the company's name, icon, theme colours
(light/dark), start page and shortcuts from `/api/desktop/branding`, which uses the same settings as the mobile app (Workspace →
Settings → Mobile app). Use one generic app (it asks for the workspace address once) or build an installer for one company named and
iconed as that company: `cd desktop && npm install && npm run build:company -- --address acme`. Electron has no Web Push, so the
desktop app polls `/api/desktop/notifications` and shows native notifications while it runs (it can stay in the tray). Details,
security notes and the CI workflow (`.github/workflows/desktop.yml`): [desktop/README.md](./desktop/README.md). Building needs Node 22.

### Website push (for a company's visitors)

For each company, its public website (`<slug>.selfrunbusiness.com` or its own domain) can offer visitors notifications. The
business controls it in **CMS → Push notifications** (Super Admin or anyone with the CMS settings permission).

- **Off by default.** Turn on *Website notifications* and save. Visitors then see a small bell (and, after a delay you choose, a card)
  asking which topics they want: *Offers and deals*, *Credits and rewards*, *News and updates*, *Announcements*. They can change
  or turn it off from the same bell at any time. iPhone/iPad Safari can't receive push from a plain website, so the bell is hidden there.
- **Automatic.** When a festival offer campaign goes live, a reward or referral campaign is switched on, or a blog post is
  published, the matching topic is notified (each can be switched off).
- **Manual.** Compose a title and message, choose a topic and the page it opens, preview, confirm the audience size and send.
- **Controls.** A daily limit (default 3, manual and automatic together), topics on/off, the prompt text and delay.
- **Results.** Subscribers (total, per topic, new this week) and a history with delivered, failed and opened counts per send.
- **Privacy.** Subscribers are anonymous browsers (no name, email or account). Credits a *logged-in* client earns are pushed
  to that person in the app (Part 1), not through the website.
- **Safety.** Public endpoints exist only on website hosts and are rate limited; only real push-service addresses are
  accepted; links open pages of the site only.

---

## Demo data

One command fills a demo company with realistic data for every panel. It is for demos and development.

```bash
# 1. Register the demo company at /signup
# 2. Fill it
npm run demo:seeders                        # when it is the only customer company
npm run demo:seeders -- --company <slug>    # when there are several
```

- **Scoped to one company.** Everything is written through the company-scoped database; other companies and the operator
  company are never read or changed. The operator company is refused.
- **Safe to re-run.** It replaces the previous demo rows instead of duplicating them. Your own Super Admin login stays.
- **All panels:** HR and payroll, projects, CRM and offers, finance, procurement, training, team chat, SOPs, legal
  documents, Digi Locker, online tests, AI assistants, social media, SEO, website, portal and wallet, help and support.
  AI Intelligence answers from the same business data.
- **Logins.** The command prints the demo accounts per panel at the end; they use `example.com` addresses and one shared
  demo password, also printed there. Do not use this on a real company.
- **Plan.** A panel shows in the sidebar only if the company's plan includes it (Platform Panel → Companies).
- **AI assistants** get conversations and files as metadata only unless `OPENAI_API_KEY` is set.

To start over, use a new empty database (change `MONGODB_URI`) and register the company again.

---

## Deploy to production (Vercel)

1. Import the repository into Vercel.
2. Make `selfrunbusiness.com` the project's **production domain** (and `www.selfrunbusiness.com`). Add the wildcard
   `*.selfrunbusiness.com` (covers every `<slug>` and `<slug>-app` address) so every company gets a working HTTPS address.
3. Add environment variables for **Production**:
   - `MONGODB_URI` (a new, empty database), `SAAS_ADMIN_EMAIL`, `SAAS_ADMIN_PASSWORD` (quoted)
   - `SAAS_HOSTS` and `PLATFORM_ROOT_DOMAIN` (both `selfrunbusiness.com`)
   - `PLATFORM_ENCRYPTION_KEY`, `CRON_SECRET`, `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY`, `EMAIL_FROM`
   - the feature keys you use
4. **Redeploy** after any variable change; the running deployment does not pick them up otherwise.
5. Open `https://www.selfrunbusiness.com`. The first start creates the operator and logs it. Check `/`, `/pricing` and
   `/signup`.
6. Add the domain `app.selfrunbusiness.com` to the project too, then sign in at `https://app.selfrunbusiness.com/workspace/login`
   as the staff account, open `/platform`, and set up plans, prices and the Razorpay keys.
7. Register a test company and confirm both its website (`<slug>.selfrunbusiness.com`) and its panels
   (`<slug>-app.selfrunbusiness.com`) work.

Notes:

- Use MongoDB Atlas with Vercel's IPs allow-listed.
- Cron jobs in `vercel.json` register automatically. Protect them with `CRON_SECRET`.
- Local files under `uploads/` are not persistent on serverless hosting. Use Vercel Blob.
- Customers connect their own domains in Workspace → Settings → Domains; TLS is issued automatically.

Full guide, including DNS, email and payments: [docs/deploy-vercel.md](./docs/deploy-vercel.md).

Moving production from Vercel to one low-cost AWS server (EC2, Docker, Caddy, self-hosted MongoDB, in-app scheduler, `.env` file), including the end-to-end migration of every customer, database, file, subdomain and custom domain, with the code changes it needs: [docs/deploy-aws.md](./docs/deploy-aws.md).

Self-hosting: `npm run build && npm start` (port 3000; set `PORT` to change), and schedule the cron endpoints.

---

## NPM scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server on port 3000 |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run demo:seeders` | Fill a demo company with realistic data for every panel |

`demo:seeders` loads `.env` automatically.

---

## Project structure

```
src/
  app/
    saas/              Product website (served on SaaS hosts through proxy rewrites)
    (platform)/        Sign-up, Platform Panel, workspace-not-found
    (site)/            Customer public website (CMS-driven)
    workspace/ hrms/ pms/ prms/ tms/ fms/ lms/ messenger/ sop/ lpms/ dlms/ ots/ aibots/
    intelligence/ smms/ seo/ cms/ support/
    portal/            External user portal
    api/               Route handlers
  components/          UI by area
  lib/
    saas/              Brand, hosts, routes, theme, content and bootstrap of the product site
    platform/          Tenancy, companies, billing, panel registry, domains, website starter
    cms/               CMS collections, theme, content
    …                  One folder per module
  instrumentation.ts   First-start operator setup
  proxy.ts             Request proxy (host routing and rewrites)
desktop/               Electron desktop app and per-company build script
mobile/                Android and iOS app build script (Capacitor)
scripts/
  demo-seeders.ts      The demo data command
  demo/                Demo data modules, one per panel
  test-*.ts, e2e/      Verification scripts
public/selfrun/        Logo, mark and favicon
docs/                  Architecture and deployment guides
```

---

## Architecture notes

- **Identity.** Internal users have a `roles` array per panel; external people sign in through the portal. Sessions are
  separate cookies per panel, with single sign-on across the panels a user has a role in. Platform staff have their own
  platform roles.
- **Plans and panels.** The Panel Registry lists every panel with its name, route and on/off state; plans decide which
  panels a company gets.
- **Audit fields.** Documents use string ids and shared fields (`createdAt`, `updatedAt`, `createdBy`, `updatedBy`,
  `deletedAt` for soft delete).
- **No multi-document transactions.** Atomicity comes from single-document updates with guard filters.
- **Caching.** Company and CMS lookups are cached (up to an hour). After editing the database directly, restart the
  server and clear `.next` to see changes immediately.
- **Server/client split.** Files importing `server-only` must not be imported by client components.
- **Brand.** The product brand lives in `src/lib/saas/brand.ts`; a customer's own wordmark is rendered by `brandify()` in
  `src/lib/brand.tsx` from its Branding settings.

More detail: [docs/architecture.md](./docs/architecture.md).

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Production site shows a 404 with a small monogram header | The host is not recognised as a SaaS host. Set `SAAS_HOSTS` and `PLATFORM_ROOT_DOMAIN`, make the domain the production domain, then redeploy |
| Staff cannot sign in | A `#` in an unquoted `SAAS_ADMIN_PASSWORD` truncates it. Quote the value and restart |
| `localhost:3000/platform` redirects to `app.localhost:3000/platform` | Expected: panels are never served on the website host. Sign in there as the staff account from `SAAS_ADMIN_EMAIL` |
| `E11000 duplicate key` on first start | Drop the new database and start again; the setup guards against the race |
| A page shows empty data after a direct database change | Restart the server and delete `.next` (cached lookups) |
| A panel is missing from a company's sidebar | The company's plan does not include it (Platform Panel → Companies → plan) |
| Bank details cannot be saved | Set the matching `*_ENCRYPTION_KEY` |
| Chatbot unavailable | Set `OPENAI_API_KEY`, then re-index from CRM → Chatbot |
| Calls connect only on the same network | Add a TURN server through the `MESSENGER_TURN_*` variables |
| Build fails with a missing `.next/server/*manifest` | Another process touched `.next` during the build; stop it and rebuild |
| `demo:seeders` cannot connect | Check `MONGODB_URI` and the Atlas IP allow-list |

---

## Contributing

- Read [AGENTS.md](./AGENTS.md); check `node_modules/next/dist/docs/` before writing framework code.
- Match the surrounding code: naming, comment density and UI patterns.
- When you add a module that shows data, add demo data for it in `scripts/demo/` and call it from
  `scripts/demo-seeders.ts`, so demos never show blank sections.
- Before shipping run `npm run lint` and `npm run build`, and check that the build's exit code is 0
  (`tsc --noEmit` alone is not a reliable gate here).
- Commit only source and docs. Never commit `.env`, uploaded files or credentials.
