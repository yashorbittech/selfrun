import { getPlatformDb } from "@/lib/platform/tenancy/platform-db";
import type { BusinessSelection } from "@/lib/platform/business-taxonomy";
import type { DnsRecord } from "@/lib/platform/domains/types";
import { RESERVED_SLUGS } from "@/lib/platform/tenancy/slug";
import { cachedIntegrationsDoc, loadIntegrationsDoc } from "@/lib/platform/integrations/store";
import { productionRootDomain } from "@/lib/platform/tenancy/root-domain";
import { saasHosts } from "@/lib/saas/hosts";

/**
 * The company (tenant) registry and host → company routing. Both
 * collections are platform-level (see GLOBAL_COLLECTIONS) and are only ever
 * read through `getPlatformDb()`.
 *
 * A request is routed to a company by its Host header:
 *  1. a platform host (localhost, the Vercel deployment/preview URLs, and
 *     anything in PLATFORM_HOSTS) → the platform-owner company
 *  2. a verified custom domain in `company_domains` (with or without `www.`)
 *  3. `<slug>.<root>` for any root in PLATFORM_ROOT_DOMAINS (plus
 *     `<slug>.localhost` in development) → the company with that slug
 * Anything else resolves to no company at all — never a fallback.
 */

export const COMPANIES_COLLECTION = "companies";
export const COMPANY_DOMAINS_COLLECTION = "company_domains";

export type CompanyStatus = "active" | "suspended";

export interface Company {
  _id: string;
  /** Lowercase, URL-safe; also the platform subdomain `<slug>.<root>`. */
  slug: string;
  name: string;
  status: CompanyStatus;
  /** The company that owns and runs the platform itself (the platform operator). Exactly one. */
  isPlatformOwner: boolean;
  /** Defaults from Platform settings at creation (BCP 47 locale, IANA time zone); onboarding can change the time zone. */
  locale?: string;
  timezone?: string;
  /** Line of business (ISIC Rev.4 category + sub-category) chosen at registration. */
  business?: BusinessSelection;
  /** Panels the platform switched off for THIS company only (Platform Panel → Companies). The global switch lives in the Panel Registry. */
  disabledPanels?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyDomain {
  /** The hostname itself, lowercase, no port. */
  _id: string;
  companyId: string;
  status: "pending" | "verified";
  /** Value the owner publishes in a `_selfrun-verify.<domain>` TXT record. */
  verificationToken: string;
  isPrimary: boolean;
  /** `subdomain` = the automatic `<slug>.<root>` address; `custom` = the company's own domain. */
  kind?: "subdomain" | "custom";
  /** Last known state at the hosting provider (routing + TLS), from `activeDomainProvider()`. */
  provider?: {
    id: string;
    attached: boolean;
    verified: boolean;
    dnsConfigured: boolean;
    error: string | null;
    checkedAt: Date;
    /** Records the provider still wants published (its own ownership challenge, routing). */
    records?: DnsRecord[];
    /** The provider demanded its own ownership proof at some point — see `domains/custom.ts`. */
    challenged?: boolean;
  };
  /** Outcome of the last ownership check of a custom domain (`domains/custom.ts`). */
  lastCheck?: { at: Date; txt: "found" | "missing" | "mismatch" | "error"; detail: string | null };
  createdAt: Date;
  verifiedAt: Date | null;
}

export { RESERVED_SLUGS } from "@/lib/platform/tenancy/slug";

function envList(...names: string[]): string[] {
  return names
    .flatMap((n) => (process.env[n] ?? "").split(","))
    .map((s) => normalizeHost(s))
    .filter((s): s is string => Boolean(s));
}

/** Lowercase, port and trailing dot removed; null for anything that isn't a plausible hostname. */
export function normalizeHost(host: string | null | undefined): string | null {
  if (!host) return null;
  const h = host.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0].replace(/:\d+$/, "").replace(/\.$/, "");
  return /^[a-z0-9.-]+$/.test(h) && h.length <= 253 ? h : null;
}

function platformHosts(): Set<string> {
  // The root domain itself and www.<root> (https://www.example.com) are the platform owner's own site: no env entry needed.
  const roots = platformRootDomains().filter((r) => r !== "localhost");
  return new Set(["localhost", "127.0.0.1", ...roots, ...roots.map((r) => `www.${r}`), ...envList("PLATFORM_HOSTS", "VERCEL_URL", "VERCEL_BRANCH_URL", "VERCEL_PROJECT_PRODUCTION_URL")]);
}

/** `localhost`, every `PLATFORM_ROOT_DOMAIN` entry, and the root domain saved in Platform Panel → Integrations. */
function platformRootDomains(): string[] {
  const saved = normalizeHost(cachedIntegrationsDoc()?.domains?.rootDomain);
  const configured = [...envList("PLATFORM_ROOT_DOMAIN"), ...(saved ? [saved] : [])];
  // The deployment's production URL is only a guess at the root domain: once one is configured, it is not consulted.
  const derived = configured.length === 0 ? productionRootDomain() : null;
  return ["localhost", ...configured, ...(derived ? [derived] : [])];
}

/**
 * Whether a host belongs to the platform itself — a platform host, a root
 * domain, or any address under one — and so can never be a company's own domain.
 */
export function isPlatformHost(host: string): boolean {
  if (platformHosts().has(host) || saasHosts().has(host)) return true;
  return platformRootDomains().some((root) => host === root || host.endsWith(`.${root}`));
}

