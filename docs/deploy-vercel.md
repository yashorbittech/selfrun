# Deploying SelfRun Business on Vercel: the complete step-by-step guide

This guide takes you from nothing to a live platform at **www.selfrunbusiness.com**, where every customer gets their own website
address and their own app address. Every step is broken into small actions (1.1, 1.2, …). After each group there is a
**✅ Checkpoint** that tells you exactly what you should see before you continue. If a checkpoint does not match, stop and use
the [Troubleshooting](#troubleshooting) table at the end.

Time needed: about 2 to 3 hours the first time (most of it waiting for DNS). Customers need none of this: they sign up on your
website and everything is created for them.

**How to read this guide**

| Mark | Meaning |
| --- | --- |
| **1.1**, **1.2** … | Micro-steps. Do them in order, one at a time |
| ⏱ | Time the step takes, whether it is required, and what you get from it |
| > ✅ **Checkpoint** | What you must see before you continue |
| > [!WARNING] | Something that can lose data or money if you ignore it |
| `code` | A value to type or copy exactly |


---

## Contents

0. [Understand the setup (read once)](#0-understand-the-setup-read-once)
1. [Collect your accounts and notes](#1-collect-your-accounts-and-notes)
2. [Create the database (MongoDB Atlas)](#2-create-the-database-mongodb-atlas)
3. [Create the file storage (Vercel Blob)](#3-create-the-file-storage-vercel-blob)
4. [Generate your secret keys](#4-generate-your-secret-keys)
5. [Create the Vercel project](#5-create-the-vercel-project)
6. [Add the environment variables](#6-add-the-environment-variables)
7. [Add your domains in Vercel](#7-add-your-domains-in-vercel)
8. [Point your DNS](#8-point-your-dns)
9. [Deploy and check the first start](#9-deploy-and-check-the-first-start)
10. [Set up email (Resend)](#10-set-up-email-resend)
11. [First sign-in and Platform Panel setup](#11-first-sign-in-and-platform-panel-setup)
12. [Test the whole flow](#12-test-the-whole-flow)
13. [Optional: payments (Razorpay)](#13-optional-payments-razorpay)
14. [Optional: customers' own domains](#14-optional-customers-own-domains)
15. [Optional: automatic desktop and mobile apps](#15-optional-automatic-desktop-and-mobile-apps)
16. [Scheduled jobs](#16-scheduled-jobs-cron)
17. [Troubleshooting](#troubleshooting)
18. [Appendix: every variable at a glance](#appendix-every-variable-at-a-glance)

---

## The road map at a glance

| # | What you do | Time | Required? | You get |
| --- | --- | --- | --- | --- |
| 1 | Collect accounts and notes | 10 min | Yes | A notes file |
| 2 | MongoDB Atlas database | 15 min | Yes | `MONGODB_URI` |
| 3 | Vercel Blob storage | 5 min | Yes | `BLOB_READ_WRITE_TOKEN` |
| 4 | Generate secret keys | 10 min | Yes | 6 keys, push keys, staff login |
| 5 | Create the Vercel project | 5 min | Yes | A project |
| 6 | Add environment variables | 20 min | Yes | Configured app |
| 7 | Add 4 domains in Vercel | 10 min | Yes | Domains attached |
| 8 | Point DNS | 15 min + wait | Yes | HTTPS addresses |
| 9 | Deploy and check | 10 min | Yes | **Your live website** |
| 10 | Email (Resend) | 20 min | For sign-up emails | `RESEND_API_KEY` |
| 11 | First sign-in and Platform Panel | 10 min | Yes | Plans and settings |
| 12 | Test the whole flow | 30 min | Recommended | Proof it works |
| 13 to 15 | Payments, customers' domains, automatic apps | 20 + 15 + 40 min | Optional | Extras |

> [!TIP]
> Steps 1 to 9 put the product website live. You can stop after step 9 and come back for the rest.

---

## 0. Understand the setup (read once)

⏱ *read only · 3 min*

Every company, including yours, has **two addresses**: one for its public **website** and one for its **panels** (Workspace, HR,
Finance, the client portal and the rest). The website address shows only the website. The panels address shows only the panels.
Open a panel URL on the website address and you are sent to the panels address automatically.

| Who | Website address | Panels address |
| --- | --- | --- |
| SelfRun Business (you) | `selfrunbusiness.com` and `www.selfrunbusiness.com` (product website, `/signup`, `/login`) | `app.selfrunbusiness.com` (Platform Panel for your staff) |
| A customer on an automatic address | `acme.selfrunbusiness.com` | `acme-app.selfrunbusiness.com` |
| A customer with its own domain | `acme.com` | `app.acme.com` |
| Any other address | "No workspace here" | |

Two settings drive this:

- `SAAS_HOSTS`: the website addresses of the product itself (`selfrunbusiness.com`). `app.selfrunbusiness.com` is derived from it.
- `PLATFORM_ROOT_DOMAIN`: the domain under which every company's automatic addresses live (`selfrunbusiness.com`).

Words used below:

- **Vercel**: where the app runs.
- **MongoDB Atlas**: where the data lives.
- **DNS**: the settings at your domain provider that say which server a name points to.
- **Redeploy**: build and publish the app again. Required after changing any environment variable.

More background: [architecture.md](./architecture.md).

---

## 1. Collect your accounts and notes

⏱ *10 min · required · you get: an organised notes file*

Open a notes file (a password manager is best). You will paste values into it as you go. Do not share it.

- **1.1** Make sure you have these accounts. Create any that are missing now:

  | Account | Needed for | Required? |
  | --- | --- | --- |
  | Vercel (vercel.com) | Hosting | Yes |
  | GitHub, GitLab or Bitbucket, with this repository in it | Vercel deploys from it | Yes |
  | MongoDB Atlas (mongodb.com/atlas) | Database | Yes |
  | Your domain `selfrunbusiness.com`, and login to the place you bought it | Addresses | Yes |
  | Resend (resend.com) | Sign-up and notification emails | Yes for sign-up emails |
  | OpenAI (platform.openai.com) | AI features | Optional |
  | Razorpay | Charging companies for plans | Optional, can wait |

- **1.2** In your notes file create empty lines for the values you will collect:

  ```
  MONGODB_URI            =
  BLOB_READ_WRITE_TOKEN  =
  PLATFORM_ENCRYPTION_KEY=
  HRMS_ENCRYPTION_KEY    =
  FMS_ENCRYPTION_KEY     =
  DLMS_ENCRYPTION_KEY    =
  SMMS_ENCRYPTION_KEY    =
  CRON_SECRET            =
  VAPID_PUBLIC_KEY       =
  VAPID_PRIVATE_KEY      =
  RESEND_API_KEY         =
  SAAS_ADMIN_EMAIL       =
  SAAS_ADMIN_PASSWORD    =
  ```

> ✅ **Checkpoint:** you can sign in to Vercel, Atlas and your domain provider, and your notes file has the empty lines above.

---

## 2. Create the database (MongoDB Atlas)

⏱ *15 min · required · you get: `MONGODB_URI`*

Use a **new, empty** database. Never reuse a database from another product. On the first start the platform sets itself up.

- **2.1** Sign in to MongoDB Atlas. Create a project if you have none.

- **2.2** Create a cluster: **Create** (or *Build a Database*) → pick the free **M0** to start, or a paid tier for production → choose a
  region close to your Vercel region (for example Mumbai for India) → **Create**. Wait until the cluster shows as ready.

- **2.3** Create a database user: left menu **Database Access** → **Add New Database User**.
  - Authentication method: *Password*.
  - Username: for example `selfrun_app`.
  - Password: click *Autogenerate Secure Password*, then **copy it into your notes**. Prefer letters and numbers only; if it has
    special characters (`@ # / : ?`) you must URL-encode them in step 2.7 (for example `@` becomes `%40`).
  - Built-in role: *Read and write to any database*.
  - Click **Add User**.

- **2.4** Allow Vercel to connect: left menu **Network Access** → **Add IP Address** → **Allow access from anywhere**
  (`0.0.0.0/0`) → **Confirm**. Vercel does not use fixed IP addresses, so this is required.

- **2.5** Get the connection string: left menu **Database** → your cluster → **Connect** → **Drivers**. Copy the string. It looks like
  `mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority`.

- **2.6** Replace `<username>` and `<password>` with your real ones from step 2.3.

- **2.7** Add the **database name** just before the `?`: `...mongodb.net/selfrun?retryWrites=true&w=majority`. The final value looks like:

  ```
  mongodb+srv://selfrun_app:YourPassword@cluster0.abcde.mongodb.net/selfrun?retryWrites=true&w=majority
  ```

- **2.8** Paste it into your notes as `MONGODB_URI`.

> ✅ **Checkpoint:** `MONGODB_URI` ends with `/selfrun` followed by `?…`, has no `<` or `>` in it, and the Atlas **Network Access** page lists `0.0.0.0/0`.

> [!WARNING]
> Do not run this production database from your own computer. If your local `.env` points at it, `npm run dev` and
> `npm run demo:seeders` would write into production data. Use a separate database (for example `/selfrun_dev`) locally.

---

## 3. Create the file storage (Vercel Blob)

⏱ *5 min · required · you get: `BLOB_READ_WRITE_TOKEN`*

All uploads (logos, documents, chat attachments) go to Vercel Blob.

- **3.1** Sign in to Vercel → top menu **Storage** → **Create Database** → choose **Blob**.

- **3.2** Name it (for example `selfrun-files`). When asked for access, choose **Private**. This cannot be changed later.

- **3.3** Create it, then open the store → **Settings** (or the **.env.local** tab) and copy the **Read/Write token**.

- **3.4** Paste it into your notes as `BLOB_READ_WRITE_TOKEN`.

> ✅ **Checkpoint:** the token starts with `vercel_blob_rw_`.

---

## 4. Generate your secret keys

⏱ *10 min · required · you get: 6 secret keys, the push key pair, the staff login*

These protect sensitive data. You create them yourself, once.

- **4.1** Open a terminal on your computer (any folder).

- **4.2** Run this command **six times**. Each run prints a different random value. Copy each into your notes next to the name in the table:

  ```bash
  openssl rand -base64 32
  ```

  | Name in your notes | Protects |
  | --- | --- |
  | `PLATFORM_ENCRYPTION_KEY` | Secrets the platform stores (payment keys, provider tokens) |
  | `HRMS_ENCRYPTION_KEY` | Employee bank details |
  | `FMS_ENCRYPTION_KEY` | Company bank account numbers |
  | `DLMS_ENCRYPTION_KEY` | Digi Locker passwords and credentials |
  | `SMMS_ENCRYPTION_KEY` | Social media account tokens |
  | `CRON_SECRET` | The scheduled jobs (Vercel sends it to them) |

- **4.3** Generate the push-notification key pair (one command, prints two lines):

  ```bash
  npx web-push generate-vapid-keys
  ```

Copy **Public Key** into your notes as `VAPID_PUBLIC_KEY` and **Private Key** as `VAPID_PRIVATE_KEY`.

- **4.4** Decide the platform staff login and write it in your notes: `SAAS_ADMIN_EMAIL` (your email) and `SAAS_ADMIN_PASSWORD` (a strong password).

> ✅ **Checkpoint:** six random values, two VAPID values, and the admin email and password are all in your notes, and no two values are the same.

> [!WARNING]
> **Keep these keys forever.** If you lose or change an encryption key, the data it protected can no longer be read. If you change
> the VAPID pair, every device must turn notifications on again. Use a different set for production than for local development.

---

## 5. Create the Vercel project

⏱ *5 min · required · you get: a Vercel project*

- **5.1** In Vercel click **Add New…** → **Project**.

- **5.2** Under *Import Git Repository* find this repository and click **Import**. (If it is not listed, click *Adjust GitHub App
  Permissions* and allow access to the repository.)

- **5.3** Leave *Framework Preset* as **Next.js** and the build settings as they are.

- **5.4** You can add the environment variables on this same screen (open **Environment Variables**), or deploy first and add them in step 6.
  Either way, the first deployment fails or shows an error page until the variables exist. That is expected.

- **5.5** Click **Deploy** if you are on the import screen. It may fail: that is fine, you will redeploy in step 9.

> ✅ **Checkpoint:** the project exists in Vercel and you can open its **Settings** tab.

---

## 6. Add the environment variables

⏱ *20 min · required · you get: the app configured*

- **6.1** Vercel → your project → **Settings** → **Environment Variables**.

- **6.2** For each row below: type the **Key**, paste the **Value** (no quotes), tick **Production** (and Preview if you want), click **Save**.
  Repeat until every row is added.

> [!NOTE]
> In Vercel you type values **without quotes**. (Quotes are only for a local `.env` file, where a `#` or a space in a password
> would otherwise cut the value off.)

### 6A. Required

| Key | Value |
| --- | --- |
| `MONGODB_URI` | From step 2 |
| `SAAS_ADMIN_EMAIL` | Your staff email (step 4.4) |
| `SAAS_ADMIN_PASSWORD` | Your staff password (step 4.4) |
| `SAAS_HOSTS` | `selfrunbusiness.com` |
| `PLATFORM_ROOT_DOMAIN` | `selfrunbusiness.com` |
| `NEXT_PUBLIC_APP_URL` | `https://www.selfrunbusiness.com` |
| `PLATFORM_ENCRYPTION_KEY` | From step 4 |
| `HRMS_ENCRYPTION_KEY` | From step 4 |
| `FMS_ENCRYPTION_KEY` | From step 4 |
| `DLMS_ENCRYPTION_KEY` | From step 4 |
| `SMMS_ENCRYPTION_KEY` | From step 4 |
| `CRON_SECRET` | From step 4 |
| `BLOB_READ_WRITE_TOKEN` | From step 3 |

### 6B. Email (so sign-up confirmation emails can be sent)

| Key | Value |
| --- | --- |
| `EMAIL_PROVIDER` | `resend` |
| `RESEND_API_KEY` | Added in step 10 (you can add it now as a placeholder and fix it later) |
| `EMAIL_FROM` | `SelfRun Business <no-reply@selfrunbusiness.com>` |

### 6C. Push notifications

| Key | Value |
| --- | --- |
| `VAPID_PUBLIC_KEY` | From step 4.3 |
| `VAPID_PRIVATE_KEY` | From step 4.3 |
| `VAPID_SUBJECT` | Optional: `mailto:support@selfrunbusiness.com` |

Without these two keys the apps still install and work, but push notifications are switched off.

### 6D. Optional, add when you need the feature

| Key | Feature | Where it comes from |
| --- | --- | --- |
| `OPENAI_API_KEY` | AI chatbot, assistants, Intelligence | platform.openai.com → API keys |
| `PLATFORM_WILDCARD_SUBDOMAINS` = `1` | Instant HTTPS for every company address | Set after step 8 (Option A) |
| `DOMAIN_PROVIDER` = `vercel`, `VERCEL_API_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID` | Customers' own domains, and Option B in step 8 | Step 14 |
| `RAZORPAY_BILLING_WEBHOOK_SECRET` | Charging companies | Step 13 |
| `GITHUB_REPOSITORY`, `GITHUB_DISPATCH_TOKEN`, `DESKTOP_BUILD_SECRET` | Automatic desktop and mobile apps | Step 15 |

- **6.3** When all rows are saved, scroll the list and tick them off against the tables above.

> ✅ **Checkpoint:** all 13 required keys are listed under **Production**, none has quotes around its value, and `SAAS_HOSTS` is exactly `selfrunbusiness.com`.

> [!IMPORTANT]
> **A change to any variable only takes effect after a redeploy.** Always redeploy after editing one.

---

## 7. Add your domains in Vercel

⏱ *10 min · required · you get: 4 domains attached to the project*

You add **four** domain names to the project. Do them one by one.

- **7.1** Vercel → your project → **Settings** → **Domains** → **Add**.

- **7.2** Type `www.selfrunbusiness.com` → **Add** → choose **Production** if asked. Then use the menu next to it to make it the **primary** domain.

- **7.3** Add `selfrunbusiness.com`. When Vercel offers it, choose **Redirect to** `www.selfrunbusiness.com`.

- **7.4** Add `app.selfrunbusiness.com`. No redirect. This is the address where **you and your staff** sign in to the Platform Panel.

- **7.5** Add the wildcard `*.selfrunbusiness.com`. This one gives every company a working HTTPS address (`acme` and `acme-app`).
  If Vercel says a wildcard needs its nameservers, that is expected. You choose how to handle it in step 8.

- **7.6** Leave this page open. Vercel now shows **Invalid Configuration** next to each domain and tells you which DNS records it wants.

> ✅ **Checkpoint:** four domains are listed (`www`, the bare domain with a redirect, `app`, and `*`), all marked as needing DNS.

> [!TIP]
> The platform treats the project's production domain as a website host automatically, but still set `SAAS_HOSTS` (step 6) as a safety net.

---

## 8. Point your DNS

⏱ *15 min of work, then waiting for DNS (minutes to 48 h) · required · you get: working HTTPS addresses*

Now tell the internet to send these names to Vercel. Pick **one** option.

### Which option?

- **Option A (recommended):** move your domain's DNS to Vercel. Every new company's address then works instantly with no
  per-company work. Takes the longest because nameservers must propagate.
- **Option B:** keep your current DNS provider. No nameserver change, but each new company's two addresses are attached through
  the Vercel API when it signs up (needs step 14), and a brand-new workspace can show a certificate warning for a few minutes.

### Option A: move DNS to Vercel (recommended)

- **A.1** At your domain provider, open the DNS records of `selfrunbusiness.com`. **Write down or screenshot every record** (A, CNAME,
  MX, TXT). Email stops working if you forget the MX and TXT records.

- **A.2** In Vercel → **Domains** → click `selfrunbusiness.com` → **DNS Records**. Re-create every record from A.1 here. Skip the A and
  CNAME records that point to the old host (Vercel manages the ones for this project).

- **A.3** At your domain provider, open **Nameservers** for `selfrunbusiness.com` and change them to custom nameservers:

  ```
  ns1.vercel-dns.com
  ns2.vercel-dns.com
  ```

If the provider refuses, first turn off DNSSEC for the domain, then try again.

- **A.4** Wait. This can take a few minutes to 48 hours (usually under an hour).

- **A.5** Back in Vercel → **Settings → Domains**: refresh until all four domains show **Valid Configuration**.

- **A.6** Add one more environment variable: `PLATFORM_WILDCARD_SUBDOMAINS` = `1` → Save. You will redeploy in step 9.

### Option B: keep your DNS provider

- **B.1** At your DNS provider create these records (use the exact values Vercel shows on the Domains page if they differ):

  | Type | Name / Host | Value |
  | --- | --- | --- |
  | `CNAME` | `www` | `cname.vercel-dns.com` |
  | `CNAME` | `app` | `cname.vercel-dns.com` |
  | `CNAME` | `*` | `cname.vercel-dns.com` |
  | `A` | `@` (the bare domain) | `76.76.21.21` |

- **B.2** In the Name box most providers want only `www`, `app`, `*`, `@`, not the whole domain.

- **B.3** Do **not** set `PLATFORM_WILDCARD_SUBDOMAINS`. Instead finish [step 14](#14-optional-customers-own-domains) (Vercel API token), so each
  new company's addresses are attached when it signs up.

- **B.4** Know the limits: every company uses **two** domains of your Vercel plan's domain limit, new workspaces can show a
  certificate warning for a short time, and an unknown name such as `nope.selfrunbusiness.com` shows a certificate error instead of "No workspace here".

> ✅ **Checkpoint (Option A):** all four domains show **Valid Configuration** in Vercel.
>
> ✅ **Checkpoint (Option B):** `www`, the bare domain, and `app` show **Valid Configuration**.

---

## 9. Deploy and check the first start

⏱ *10 min · required · you get: your live website and the first-start setup*

- **9.1** Vercel → **Deployments** → open the newest deployment → the three dots → **Redeploy** (or push any commit).

- **9.2** Wait until the status says **Ready** (a few minutes). If it says **Error**, open it and read the build log; the most common
  cause is a missing or misspelled variable from step 6.

- **9.3** Open **Logs** (or *Runtime Logs*) for the deployment and look for the line:

  ```
  [saas] Platform operator … created
  ```

This line means the first start created your operator company, your staff account and the list of panels in the database.

- **9.4** Open `https://www.selfrunbusiness.com` in a private window.

- **9.5** Click through `/pricing` and `/signup`. They must open.

- **9.6** Open `https://www.selfrunbusiness.com/platform`. It must **redirect** to `https://app.selfrunbusiness.com/platform`.
  (Panels never open on the website address.)

> ✅ **Checkpoint:** the SelfRun Business website shows with a valid HTTPS padlock, the log line `[saas] Platform operator … created` exists, and `/platform` redirects to the `app.` address.

> [!TIP]
> A 404 with a small monogram header on the main domain means the host is not recognised as a website host. Re-check
> `SAAS_HOSTS=selfrunbusiness.com` and that the domain is the project's production domain (7.2), then redeploy.

---

## 10. Set up email (Resend)

⏱ *20 min · required for sign-up emails · you get: `RESEND_API_KEY`*

Sign-up confirmation, "workspace ready", invitations and approvals are sent through Resend.

- **10.1** In Resend → **Domains** → **Add Domain** → `selfrunbusiness.com` → choose the region → **Add**.

- **10.2** Resend lists DNS records (SPF, DKIM and optionally DMARC). Add **every** one at the place where your DNS lives (Vercel DNS
  if you chose Option A, otherwise your domain provider).

- **10.3** Back in Resend click **Verify DNS Records**. Repeat after a few minutes until the status is **Verified**.

- **10.4** In Resend → **API Keys** → **Create API Key** (permission: *Sending access*) → copy it.

- **10.5** Paste it into your notes as `RESEND_API_KEY`, then set that variable in Vercel (step 6B) and **redeploy**.

- **10.6** Make sure `EMAIL_FROM` uses an address on the verified domain (`no-reply@selfrunbusiness.com`).

> ✅ **Checkpoint:** the domain shows **Verified** in Resend. (You will confirm email works in step 12.)

> [!NOTE]
> With `EMAIL_PROVIDER=console` mail is only written to the logs: fine in development, never in production.

---

## 11. First sign-in and Platform Panel setup

⏱ *10 min · required · you get: your Platform Panel set up*

- **11.1** Open `https://app.selfrunbusiness.com/workspace/login` (the **app** address, not `www`).

- **11.2** Sign in with `SAAS_ADMIN_EMAIL` and `SAAS_ADMIN_PASSWORD`. If you did not set a password, use the temporary one printed once in the logs.

- **11.3** Open `/platform` (the Platform Panel). Set up, in this order:

1. **Plans**: review plans and prices, and which panels each plan includes.
2. **Platform settings**: platform name, support details, seller details for invoices, and the **sign-up mode** (open, approval or closed).
3. **Payments**: Razorpay keys (step 13), when you are ready.
4. **Integrations**: email and domain providers, if you prefer saving them here rather than in environment variables.

> ✅ **Checkpoint:** you see the Platform Panel dashboard on `app.selfrunbusiness.com`.

---

## 12. Test the whole flow

⏱ *30 min · strongly recommended · you get: proof that everything works*

Do this once after the first deployment. Use a throwaway company.

- **12.1** **Sign-up.** Open `https://www.selfrunbusiness.com/signup`. The address field shows `.selfrunbusiness.com` next to it.

- **12.2** Fill in the form with a test company (slug for example `testco`) and pick at least one business category → **Create workspace**.

- **12.3** **Email.** The confirmation email arrives. Click its link. You land signed in at `https://testco-app.selfrunbusiness.com/workspace/onboarding`.

- **12.4** **Two addresses.**
  - `https://testco.selfrunbusiness.com` shows only the public website.
  - `https://testco.selfrunbusiness.com/workspace` redirects to `https://testco-app.selfrunbusiness.com/workspace`.
  - `https://testco-app.selfrunbusiness.com/` goes to the Workspace.
  - `https://nope.selfrunbusiness.com` shows "No workspace here".

- **12.5** **Isolation.** Register a second test company and confirm it shows none of the first company's data.

- **12.6** **App and push.** On a phone and a computer open `https://testco-app.selfrunbusiness.com` and install the app (Android and
  desktop: Install; iPhone/iPad: Share → Add to Home Screen). Open **Notifications → Settings** → **Turn on notifications** → **Send a test**.
  The website address `https://testco.selfrunbusiness.com` must show **no** install option.

- **12.7** **Website push.** In `testco`'s panels open **CMS → Push notifications**, switch on *Website notifications*, save. On
  `https://testco.selfrunbusiness.com` a bell appears. Allow notifications, choose topics, then send one from the CMS page and check it arrives.

- **12.8** **Apps page.** In `testco`'s panels open **Settings → Apps & downloads**. The PWA tab shows the address, QR code and previews. (The Mobile and Desktop tabs build automatically once step 15 is done.)

- **12.9** (Optional) Fill the test company with demo data: put the production `MONGODB_URI` in a local `.env` **only for this throwaway company** and run `npm run demo:seeders -- --company testco`. Never do this for a real company.

> ✅ **Checkpoint:** every line of 12.1 to 12.8 behaves as described.

---

## 13. Optional: payments (Razorpay)

⏱ *20 min · optional · you get: paid plans*

This is how the platform charges companies for plans. It can wait until after launch; until then plans can be free or granted as complimentary.

- **13.1** In Razorpay → **Settings → API Keys** → generate a Key ID and Key Secret.

- **13.2** In your Platform Panel → **Payments & Razorpay** → enter the Key ID and Key Secret → Save. They are stored encrypted.

- **13.3** In Razorpay → **Settings → Webhooks** → **Add New Webhook**:
  - URL: `https://www.selfrunbusiness.com/api/platform/billing/webhook`
  - Secret: choose a long random value and copy it.
  - Events: the subscription and payment events.

- **13.4** In Vercel set `RAZORPAY_BILLING_WEBHOOK_SECRET` to the same secret → **redeploy**.

> ✅ **Checkpoint:** a test payment on a test company's **Plan & billing** page upgrades its plan.

A company that wants to collect payments from **its own customers** connects its own Razorpay account in Workspace → Settings → Payments; that page shows the company's webhook URLs.

---

## 14. Optional: customers' own domains

⏱ *15 min · optional · you get: customers' own domains*

This lets a company put its website on its own domain (for example `www.acme.com`, with its panels on `app.acme.com`). The company does
the steps itself on its **Workspace → Settings → Custom domains** page, which has its own step-by-step guide. For it to work
(and for Option B in step 8) the platform must be able to attach domains to the Vercel project:

- **14.1** Vercel → your avatar → **Settings → Tokens** → **Create Token** (scope: the team that owns the project, no expiry or a long one). Copy it.

- **14.2** Project → **Settings → General** → copy the **Project ID**.

- **14.3** If the project belongs to a team, copy the **Team ID** (team **Settings → General**).

- **14.4** In Vercel add these variables: `DOMAIN_PROVIDER` = `vercel`, `VERCEL_API_TOKEN`, `VERCEL_PROJECT_ID`, and `VERCEL_TEAM_ID` if you use a team. **Redeploy.**
  (They can also be saved in Platform Panel → Integrations.)

- **14.5** Test: on the test company's **Custom domains** page add a domain you own. The page lists the exact DNS records to create. Create them at that domain's DNS, press **Check now**, and watch it become **Verified** with **SSL active**.

You can see every company's domains in Platform Panel → **Domains & SSL**.

> [!NOTE]
> **Nothing has to be done by hand in the Vercel dashboard.** A custom domain brings two hosts to Vercel: the website (`www.acme.com`) and
> the panels (`app.acme.com`). If Vercel asks for an ownership TXT record for either (it shows "Verification Required" on that host), the
> company's Domains page lists that exact record next to the others, under the domain. The company publishes **all** listed records once.
> After that, **Check now** and the daily automatic check verify both hosts through the Vercel API, and the page shows "Panels live at
> app.acme.com". The platform cannot write DNS records at the company's DNS provider by itself, so publishing the records is the one step that stays with the domain owner.

> ✅ **Checkpoint:** a test domain reaches **Verified** and **SSL active**, and `https://<that domain>` shows the company's website while `https://app.<that domain>` shows its panels.

---

## 15. Optional: automatic desktop and mobile apps

⏱ *40 min · optional · you get: automatic desktop and mobile apps for every company*

Every company gets **Windows, macOS, Linux, Android and iOS** apps generated for it automatically when it completes onboarding (and
again when its name or icon changes). A company can also press **Generate manually** on its Apps page. The platform hands each build to a
**GitHub Actions workflow** (`.github/workflows/desktop.yml`), which builds the apps, publishes them to a public releases repository, and
reports the download links back. Set this up once:

- **15.1** **Releases repository.**
  1. GitHub → **New repository**.
  2. Name it for example `selfrun-app-releases`, set it to **Public** (so a company's people can download without a GitHub account), tick *Add a README*, **Create**.
     (It only ever holds installers with a company's name, icon and public app address.)

- **15.2** **A secret both sides share.** Run `openssl rand -base64 32` and save the result in your notes as `DESKTOP_BUILD_SECRET`.

- **15.3** **A token that can publish releases.**
  1. GitHub → your avatar → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
  2. Resource owner: you or your organisation. Repository access: **Only select repositories** → the releases repository.
  3. Permissions → Repository permissions → **Contents: Read and write**.
  4. Generate, copy it into your notes as `RELEASES_TOKEN`.

- **15.4** **A token that can start builds.**
  1. Same place, **Generate new token**. Repository access: only **this code repository**.
  2. Permissions → Repository permissions → **Actions: Read and write**.
  3. Generate, copy it into your notes as `GITHUB_DISPATCH_TOKEN`.

- **15.5** **Settings in the code repository** (GitHub → code repository → **Settings → Secrets and variables → Actions**):
  1. **Secrets** tab → *New repository secret*: `DESKTOP_BUILD_SECRET` (from 15.2).
  2. *New repository secret*: `RELEASES_TOKEN` (from 15.3).
  3. **Variables** tab → *New repository variable*: `DESKTOP_RELEASES_REPO` = `your-org/selfrun-app-releases`.

- **15.6** **Settings in Vercel** (Production):
  - `GITHUB_REPOSITORY` = `your-org/your-code-repo`
  - `GITHUB_DISPATCH_TOKEN` = from 15.4
  - `DESKTOP_BUILD_SECRET` = from 15.2 (the **same** value as in GitHub)
  - optional `DESKTOP_RELEASES_REPO` = `your-org/selfrun-app-releases` (then only links from that repository are accepted)
  - optional `GITHUB_WORKFLOW_FILE` (default `desktop.yml`) and `GITHUB_WORKFLOW_REF` (default `main`)

Then **redeploy**.

- **15.7** **Test.** Complete onboarding for a test company (or open its **Apps & downloads** page and press **Generate manually** on the Desktop tab). The page
  shows **Building**, and 10 to 20 minutes later download buttons appear. In GitHub → **Actions** you can watch the run.

> ✅ **Checkpoint:** the run in GitHub Actions is green, the releases repository has a new release with the files, and the company's Apps page shows **Ready**.

Until 15.6 is done, builds wait in the queue ("Waiting for the build service") and start by themselves once it is. Good to know:
- Costs: GitHub Actions minutes (macOS minutes cost more). A build runs only when a company finishes onboarding, changes its name or icon, or presses Generate.
- The installers are not code-signed until you add certificates, so macOS and Windows show a warning the first time they are opened. The Android APK is debug-signed (install once allows "unknown apps"); iPhone apps are delivered as an Xcode project the company signs with its own Apple account.
- Optional: `DESKTOP_DOWNLOAD_URL` (a page with the generic installer; `{address}` is replaced by the company's app address) shows as "Need it right now?" on the Apps page.

---

## 16. Scheduled jobs (cron)

⏱ *read only · nothing to set up*

`vercel.json` registers ten daily jobs. They start automatically after deployment and are protected by `CRON_SECRET`.

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
| `/api/apps/builds/cron` | 07:00 | Generates missing apps, restarts stuck builds, rebuilds after a rename or new icon |

To confirm they are registered: Vercel → project → **Settings → Cron Jobs**. Vercel's Hobby plan allows daily schedules only; these are all daily.

---

## Go-live checklist

Tick these before you tell customers the platform is open.

- [ ] The website opens on `https://www.selfrunbusiness.com` with a padlock, and `/signup` works
- [ ] `https://app.selfrunbusiness.com/workspace/login` lets your staff in, and `/platform` opens
- [ ] A test company can sign up, receive the confirmation email and land on its own `<slug>-app` address
- [ ] `https://<slug>.selfrunbusiness.com` shows only the website; `<slug>-app` shows only the panels
- [ ] Two test companies cannot see each other's data
- [ ] Plans and prices are set in the Platform Panel; sign-up mode is what you want (open, approval or closed)
- [ ] Email arrives from `no-reply@selfrunbusiness.com`
- [ ] A phone installed the app and received a test notification
- [ ] Your encryption keys and `MONGODB_URI` are saved in a password manager (and nowhere else)
- [ ] Atlas backups are on, and the Atlas and Vercel accounts use two-factor sign-in
- [ ] (Optional) A Razorpay test payment upgraded a plan
- [ ] (Optional) The Apps page of a test company shows Ready download buttons

---

## Troubleshooting

| Problem | Cause and fix |
| --- | --- |
| 404 with a small monogram header on the main domain | The host is not a website host. Set `SAAS_HOSTS=selfrunbusiness.com`, make the domain the production domain (7.2), redeploy |
| Build fails in Vercel | Read the build log. Usually a missing or misspelled variable (6A) |
| Staff cannot sign in | Sign in at `https://app.selfrunbusiness.com/workspace/login` (not `www`). Check `SAAS_ADMIN_EMAIL` and `SAAS_ADMIN_PASSWORD` for typos (no quotes in Vercel), fix and redeploy |
| No `[saas] Platform operator … created` in the logs | `SAAS_ADMIN_EMAIL` or `MONGODB_URI` is missing or wrong. Check them and redeploy |
| `MongoServerSelectionError` or timeout in the logs | Atlas Network Access does not allow Vercel: add `0.0.0.0/0` (2.4). Or the password in `MONGODB_URI` has special characters that must be URL-encoded |
| `E11000 duplicate key` in the first-start logs | A race on the very first start. Redeploy once; if it persists, use a fresh empty database |
| Company address shows `localhost` | `PLATFORM_ROOT_DOMAIN` is missing. Set it and redeploy |
| `app.selfrunbusiness.com` shows a certificate error or "not found" | Add `app.selfrunbusiness.com` to the project (7.4) and, for Option B, its DNS record |
| "No workspace here" on `<slug>.selfrunbusiness.com` | The company is suspended (Platform Panel → Companies), the slug is wrong, or the wildcard domain is missing |
| Certificate error on a new company address | The wildcard is not active yet (step 8), or with Option B the address was not attached yet (step 14) |
| Sign-up email never arrives | `EMAIL_PROVIDER` is `console`, the Resend domain is not verified, or `EMAIL_FROM` is on another domain (step 10) |
| Uploads fail | `BLOB_READ_WRITE_TOKEN` is missing, or the Blob store is not private |
| Bank details cannot be saved | The matching `*_ENCRYPTION_KEY` is missing |
| AI features say they are unavailable | `OPENAI_API_KEY` is not set |
| Push notifications "not enabled on this server" | `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` are missing (6C) |
| Apps page says "Waiting for the platform's build service" | Step 15.6 is not done yet |
| A build fails | Open the **Build log** link on the Apps page (GitHub Actions run). Check the repository secrets and variables in 15.5 |
| Header or menu changes show late | Public navigation is cached for up to an hour; publishing in the CMS or redeploying refreshes it |
| Changes to a variable do nothing | Variables apply only after a redeploy |

---

## About the Free (Hobby) plan

Two things worth knowing, independent of this code: Vercel's Hobby plan is meant for personal, non-commercial projects, and a SaaS
that bills customers normally belongs on Pro (check Vercel's current terms). Hobby also has lower limits (function duration,
domains, team members). Every company uses two of your plan's domain slots if you use Option B. The code works on either plan.

---

## Appendix: every variable at a glance

| Key | Required? | Where it comes from |
| --- | --- | --- |
| `MONGODB_URI` | Yes | Step 2 |
| `SAAS_ADMIN_EMAIL`, `SAAS_ADMIN_PASSWORD` | Yes | Step 4.4 |
| `SAAS_HOSTS`, `PLATFORM_ROOT_DOMAIN` | Yes | `selfrunbusiness.com` |
| `NEXT_PUBLIC_APP_URL` | Yes | `https://www.selfrunbusiness.com` |
| `PLATFORM_ENCRYPTION_KEY`, `HRMS_ENCRYPTION_KEY`, `FMS_ENCRYPTION_KEY`, `DLMS_ENCRYPTION_KEY`, `SMMS_ENCRYPTION_KEY` | Yes | Step 4.2 |
| `CRON_SECRET` | Yes | Step 4.2 |
| `BLOB_READ_WRITE_TOKEN` | Yes | Step 3 |
| `EMAIL_PROVIDER` (`resend`), `RESEND_API_KEY`, `EMAIL_FROM` | For sign-up email | Step 10 |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | For push | Step 4.3 |
| `OPENAI_API_KEY` | For AI | OpenAI |
| `PLATFORM_WILDCARD_SUBDOMAINS` (`1`) | Option A | Step 8 A.6 |
| `DOMAIN_PROVIDER` (`vercel`), `VERCEL_API_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID` | Option B and customers' domains | Step 14 |
| `RAZORPAY_BILLING_WEBHOOK_SECRET` | For billing | Step 13 |
| `GITHUB_REPOSITORY`, `GITHUB_DISPATCH_TOKEN`, `DESKTOP_BUILD_SECRET` | For automatic apps | Step 15 |
| `DESKTOP_RELEASES_REPO`, `GITHUB_WORKFLOW_FILE`, `GITHUB_WORKFLOW_REF`, `DESKTOP_DOWNLOAD_URL` | Optional | Step 15 |
