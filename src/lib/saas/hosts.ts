/**
 * The hosts on which the SaaS product itself is served (its marketing website, sign-up, login entry and Platform Panel),
 * as opposed to a customer's own domain. Configured with `SAAS_HOSTS` (comma separated). In development `localhost`
 * and `saas.localhost` always count, so `npm run dev` shows the product website; a customer is `<slug>.localhost`.
 */

function normalize(h: string): string | null {
  const host = h.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0].replace(/:\d+$/, "").replace(/\.$/, "");
  return /^[a-z0-9.-]+$/.test(host) && host.length <= 253 ? host : null;
}

export function saasHosts(env: Record<string, string | undefined> = process.env): Set<string> {
  const out = new Set<string>();
  for (const raw of (env.SAAS_HOSTS ?? "").split(",")) {
    const h = normalize(raw);
    if (!h) continue;
    out.add(h);
    out.add(h.startsWith("www.") ? h.slice(4) : `www.${h}`);
  }
  if (env.NODE_ENV !== "production") {
    out.add("localhost");
    out.add("saas.localhost");
  }
  return out;
}

export function isSaasHost(host: string | null | undefined): boolean {
  const h = host ? normalize(host) : null;
  return h !== null && saasHosts().has(h);
}

/** The host's canonical, www-less name (for contact addresses and absolute URLs). */
export function saasCanonicalHost(host: string | null | undefined): string {
  const h = host ? normalize(host) : null;
  return (h ?? "saas.localhost").replace(/^www\./, "");
}