// Host → company id. Positive answers are cached longer than negative ones so
// a freshly verified domain starts working quickly.
//
// Invalidation has two layers:
//  - the cache lives on `globalThis`, so the proxy bundle and the app bundle
//    (separate module instances in one process) share it — a change made on
//    this instance applies here at once;
//  - a routing version in `platform_settings` is bumped on every change and
//    checked at most every VERSION_CHECK_MS, so other instances follow within
//    seconds instead of waiting out the TTL.
const HIT_TTL_MS = 60_000;
const MISS_TTL_MS = 5_000;
const VERSION_CHECK_MS = 2_000;
const ROUTING_VERSION_ID = "routing";

interface RoutingCache {
  hosts: Map<string, { id: string | null; at: number }>;
  owner: { id: string; at: number } | null;
  version: number | null;
  versionCheckedAt: number;
}
const globalForRouting = globalThis as unknown as { __companyRouting?: RoutingCache };
const routing: RoutingCache = (globalForRouting.__companyRouting ??= { hosts: new Map(), owner: null, version: null, versionCheckedAt: 0 });

/** Clears this process's cache when another instance has changed routing since we last looked. */
async function followRoutingVersion(): Promise<void> {
  if (Date.now() - routing.versionCheckedAt < VERSION_CHECK_MS) return;
  routing.versionCheckedAt = Date.now();
  try {
    const db = await getPlatformDb();
    const doc = await db.collection<{ _id: string; version?: number }>("platform_settings").findOne({ _id: ROUTING_VERSION_ID });
    const version = doc?.version ?? 0;
    if (routing.version !== null && version !== routing.version) {
      routing.hosts.clear();
      routing.owner = null;
    }
    routing.version = version;
  } catch {
    // Routing keeps working from the TTL cache if the version can't be read.
  }
}

export async function getPlatformOwnerCompanyId(): Promise<string | null> {
  await followRoutingVersion();
  if (routing.owner && Date.now() - routing.owner.at < HIT_TTL_MS) return routing.owner.id;
  const db = await getPlatformDb();
  const owner = await db.collection<Company>(COMPANIES_COLLECTION).findOne({ isPlatformOwner: true, status: "active" }, { projection: { _id: 1 } });
  routing.owner = owner ? { id: owner._id, at: Date.now() } : null;
  return owner?._id ?? null;
}

async function lookupHost(host: string): Promise<string | null> {
  const bare = host.startsWith("www.") ? host.slice(4) : host;
  // The SaaS product's own host serves its sign-up and Platform Panel, which run in the platform operator's company scope.
  if (saasHosts().has(host)) return getPlatformOwnerCompanyId();

  const db = await getPlatformDb();
  const companies = db.collection<Company>(COMPANIES_COLLECTION);

  // A company's own verified domain wins over the generic platform hosts, so a customer can be served on a domain that
  // used to be the platform's (a deployment's production URL) without any special case.
  const domain = await db
    .collection<CompanyDomain>(COMPANY_DOMAINS_COLLECTION)
    .findOne({ _id: { $in: [host, bare] }, status: "verified" }, { projection: { companyId: 1 } });
  if (domain) {
    const company = await companies.findOne({ _id: domain.companyId, status: "active" }, { projection: { _id: 1 } });
    return company?._id ?? null;
  }

  if (platformHosts().has(host) || platformHosts().has(bare)) return getPlatformOwnerCompanyId();

  for (const root of platformRootDomains()) {
    if (!host.endsWith(`.${root}`)) continue;
    const slug = host.slice(0, -(root.length + 1));
    if (!slug || slug.includes(".") || RESERVED_SLUGS.has(slug)) continue;
    const company = await companies.findOne({ slug, status: "active" }, { projection: { _id: 1 } });
    if (company) return company._id;
  }
  return null;
}

export async function resolveCompanyIdByHost(rawHost: string | null | undefined): Promise<string | null> {
  const host = normalizeHost(rawHost);
  if (!host) return null;
  // Also primes the integrations cache the synchronous root-domain accessors read.
  await Promise.all([followRoutingVersion(), loadIntegrationsDoc()]);
  const hit = routing.hosts.get(host);
  if (hit && Date.now() - hit.at < (hit.id ? HIT_TTL_MS : MISS_TTL_MS)) return hit.id;
  const id = await lookupHost(host);
  routing.hosts.set(host, { id, at: Date.now() });
  return id;
}

/**
 * Call after any domain or company-status change: applies at once in this
 * process (proxy included) and bumps the shared routing version so every
 * other instance drops its cache within VERSION_CHECK_MS.
 */
export function forgetCompanyRouting(): void {
  routing.hosts.clear();
  routing.owner = null;
  void getPlatformDb()
    .then((db) => db.collection<{ _id: string; version?: number }>("platform_settings").findOneAndUpdate({ _id: ROUTING_VERSION_ID }, { $inc: { version: 1 } }, { upsert: true, returnDocument: "after" }))
    .then((doc) => {
      // Our own bump isn't news to us.
      if (doc?.version !== undefined) routing.version = doc.version;
    })
    .catch((err) => console.error("[tenancy] routing version bump failed", err));
}

export async function getCompany(companyId: string): Promise<Company | null> {
  const db = await getPlatformDb();
  return db.collection<Company>(COMPANIES_COLLECTION).findOne({ _id: companyId });
}

export async function listActiveCompanyIds(): Promise<string[]> {
  const db = await getPlatformDb();
  const rows = await db.collection<Company>(COMPANIES_COLLECTION).find({ status: "active" }, { projection: { _id: 1 } }).toArray();
  return rows.map((r) => r._id);
}
