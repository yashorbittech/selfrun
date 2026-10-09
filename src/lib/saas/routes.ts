/**
 * The public pages of the SaaS product website. A request on a SaaS host (`hosts.ts`) for one of these paths is
 * rewritten by `proxy.ts` to the same path under `/saas`; everything else on that host (sign-up, Platform Panel,
 * API) is served as before.
 */

const EXACT = new Set([
  "/",
  "/features",
  "/pricing",
  "/changelog",
  "/roadmap",
  "/docs",
  "/help",
  "/faq",
  "/tutorials",
  "/blog",
  "/about",
  "/contact",
  "/mission",
  "/what-we-do",
  "/success-stories",
  "/privacy",
  "/terms",
  "/cookies",
  "/data-policy",
  "/refund-policy",
  "/demo",
  "/gallery",
  // Pages of earlier versions of the website: redirected to their new homes by app/saas/[...legacy].
  "/modules",
  "/ai",
  "/automation",
  "/integrations",
  "/security",
  "/how-it-works",
  "/use-cases",
  "/industries",
  "/resources",
  "/login",
  "/register",
  "/robots.txt",
  "/sitemap.xml",
  "/opengraph-image",
]);

const PREFIXES = ["/features/", "/docs/", "/pricing/", "/blog/", "/tutorials/", "/modules/", "/use-cases/", "/industries/", "/resources/"];

export function isSaasPagePath(pathname: string): boolean {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return EXACT.has(p) || PREFIXES.some((x) => p.startsWith(x));
}
