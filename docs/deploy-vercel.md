# Deploying SelfRun Business on Vercel

A step-by-step guide to put the platform live at **www.selfrunbusiness.com**, with every customer getting their own address
`https://<their-name>.selfrunbusiness.com`. Follow the steps in order. Each step says what to do, where to click, and how to
check that it worked.

**Customers need none of this.** They sign up on your website, get their address automatically, and can connect their own
domain later from Workspace → Settings → Domains.

---

## Before you start: how it works (2 minutes)

Every company has **two addresses**: one for its public **website** and one for its **panels** (Workspace, HR, Finance, the
client portal and the rest). The website address shows only the website. The panels address shows only the panels. If someone
opens a panel URL on the website address (or a website page on the panels address), they are redirected to the right one.

| Who | Website | Panels |
| --- | --- | --- |
| SelfRun Business | `selfrunbusiness.com`, `www.selfrunbusiness.com` (product website, `/signup`, `/login`) | `app.selfrunbusiness.com` (Platform Panel for staff) |
| A customer, automatic address | `acme.selfrunbusiness.com` | `acme-app.selfrunbusiness.com` |
| A customer, own domain | `acme.com` | `app.acme.com` |
| Anything else | "No workspace here" | |

Two settings drive this:

- `SAAS_HOSTS`: the product's website hosts (`selfrunbusiness.com`). The panels host `app.selfrunbusiness.com` is derived from it.
- `PLATFORM_ROOT_DOMAIN`: the domain under which every company's automatic addresses live (`selfrunbusiness.com`).

More background: [architecture.md](./architecture.md).

### What you need

| Item | Why |
| --- | --- |
| A Vercel account and this repository on GitHub, GitLab or Bitbucket | Hosting |
| The domain `selfrunbusiness.com` (you own it) | The product address |
| A MongoDB Atlas account | The database |
| A Vercel Blob store | File uploads |
| A Resend account | Sign-up confirmation and notification emails |
| A Razorpay account (can wait until after launch) | Charging companies for plans |
| An OpenAI API key (optional) | AI features |

---

## Step 1. Create the database (MongoDB Atlas)

1. Sign in to MongoDB Atlas and create a **new cluster** (or use an existing one).
2. **Database Access** → **Add New Database User**. Choose a username and a strong password, role *Read and write to any
   database*. Save them somewhere safe.
3. **Network Access** → **Add IP Address** → **Allow access from anywhere** (`0.0.0.0/0`). Vercel does not have fixed IP
   addresses, so this is required.
4. **Database** → **Connect** → **Drivers**. Copy the connection string. It looks like
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/`.
5. Add the database name at the end, for example `.../selfrun`, so the value becomes
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/selfrun`. Replace `<user>` and `<password>` with your own.

> Use a **new, empty** database. Do not reuse a database from another product. On the first start the platform sets itself up.
> If your password contains special characters (`@`, `#`, `/`, `:`), URL-encode them (for example `@` becomes `%40`).

**Check:** you have one connection string ending in `/selfrun`. This is your `MONGODB_URI`.

---

## Step 2. Create the file storage (Vercel Blob)

1. In Vercel go to **Storage** → **Create** → **Blob**.
2. Choose access **Private**. This cannot be changed later.
3. Create it, then open the store and copy its **Read/Write token**. This is your `BLOB_READ_WRITE_TOKEN`.

**Check:** you have a token that starts with `vercel_blob_rw_`.

---

## Step 3. Generate the secret keys

Open a terminal and run this command **six times**, saving each result separately:

```bash
openssl rand -base64 32
```

Use the six values for:

| Variable | Protects |
| --- | --- |
| `PLATFORM_ENCRYPTION_KEY` | Secrets the platform stores (payment keys, provider tokens) |
| `HRMS_ENCRYPTION_KEY` | Employee bank details |
| `FMS_ENCRYPTION_KEY` | Company bank account numbers |
| `DLMS_ENCRYPTION_KEY` | Digi Locker passwords and credentials |
| `SMMS_ENCRYPTION_KEY` | Social media account tokens |
| `CRON_SECRET` | The scheduled jobs (Vercel sends it to them) |

> **Keep these keys forever.** If you lose or change one of the encryption keys, the data it encrypted can no longer be read.
> Store them in a password manager. Use a different set for production than for local development.

---

## Step 4. Import the project into Vercel

1. In Vercel click **Add New… → Project** and pick this repository.
2. Framework preset: **Next.js** (detected automatically). Leave build settings as they are.
3. Do **not** deploy yet. First add the environment variables in Step 5. (If it already deployed, that is fine: you will
   redeploy after adding them.)

