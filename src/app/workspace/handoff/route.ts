import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { currentCompanyId } from "@/lib/platform/tenancy/context";
import { consumeHandoff } from "@/lib/platform/signup";
import { createHubSession, setHubSessionCookie } from "@/lib/hub-auth";
import { provisionAccessibleSessions } from "@/lib/cross-module-sso";
import { loginLanding } from "@/lib/platform/onboarding/state";
import { getSessionHubUser } from "@/lib/hub-auth";

/**
 * Signs a freshly signed-up owner in on their company's own host. The token
 * is single-use, expires in two minutes and only works on the company it was
 * issued for — sign-up happens on the platform's site and cookies can't cross
 * domains, so this is the bridge. Anything invalid just lands on the login page.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const handoff = token ? await consumeHandoff(token, await currentCompanyId()) : null;
  if (!handoff) return NextResponse.redirect(onThisHost(req, "/workspace/login"));

  const adminId = new ObjectId(handoff.adminId);
  const hubToken = await createHubSession(adminId);
  await setHubSessionCookie(hubToken);
  await provisionAccessibleSessions(adminId, "hub");
  // The plain Workspace home is not an explicit destination: a new owner lands on onboarding.
  const asked = handoff.next.startsWith("/") && !handoff.next.startsWith("//") && handoff.next !== "/workspace" ? handoff.next : null;
  const user = await getSessionHubUser(hubToken);
  return NextResponse.redirect(onThisHost(req, await loginLanding(user?.roles ?? [], asked)));
}

/**
 * The redirect must stay on the host the cookies were just set for. `req.url`
 * can carry the server's own hostname instead of the one the browser used
 * (e.g. `localhost` for `acme.localhost`), so build it from the Host header.
 */
function onThisHost(req: NextRequest, path: string): URL {
  const host = req.headers.get("host") ?? req.nextUrl.host;
  return new URL(path, `${req.nextUrl.protocol}//${host}`);
}
