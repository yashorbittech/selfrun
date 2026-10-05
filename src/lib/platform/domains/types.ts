/** A DNS record the domain owner must publish before the domain can serve. */
export interface DnsRecord {
  type: "A" | "CNAME" | "TXT";
  name: string;
  value: string;
  reason: string;
}

export interface DomainStatus {
  /** The host is attached to the hosting project. */
  attached: boolean;
  /** Ownership proven to the hosting provider (no TXT challenge outstanding). */
  verified: boolean;
  /** DNS points at the hosting provider, so traffic (and SSL issuance) works. */
  dnsConfigured: boolean;
  /** Records still needed, when not verified / not configured. */
  records: DnsRecord[];
}

export type DomainResult<T> = { ok: true; value: T } | { ok: false; error: string };

/**
 * Where a company's hostnames get attached for routing + TLS. Swappable at
 * the platform level (`DOMAIN_PROVIDER`), so moving hosting off Vercel means
 * one new adapter, not an application change.
 */
export interface DomainProvider {
  id: string;
  add(host: string): Promise<DomainResult<DomainStatus>>;
  status(host: string): Promise<DomainResult<DomainStatus>>;
  /** Asks the provider to re-check ownership now. */
  verify(host: string): Promise<DomainResult<DomainStatus>>;
  remove(host: string): Promise<DomainResult<null>>;
}

/** Whether one record the owner must publish is in place, as of the last check. */
export type RecordState = "ok" | "missing" | "mismatch" | "unknown";

/** A company domain as the Domains settings page shows it (serialisable, safe for the client). */
export interface CompanyDomainView {
  host: string;
  kind: "subdomain" | "custom";
  status: "pending" | "verified";
  isPrimary: boolean;
  /** Added from Settings → Domains (the automatic and operator-attached addresses aren't). */
  removable: boolean;
  createdAt: string;
  verifiedAt: string | null;
  /** Records the owner must publish, each with whether it's in place. Empty = nothing to do. */
  records: (DnsRecord & { state: RecordState })[];
  /** Hosting side (routing + TLS). `ssl: "manual"` = attached by the platform operator, not an API. */
  hosting: { providerId: string | null; dnsConfigured: boolean; ssl: "active" | "pending" | "manual" | "error"; error: string | null };
  lastCheckedAt: string | null;
}

export type DomainActionResult = { ok: true; domains: CompanyDomainView[]; message?: string } | { ok: false; error: string };