---

## Step 5. Add the environment variables

Vercel → your project → **Settings** → **Environment Variables**. Add each of these for **Production**.

### Required

| Variable | Value |
| --- | --- |
| `MONGODB_URI` | The connection string from Step 1 |
| `SAAS_ADMIN_EMAIL` | The email you will use as the first platform staff account |
| `SAAS_ADMIN_PASSWORD` | A strong password for that account. If you leave it out, a temporary one is printed once in the logs |
| `SAAS_HOSTS` | `selfrunbusiness.com` |
| `PLATFORM_ROOT_DOMAIN` | `selfrunbusiness.com` |
| `PLATFORM_ENCRYPTION_KEY` | From Step 3 |
| `HRMS_ENCRYPTION_KEY` | From Step 3 |
| `FMS_ENCRYPTION_KEY` | From Step 3 |
| `DLMS_ENCRYPTION_KEY` | From Step 3 |
| `SMMS_ENCRYPTION_KEY` | From Step 3 |
| `CRON_SECRET` | From Step 3 |
| `BLOB_READ_WRITE_TOKEN` | From Step 2 |
| `NEXT_PUBLIC_APP_URL` | `https://www.selfrunbusiness.com` |

### Email (needed for sign-up confirmation)

| Variable | Value |
| --- | --- |
| `EMAIL_PROVIDER` | `resend` |
| `RESEND_API_KEY` | Your Resend API key (Step 9) |
| `EMAIL_FROM` | `SelfRun Business <no-reply@selfrunbusiness.com>` |

### Push notifications (the installed app)

| Variable | Value |
| --- | --- |
| `VAPID_PUBLIC_KEY` | From `npx web-push generate-vapid-keys` (run it once, on your computer) |
| `VAPID_PRIVATE_KEY` | The matching private key. Keep it secret and never change the pair later |
| `VAPID_SUBJECT` | Optional, e.g. `mailto:support@selfrunbusiness.com` (defaults to `SAAS_ADMIN_EMAIL`) |

Without these two keys the app still installs and works, but push notifications are switched off.

### Optional (add when you need the feature)

| Variable | Feature |
| --- | --- |
| `OPENAI_API_KEY` | AI chatbot, assistants, Intelligence, generation |
| `RAZORPAY_BILLING_WEBHOOK_SECRET` | Billing webhook signature (Step 11) |
| `PLATFORM_WILDCARD_SUBDOMAINS` | `1` once the wildcard domain works (Step 7, option A) |
| `DOMAIN_PROVIDER`, `VERCEL_API_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID` | Connecting domains automatically (Step 10) |

> In the Vercel dashboard type values **without quotes**. (In a local `.env` file, put quotes around a password that contains
> `#` or spaces, otherwise the rest of the line is treated as a comment.)
>
> **A change to any variable only takes effect after a redeploy.** Always redeploy after editing them.

**Check:** all required variables are listed under *Production*.

---

## Step 6. Add your domain in Vercel

1. Vercel → your project → **Settings** → **Domains** → **Add**.
2. Add `www.selfrunbusiness.com` and choose **Production**. Make it the primary domain.
3. Add `selfrunbusiness.com` and set it to **redirect to** `www.selfrunbusiness.com` (or the other way round; either works).
4. Add `app.selfrunbusiness.com` (no redirect). This is where the platform staff and, later, you sign in to the Platform Panel.
5. Vercel shows the DNS records to create. Keep this page open for Step 7.

> The platform treats the project's production domain as a product-website host automatically. Setting `SAAS_HOSTS` too is
> still recommended, as a safety net.

---

## Step 7. Point your DNS and add the wildcard

Every company gets two addresses, `<name>.selfrunbusiness.com` (website) and `<name>-app.selfrunbusiness.com` (panels). For
both to work over HTTPS, Vercel needs a **wildcard** domain `*.selfrunbusiness.com` (it covers every `<name>` and every
`<name>-app`). Pick **one** of the two options.

### Option A (recommended): move the DNS to Vercel

This makes every new company's address work instantly, with nothing to attach per company.

1. **Write down every DNS record** you have today at your domain registrar (A, CNAME, MX, TXT for SPF, DKIM and verification).
   Take a screenshot. Email stops working if you forget the MX and TXT records.
2. In Vercel → **Domains** → `selfrunbusiness.com` → **DNS Records**, recreate those records (skip the A/CNAME records that
   Vercel manages for this project).
