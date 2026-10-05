/**
 * The public pages of the SaaS product website. A request on a SaaS host (`hosts.ts`) for one of these paths is
 * rewritten by `proxy.ts` to the same path under `/saas`; everything else on that host (sign-up, Platform Panel,
 * API) is served as before.
 */

const EXACT = new Set([
  "/",
  "/features",
  "/modules",
  "/ai",
  "/automation",
  "/use-cases",
  "/industries",
  "/how-it-works",
  "/integrations",
  "/security",
  "/pricing",
  "/about",
  "/contact",
  "/faq",
  "/demo",
  "/login",
  "/register",
  "/resources",
  "/privacy",
  "/terms",
  "/robots.txt",
  "/sitemap.xml",
  "/opengraph-image",
]);

const PREFIXES = ["/modules/", "/resources/", "/industries/", "/use-cases/"];

export function isSaasPagePath(pathname: string): boolean {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return EXACT.has(p) || PREFIXES.some((x) => p.startsWith(x));
}
