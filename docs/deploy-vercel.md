# Deploying the SaaS platform on Vercel (www.selfrunbusiness.ai)

What the platform needs from its host, in the order to do it. **Customers need none of this**: they sign up, get
`https://<their-name>.selfrunbusiness.ai`, and can connect their own domain later from Workspace → Settings → Domains.

How addresses work: the platform picks the company from the request's host name. `selfrunbusiness.ai` and `www.selfrunbusiness.ai`
are the platform owner's own site (and `/signup`); `<slug>.selfrunbusiness.ai` is that company's Workspace and public website;
a verified custom domain is the same company under its own name. Anything else shows "No workspace here". The root
domain (`selfrunbusiness.ai`) comes from `PLATFORM_ROOT_DOMAIN`.

## 1. Why the workspace address showed `localhost`

`PLATFORM_ROOT_DOMAIN` was not set on the production deployment (and was missing from `.env.example`), so the app assumed
development. Now: it is documented, it falls back to the Vercel production domain (`www.selfrunbusiness.ai` → `selfrunbusiness.ai`),
and as a last resort it derives the root from the request host and logs an error — it can no longer print `localhost` in
production. **Still set it explicitly (step 3)**; the fallbacks are a safety net.

## 2. Domains and DNS (one time)

1. Vercel → your project → **Settings → Domains**. Add:
   - `www.selfrunbusiness.ai` (make it the production domain) and `selfrunbusiness.ai` (redirect to www, or the other way round),
   - the wildcard `*.selfrunbusiness.ai` — this gives every company a working HTTPS address with no per-company setup.
2. Vercel documents that a wildcard domain needs the domain's **nameservers pointed at Vercel**
   (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`) so it can issue the wildcard certificate. Check what the Domains tab asks for
   on your plan.
   **Before changing nameservers, copy every existing DNS record of selfrunbusiness.ai into Vercel's DNS** (especially `MX`, SPF/DKIM
   `TXT` and any verification records). Records you forget stop working — email first.
### Domain bought at GoDaddy, hosted on Vercel

Two ways; **A is recommended** (every new company's address works instantly, nothing to attach per company):

**A. Move the DNS to Vercel (wildcard).**
1. GoDaddy → My Products → Domains → `selfrunbusiness.ai` → **DNS**. Write down (or screenshot) EVERY record: `A`, `CNAME`, `MX`, `TXT` (SPF/DKIM/verification). If you use e-mail on this domain (GoDaddy/Microsoft 365/Google), these must be recreated in Vercel.
2. Vercel → Domains → `selfrunbusiness.ai` → **DNS Records**: add those same records (skip the `A`/`CNAME` that Vercel manages for your project).
3. GoDaddy → the domain → **Nameservers → Change → "I'll use my own nameservers"**: `ns1.vercel-dns.com` and `ns2.vercel-dns.com`. If GoDaddy blocks the change, turn off DNSSEC for the domain first. Propagation can take from minutes to 48 hours.
4. In Vercel the three domains show "Valid Configuration" → set `PLATFORM_WILDCARD_SUBDOMAINS=1` and redeploy.

**B. Keep GoDaddy DNS (no wildcard certificate).**
1. GoDaddy DNS → add a record: Type `CNAME`, Host `*`, Value = the CNAME Vercel shows for your project (Vercel → Domains → `www.selfrunbusiness.ai`; `cname.vercel-dns.com` also works).
2. Leave `PLATFORM_WILDCARD_SUBDOMAINS` unset and set `DOMAIN_PROVIDER=vercel`, `VERCEL_API_TOKEN`, `VERCEL_PROJECT_ID` (+ `VERCEL_TEAM_ID`): each new company's subdomain is then added to the project through the API when it registers.
3. Caveats: Vercel issues each certificate after the domain is added, so a brand-new workspace can show a certificate warning for a short while; each company counts toward the project's domain limit on your plan; an unknown `nope.selfrunbusiness.ai` shows a certificate error instead of "No workspace here".

3. Confirm: `https://anything.selfrunbusiness.ai` shows the platform's "No workspace here" page over HTTPS (not a certificate
   error). That means the wildcard works.