3. In Vercel add the wildcard domain `*.selfrunbusiness.com` to the project (together with `app.selfrunbusiness.com` from Step 6).
4. At your registrar, change the **nameservers** to `ns1.vercel-dns.com` and `ns2.vercel-dns.com`.
   If the registrar blocks the change, turn off DNSSEC for the domain first. Propagation takes from a few minutes to 48 hours.
5. When all three domains show **Valid Configuration** in Vercel, add `PLATFORM_WILDCARD_SUBDOMAINS` = `1` and redeploy.

### Option B: keep your registrar's DNS (no wildcard certificate)

1. At the registrar add a **CNAME** record: Host `*`, Value = the CNAME Vercel shows for the project
   (`cname.vercel-dns.com` also works). Add the `www` and `app` records Vercel asks for as well.
2. Do **not** set `PLATFORM_WILDCARD_SUBDOMAINS`. Instead complete Step 10 (`DOMAIN_PROVIDER=vercel` and the Vercel token).
   Each new company's two addresses (`<name>` and `<name>-app`) are then added to the project through the Vercel API when it
   registers.
3. Limits to know: a brand-new workspace can show a certificate warning for a short while, every company counts **two**
   domains toward your plan's domain limit, and an unknown `nope.selfrunbusiness.com` shows a certificate error instead of "No workspace here".

**Check:** `https://www.selfrunbusiness.com` opens with a valid HTTPS certificate (it may show an error page until you deploy
in Step 8). With option A, `https://anything.selfrunbusiness.com` shows the platform's "No workspace here" page over HTTPS,
which proves the wildcard works.

---

## Step 8. Deploy

1. Vercel → **Deployments** → open the latest one → **⋯ → Redeploy** (or push a commit).
2. Wait until the status is **Ready**.
3. Open **Logs** (Runtime Logs) and look for the line `[saas] Platform operator … created`. This confirms the first-start setup
   created your operator company, your staff account and the panel list.

**Check:** `https://www.selfrunbusiness.com` shows the SelfRun Business website, and `/pricing` and `/signup` open.
`https://www.selfrunbusiness.com/platform` redirects to `https://app.selfrunbusiness.com/platform` (panels never open on the
website address).

If you see a 404 with a small monogram header, the host is not recognised: re-check `SAAS_HOSTS`, make sure the domain is the
production domain (Step 6) and redeploy.

---

## Step 9. Set up email (Resend)

Sign-up confirmation, "workspace ready", invitations and approvals are sent through Resend.

1. In Resend → **Domains** → **Add Domain** → `selfrunbusiness.com`.
2. Resend lists DNS records (SPF, DKIM and optionally DMARC). Add them where your DNS lives (Vercel DNS if you chose option A,
   otherwise your registrar).
3. Click **Verify** in Resend until the domain shows *Verified*.
4. **API Keys** → create a key → set it as `RESEND_API_KEY` in Vercel, then redeploy.
5. Make sure `EMAIL_FROM` uses an address on the verified domain.

With `EMAIL_PROVIDER=console` mail is only written to the logs (useful in development, not in production).

---

## Step 10. Connect domains automatically (optional)

Needed for **Option B** in Step 7, and for letting customers connect their own domains. Skip it if you use Option A and do not
offer custom domains.

1. In Vercel → **Account Settings** → **Tokens** → create a token (scoped to the team that owns the project). This is
   `VERCEL_API_TOKEN`.
2. Project → **Settings** → **General** → copy the **Project ID** (`VERCEL_PROJECT_ID`). If the project belongs to a team, also
   copy the **Team ID** (`VERCEL_TEAM_ID`).
3. Add `DOMAIN_PROVIDER` = `vercel` and the three values above in Vercel, then redeploy. These can also be saved in
   Platform Panel → Integrations.

How a customer then uses it: Workspace → Settings → Domains → enter their domain (for example `acme.com`) → the page shows the
exact DNS records to create (an ownership TXT record, the routing record for the website, and the routing record for
`app.acme.com`, where their panels will live) and checks them → TLS is issued automatically. You can see every company's
domains in Platform Panel → Domains & SSL.

---

## Step 11. Set up payments (Razorpay)

This is how the platform charges companies for plans. It can wait until after launch; until then, plans can be free or granted
as complimentary.

1. Create your API keys in Razorpay, then open **Platform Panel → Payments & Razorpay** and enter the Key ID and Key Secret.
   They are stored encrypted.
2. In Razorpay → **Webhooks** → add `https://www.selfrunbusiness.com/api/platform/billing/webhook` and choose a secret.
3. Put the same secret into Vercel as `RAZORPAY_BILLING_WEBHOOK_SECRET`, then redeploy.

