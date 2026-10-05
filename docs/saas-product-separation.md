# SelfRun Business — running the platform as a SaaS

The product has its own brand, domain and website. The company that runs it (the *platform operator*) holds the platform
staff and the Platform Panel. Every customer registers through the product website and is an ordinary tenant.

## Run it locally

1. `MONGODB_URI` in `.env` points at a NEW, empty database (the default is `…/selfrun`).
2. Set `SAAS_ADMIN_EMAIL` (and optionally `SAAS_ADMIN_PASSWORD`) in `.env`: the first start creates the operator company,
   your staff account and the Panel Registry by itself. (Manual alternative: `npm run db:init-saas -- --email you@company.com`.)
3. `npm run dev` — `http://localhost:3000` is the product website; sign in as staff at `/workspace/login`, then `/platform`.
   A customer's workspace is `http://<slug>.localhost:3000`.

## Hosts and environment

| Variable | Meaning |
| --- | --- |
| `MONGODB_URI` | the SaaS database |
| `SAAS_HOSTS` | production hosts of the product site, e.g. `selfrunbusiness.ai` (`www.` is added). In development `localhost` is one automatically |
| `PLATFORM_ROOT_DOMAIN` | root of customers' automatic addresses (`<slug>.selfrunbusiness.ai`) |
| `SAAS_HELLO_EMAIL`, `SAAS_SALES_EMAIL`, `SAAS_SUPPORT_EMAIL`, `SAAS_SECURITY_EMAIL` | public mailboxes (default `<name>@<saas host>`) |
| `SAAS_OPERATOR_NAME` | optional: the operating company named in the footer and legal pages |

## Bringing an existing business onto the SaaS

1. The business registers at `/signup` like any customer.
2. `SOURCE_MONGODB_URI='<its old database>' npm run db:import-company -- --to-company <slug>` shows what would be copied.
3. Add `--apply` to copy it. The old database is only read. The script deletes itself and its npm command afterwards.

Use the same encryption keys / file-storage token in this environment as the old deployment used.