If the wildcard is not available on your plan, leave `PLATFORM_WILDCARD_SUBDOMAINS` unset: every new company's subdomain is
then attached through the Vercel API at registration (needs step 5; each one counts toward the project's domain limit).

## 3. Environment variables (Vercel → Settings → Environment Variables → Production)

Change of an env var needs a **redeploy** to take effect.

| Variable | Value | Notes |
|---|---|---|
| `MONGODB_URI` | production database | Atlas → Network Access must allow Vercel (e.g. `0.0.0.0/0`). Run `npm run db:migrate-tenancy -- --apply` against it once, before the first deploy of this version. |
| `PLATFORM_ROOT_DOMAIN` | `selfrunbusiness.ai` | Required. |
| `SAAS_HOSTS` | `selfrunbusiness.ai` | Required: the hosts that serve the product website, sign-up and Platform Panel. |
| `PLATFORM_WILDCARD_SUBDOMAINS` | `1` | Only once `*.selfrunbusiness.ai` works (step 2). |
| `PLATFORM_ENCRYPTION_KEY` | `openssl rand -base64 32` | Server-side only. Losing it makes stored provider secrets unreadable. |
| `CRON_SECRET` | long random string | Vercel sends it to the cron routes in `vercel.json`. |
| `NEXT_PUBLIC_APP_URL` | `https://www.selfrunbusiness.ai` | |
| `RAZORPAY_BILLING_WEBHOOK_SECRET` | from Razorpay | Billing webhook signature. |
| `EMAIL_PROVIDER` / `RESEND_API_KEY` / `EMAIL_FROM` | `resend` / key / `SelfRun Business <no-reply@selfrunbusiness.ai>` | See step 6. |
| `DOMAIN_PROVIDER` / `VERCEL_API_TOKEN` / `VERCEL_PROJECT_ID` / `VERCEL_TEAM_ID` | `vercel` / token / project id / team id (if any) | Custom domains (step 5). Can also be saved in Platform Panel → Integrations. |
| `OPENAI_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `*_ENCRYPTION_KEY`, … | as in `.env.example` | Per product: AI features, file uploads, HR/Finance/Digi Locker encryption. |

`PLATFORM_HOSTS` is not needed for `selfrunbusiness.ai` / `www.selfrunbusiness.ai` (they come from the root domain).

## 4. Customer sign-up (nothing to configure per customer)

`https://www.selfrunbusiness.ai/signup` → the form shows `…​.selfrunbusiness.ai` → e-mail confirmation → the company, its owner, its
subdomain, a 30-day trial and a starter website are created → the browser is signed in on
`https://<slug>.selfrunbusiness.ai/workspace` and lands on Workspace onboarding. Sign-up mode (open / approval / closed) is in
Platform Panel → Platform settings.

## 5. Custom domains

Needs `DOMAIN_PROVIDER=vercel` plus a Vercel API token (Account Settings → Tokens, scoped to the team that owns the project),
the project id (Project → Settings → General) and the team id if the project belongs to a team. In Workspace → Settings →
Domains a customer enters their domain; the page shows exactly the DNS records to create (an ownership TXT and the routing
record) and checks them; TLS is issued by Vercel automatically. Platform Panel → Domains & SSL shows every company's domains.

## 6. E-mail

Sign-up confirmation, "workspace ready", invitations and approvals are sent through Resend. In Resend, add and verify the
sending domain `selfrunbusiness.ai` (publish the SPF/DKIM records it lists — in Vercel DNS if the nameservers moved) and use an
`EMAIL_FROM` on that domain. With `EMAIL_PROVIDER=console` mail is only logged (development).

## 7. Payments

- Billing webhook (the platform charging companies): in Razorpay add `https://www.selfrunbusiness.ai/api/platform/billing/webhook`
  with the same secret as `RAZORPAY_BILLING_WEBHOOK_SECRET`. The Razorpay keys are entered in Platform Panel → Payments & Razorpay.
- A company collecting payments from its own customers connects its own Razorpay account in Workspace → Settings → Payments; the
  page shows that company's webhook URLs.

## 8. Cron jobs

`vercel.json` defines 9 daily jobs (wallet, SOP, SEO, Digi Locker, social, tests, domains, trials, subscriptions). They are
protected by `CRON_SECRET`. Hobby plans allow daily schedules only — these are all daily.

## 9. Check after deploying

1. `https://www.selfrunbusiness.ai/signup` shows `.selfrunbusiness.ai` next to the address field.
2. Register a test company; the confirmation e-mail arrives; the link signs you in on `https://<slug>.selfrunbusiness.ai/workspace/onboarding`.
3. `https://<slug>.selfrunbusiness.ai` (public site) and `/workspace` load over HTTPS; an unknown `https://nope.selfrunbusiness.ai` shows "No workspace here".
4. Workspace → Settings → Domains lists `<slug>.selfrunbusiness.ai` as the primary address. Add a test custom domain and watch it verify.
5. Another company's Workspace shows none of the first company's data.

## 10. Troubleshooting

- **Address still shows `localhost`** — `PLATFORM_ROOT_DOMAIN` missing or the deployment predates it: set it and redeploy. The server log has a line starting `[tenancy] PLATFORM_ROOT_DOMAIN is not set` while it is missing.
- **"No workspace here" on `<slug>.selfrunbusiness.ai`** — the company is suspended (Platform Panel → Companies), the slug is wrong, or the wildcard domain is missing.
- **Certificate error on a new subdomain** — the wildcard is not active yet (step 2).
- **Header/menu changes show late** — the public navigation is cached for up to an hour; redeploying or publishing in the CMS refreshes it.

## About the Free (Hobby) plan

Two things worth knowing, independent of this code: Vercel's Hobby plan is meant for personal, non-commercial projects — a SaaS
that bills customers is the kind of use that normally belongs on Pro (check Vercel's current terms); and Hobby has lower
limits (function duration, domains, team members) than Pro. The code works on either; it does not need Pro-only features.