A company that wants to collect payments from **its own customers** connects its own Razorpay account in
Workspace → Settings → Payments; that page shows the company's webhook URLs.

---

## Step 12. First sign-in and platform set-up

1. Open `https://app.selfrunbusiness.com/workspace/login`.
2. Sign in with `SAAS_ADMIN_EMAIL` and `SAAS_ADMIN_PASSWORD` (or the temporary password from the logs).
3. Open `/platform` (the Platform Panel). Then:
   - **Plans**: review plans and prices, and which panels each plan includes.
   - **Platform settings**: platform name, support details, seller details for invoices, and the **sign-up mode**
     (open, approval or closed).
   - **Payments**: Razorpay keys (Step 11).
   - **Integrations**: email and domain providers, if you prefer saving them here rather than in environment variables.

---

## Step 13. Test the whole flow

Do this once after every first deployment.

1. Open `https://www.selfrunbusiness.com/signup`. The address field shows `.selfrunbusiness.com` next to it.
2. Register a **test company**. The confirmation email arrives, and its link signs you in at
   `https://<slug>-app.selfrunbusiness.com/workspace/onboarding`.
3. `https://<slug>.selfrunbusiness.com` shows only the company's public website. `https://<slug>.selfrunbusiness.com/workspace`
   redirects to `https://<slug>-app.selfrunbusiness.com/workspace`, and `https://<slug>-app.selfrunbusiness.com/` goes to the
   Workspace.
4. `https://nope.selfrunbusiness.com` shows "No workspace here".
5. Workspace → Settings → Domains lists `<slug>.selfrunbusiness.com` as the primary address and shows the panels address. If
   Step 10 is done, add a test custom domain and watch it verify.
6. Register a second test company and check that it shows none of the first company's data.
7. **App and push** (on a phone and a computer): open `https://<slug>-app.selfrunbusiness.com` and install the app (Android/desktop:
   Install; iPhone/iPad: Share → Add to Home Screen). Open **Notifications → Settings**, tap **Turn on notifications**, then
   **Send a test**. `https://<slug>.selfrunbusiness.com` (the website) must show no install option.
8. **Website push** (visitors): in the company's panels open **CMS → Push notifications**, turn on *Website notifications* and save.
   On `https://<slug>.selfrunbusiness.com` a bell appears; allow notifications, choose topics, then send a notification from the CMS
   page and check it arrives and opens the page.
9. (Optional) Fill the test company with demo data: put the production `MONGODB_URI` in a local `.env` and run
   `npm run demo:seeders -- --company <slug>`. Only do this for a throwaway test company.

---

## Desktop and mobile apps (automatic builds)

