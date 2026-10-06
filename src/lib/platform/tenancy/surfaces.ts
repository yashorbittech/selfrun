import { isSaasAppHost, isSaasHost } from "@/lib/saas/hosts";
import { APP_SLUG_SUFFIX, isPlatformHost, normalizeHost, type HostSurface } from "@/lib/platform/tenancy/companies";

/**
 * A company has two sides, on two hosts:
 *  - the SITE (`<slug>.<root>` or its own domain, e.g. `acme.com`): only the public website;
 *  - the APP (`<slug>-app.<root>`, `app.<its own domain>`, or `app.<SaaS host>` for the platform operator): the panels.
 * A page that belongs to the other side is redirected there, so every link keeps working from either host.
 */

/** First path segments that are panels (pages, not APIs): reachable only on an app host. */
const PANEL_SEGMENTS = new Set([
  "workspace",
  "platform",
  "console",
  "hrms",
  "pms",
  "prms",
  "tms",
  "fms",
  "lms",
  "messenger",
  "sop",
  "lpms",
  "dlms",
  "ots",
  "aibots",
  "intelligence",
  "smms",
  "seo",
  "cms",
  "support",
  "portal",
  // The portal's own sign-in and registration for a company's clients, students and applicants.
  "login",
  "register",
]);

/** Public links that work on either host (payment links, certificate verification) and internal rewrite targets. */
const SHARED_SEGMENTS = new Set(["pay", "verify", "panel-unavailable", "workspace-not-found", "maintenance", "offline-shell"]);

const firstSegment = (pathname: string) => pathname.split("/")[1] ?? "";

export function isPanelPath(pathname: string): boolean {
  return PANEL_SEGMENTS.has(firstSegment(pathname));
}

export function isSharedPath(pathname: string): boolean {
  return SHARED_SEGMENTS.has(firstSegment(pathname));
}

/** What to do with a page request given the side of the company its host serves; null = serve it here. */
export function surfaceRedirect(surface: HostSurface, pathname: string): "to-app" | "to-site" | "app-home" | null {
  if (isSharedPath(pathname)) return null;
  if (surface === "site") return isPanelPath(pathname) ? "to-app" : null;
  if (pathname === "/") return "app-home";
  return isPanelPath(pathname) ? null : "to-site";
}

/** The host that serves the other side of the same company, keeping the port. Null when it can't be derived. */
export function counterpartHost(rawHost: string | null, surface: HostSurface): string | null {
  const host = normalizeHost(rawHost);
  if (!host) return null;
  const port = rawHost?.match(/:\d+$/)?.[0] ?? "";
  let other: string | null = null;
  if (surface === "site") {
    if (isSaasHost(host)) other = `app.${host.replace(/^www\./, "")}`;
    else if (isPlatformHost(host)) {
      const [label, ...rest] = host.split(".");
      other = `${label}${APP_SLUG_SUFFIX}.${rest.join(".")}`;
    } else other = `app.${host.replace(/^www\./, "")}`;
  } else if (isSaasAppHost(host)) other = host.slice(4);
  else if (host.startsWith("app.")) other = host.slice(4);
  else {
    const [label, ...rest] = host.split(".");
    if (label.endsWith(APP_SLUG_SUFFIX)) other = `${label.slice(0, -APP_SLUG_SUFFIX.length)}.${rest.join(".")}`;
  }
  // A redirect to the bare `localhost` is turned into a relative one by the Next server (it is the server's own name), which
  // would loop on the app host in development; `saas.localhost` is the same product website.
  if (other === "localhost") other = "saas.localhost";
  return other ? `${other}${port}` : null;
}
