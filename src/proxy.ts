import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isMaintenanceOn, isPublicSitePath } from "@/lib/cms/maintenance-gate";
import { resolveCompanyIdByHost } from "@/lib/platform/tenancy/companies";
import { listPanels, unavailablePanelKeys } from "@/lib/platform/panels/store";
import { isSaasHost } from "@/lib/saas/hosts";
import { isSaasPagePath } from "@/lib/saas/routes";

/**
 * First-touch referral capture, server side. A `?ref=CODE` on any page view
 * is stored in an HttpOnly cookie for 30 days (first code wins) so the
 * attribution survives even when the browser blocks localStorage, the visitor
 * bounces through /portal/login, or they sign up days later. Sign-up actions
 * read this cookie server-side — the client can't forge or drop it.
 */
const COOKIE = "yo_ref";
const MAX_AGE = 30 * 24 * 60 * 60;

// Same name as CMS_SESSION_COOKIE in src/lib/cms-auth.ts (not imported: that module is heavier than the proxy needs).
const CMS_SESSION_COOKIE = "cms_session";

/**
 * Panel Registry gate: a panel the platform switched off (for every company, or for this one) is not reachable — its
 * pages show "not available" and its API answers 403. The Workspace itself and anything that isn't a registry panel
 * pass straight through. Fails open on a lookup error (the panel's own checks still apply).
 */
async function panelGate(request: NextRequest, companyId: string | null | undefined): Promise<NextResponse | null> {
  if (!companyId) return null;
  const pathname = request.nextUrl.pathname;
  const parts = pathname.split("/").filter(Boolean);
  const isApi = parts[0] === "api";
  const segment = isApi ? parts[1] : parts[0];
  try {
    const off = await unavailablePanelKeys(companyId);
    if (off.size === 0) return null;
    const unavailable = (key: string, name: string) => {
      if (isApi) return NextResponse.json({ error: `${name} isn't available for this workspace.` }, { status: 403 });
      const url = new URL("/panel-unavailable", request.url);
      url.searchParams.set("panel", key);
      return NextResponse.rewrite(url, { status: 403 });
    };
    // The company's public website is the "website" panel: its public pages go offline when it is switched off.
    if (!isApi && off.has("website") && isPublicSitePath(pathname)) return unavailable("website", "The website");
    if (!segment || segment === "workspace" || !off.has(segment)) return null;
    const panel = (await listPanels()).find((p) => p.key === segment);
    return panel && !panel.core ? unavailable(segment, panel.name) : null;
  } catch (err) {
    console.error("[panels] availability check failed in proxy", err);
    return null;
  }
}

export async function proxy(request: NextRequest) {
  // API calls: only the panel gate applies (everything below is about page views).
  if (request.nextUrl.pathname.startsWith("/api/")) {
    let apiCompany: string | null | undefined;
    try {
      apiCompany = await resolveCompanyIdByHost(request.headers.get("host"));
    } catch {
      apiCompany = undefined;
    }
    return (await panelGate(request, apiCompany)) ?? NextResponse.next();
  }

  // The SaaS product's own website: its public pages live under /saas and need no company.
  if (isSaasHost(request.headers.get("host")) && isSaasPagePath(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = `/saas${request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname.replace(/\/+$/, "")}`;
    return NextResponse.rewrite(url);
  }

  // Every page belongs to the company whose domain it was requested on. A
  // host no company owns gets a plain "no workspace here" page, not an
  // error. A registry lookup failure falls through (fail open): the page's
  // own data access resolves the company again and fails safe on its own.
  let companyId: string | null | undefined;
  try {
    companyId = await resolveCompanyIdByHost(request.headers.get("host"));
  } catch (err) {
    console.error("[tenancy] company lookup failed in proxy", err);
  }
  if (companyId === null) {
    return NextResponse.rewrite(new URL("/workspace-not-found", request.url), { status: 404 });
  }

  const blocked = await panelGate(request, companyId);
  if (blocked) return blocked;

  // CMS maintenance mode: visitors to the public site get the maintenance page
  // (503, so search engines retry instead of indexing it). Anyone signed in to
  // the CMS still sees the real site, to check their work before reopening.
  if (companyId && isPublicSitePath(request.nextUrl.pathname) && !request.cookies.get(CMS_SESSION_COOKIE) && (await isMaintenanceOn(companyId))) {
    return NextResponse.rewrite(new URL("/maintenance", request.url), { status: 503, headers: { "Retry-After": "3600" } });
  }

  const raw = request.nextUrl.searchParams.get("ref");
  const code = raw?.trim().toUpperCase();
  const response = NextResponse.next();
  if (code && /^[A-Z0-9]{6,10}$/.test(code) && !request.cookies.get(COOKIE)) {
    response.cookies.set(COOKIE, code, { maxAge: MAX_AGE, path: "/", sameSite: "lax", httpOnly: true, secure: process.env.NODE_ENV === "production" });
  }
  // Anonymous, first-party device id — lets the referral fraud check notice one browser creating several "referred" accounts. HttpOnly, random, carries no personal data.
  if (!request.cookies.get("yo_did")) {
    response.cookies.set("yo_did", crypto.randomUUID(), { maxAge: 365 * 24 * 60 * 60, path: "/", sameSite: "lax", httpOnly: true, secure: process.env.NODE_ENV === "production" });
  }
  return response;
}

export const config = {
  // Page views and API calls (API calls only get the panel gate) — skip Next internals and static files.
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