Every company gets Windows, macOS, Linux, Android and iOS apps built for it automatically when it completes onboarding (and again when
its name or icon changes), with no manual step; a company can also press **Generate manually** on the Apps page. The platform hands each build to a **GitHub Actions workflow**
(`.github/workflows/desktop.yml`), which builds the platforms in parallel (desktop with Electron, Android and iOS with Capacitor; Android needs only a standard Linux runner), publishes the files to a **public releases
repository** and reports the download links back. Android gives a ready-to-install debug-signed APK plus the Android Studio project; iOS gives the Xcode project (iPhone apps need the company's own Apple signing). Set this up once:

1. **Releases repository.** Create a **public** GitHub repository for the installers, for example `your-org/selfrun-desktop-releases`
   (it can be empty). Public so a company's people can download without a GitHub account. Installers contain only a company's name,
   icon and public app address.
2. **In the code repository** (Settings → Secrets and variables → Actions):
   - secret `DESKTOP_BUILD_SECRET`: a long random value (`openssl rand -base64 32`); the same value goes to Vercel in step 3;
   - secret `RELEASES_TOKEN`: a token that can create releases in the releases repository (a fine-grained personal access token,
     *Contents: Read and write* on that repository only);
   - variable `DESKTOP_RELEASES_REPO`: `your-org/selfrun-desktop-releases`.
3. **In Vercel** (Production) add: `GITHUB_REPOSITORY` (`owner/repo` of the code repository), `GITHUB_DISPATCH_TOKEN` (a fine-grained
   token with *Actions: Read and write* on the code repository), `DESKTOP_BUILD_SECRET` (the value from step 2) and optionally
   `DESKTOP_RELEASES_REPO` (only links from that repository are accepted). Then redeploy. `GITHUB_WORKFLOW_FILE` (default `desktop.yml`)
   and `GITHUB_WORKFLOW_REF` (default `main`) are optional.
4. **Check.** Complete onboarding for a test company, open Workspace → Settings → Apps. It shows "Building your apps" and, about
   10 to 20 minutes later, download buttons for Windows, macOS, Linux, Android and iOS. The workflow run is linked as "Build log".

Until step 3 is done, builds wait in the queue ("Waiting for the build service") and start by themselves once it is. Costs: GitHub
Actions minutes (macOS minutes cost more); a build runs only when a company finishes onboarding or changes its name or icon. The
installers are not code-signed until you add certificates (see `desktop/README.md`), so macOS and Windows show a warning on first open.
Optional: `DESKTOP_DOWNLOAD_URL` (a page with the generic installer; `{address}` is replaced by the company's app address) is shown
as "Need it right now?" on the Apps page.

---

## Scheduled jobs (cron)

`vercel.json` registers ten daily jobs. They run automatically after deployment and are protected by `CRON_SECRET`.

| Job | Time (UTC) | Does |
| --- | --- | --- |
| `/api/wallet/expiry-sweep` | 02:30 | Expires wallet credits |
| `/api/sop/cron` | 03:00 | SOP review and acknowledgement upkeep |
| `/api/seo/cron` | 03:30 | SEO audits and rank checks |
| `/api/dlms/cron` | 04:00 | Digi Locker expiry alerts |
| `/api/smms/cron` | 04:30 | Scheduled social posts |
| `/api/ots/cron` | 05:00 | Test deadlines and auto-submission |
| `/api/platform/domains/cron` | 05:30 | Re-checks custom domains |
| `/api/platform/billing/trials/cron` | 06:00 | Trial reminders and expiry |
| `/api/platform/billing/subscriptions/cron` | 06:00 | Renewals and grace periods |
| `/api/apps/builds/cron` | 07:00 | Generates missing desktop apps, restarts stuck builds, rebuilds after a rename or new icon |

Vercel's Hobby plan allows daily schedules only; these are all daily. See Vercel → **Settings → Cron Jobs** to confirm they
are registered.

---

## Troubleshooting

| Problem | Cause and fix |
| --- | --- |
| 404 with a small monogram header on the main domain | The host is not a product-website host. Set `SAAS_HOSTS=selfrunbusiness.com`, make the domain the production domain, redeploy |
| Staff cannot sign in | Sign in at `https://app.selfrunbusiness.com/workspace/login` (not on `www`). Check `SAAS_ADMIN_EMAIL` and `SAAS_ADMIN_PASSWORD` for typos, fix and redeploy |
| `app.selfrunbusiness.com` shows a certificate error or "not found" | Add `app.selfrunbusiness.com` to the project (Step 6) and, for option B, its DNS record |
| A company's panels address (`<slug>-app…`) shows a certificate error | The wildcard is not active (Step 7), or with option B the address was not attached yet |
| No `[saas] Platform operator … created` in the logs | `SAAS_ADMIN_EMAIL` or `MONGODB_URI` is missing or wrong. Check them and redeploy |
| `E11000 duplicate key` in the first-start logs | A race on the very first start. Redeploy once; if it persists, use a fresh empty database |
| Company address shows `localhost` | `PLATFORM_ROOT_DOMAIN` is missing. Set it and redeploy. The log shows `[tenancy] PLATFORM_ROOT_DOMAIN is not set` meanwhile |
| "No workspace here" on `<slug>.selfrunbusiness.com` | The company is suspended (Platform Panel → Companies), the slug is wrong, or the wildcard domain is missing |
| Certificate error on a new subdomain | The wildcard is not active yet (Step 7) |
| Sign-up email never arrives | `EMAIL_PROVIDER` is `console`, the Resend domain is not verified, or `EMAIL_FROM` is on another domain (Step 9) |
| Uploads fail | `BLOB_READ_WRITE_TOKEN` is missing, or the Blob store is not private |
| Bank details cannot be saved | The matching `*_ENCRYPTION_KEY` is missing |
| AI features say they are unavailable | `OPENAI_API_KEY` is not set |
| Header or menu changes show late | Public navigation is cached for up to an hour; publishing in the CMS or redeploying refreshes it |
| Changes to a variable do nothing | Variables apply only after a redeploy |

---

## About the Free (Hobby) plan

Two things worth knowing, independent of this code: Vercel's Hobby plan is meant for personal, non-commercial projects, and a
SaaS that bills customers normally belongs on Pro (check Vercel's current terms). Hobby also has lower limits (function
duration, domains, team members). The code works on either; it does not need Pro-only features.
