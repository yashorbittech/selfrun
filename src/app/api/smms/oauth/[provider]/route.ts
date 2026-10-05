import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getViewer, can } from "@/lib/smms/viewer";
import { authorizeUrl, isProvider, newOAuthState, providerConfigured } from "@/lib/smms/integrations";

type Context = { params: Promise<{ provider: string }> };

const OAUTH_STATE_COOKIE = "smms_oauth_state";

/** Starts a platform OAuth connection (MANAGE_INTEGRATIONS only). A random `state` in an httpOnly cookie guards the callback. */
export async function GET(req: NextRequest, { params }: Context) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.redirect(new URL("/smms/login", req.url));
  const back = new URL("/smms/settings?tab=integrations", req.url);
  if (!can(viewer, "MANAGE_INTEGRATIONS")) return NextResponse.redirect(back);
  const { provider } = await params;
  if (!isProvider(provider) || !(await providerConfigured(provider))) {
    back.searchParams.set("error", "That platform's app credentials aren't set up yet. Add them in Workspace → Settings → Integrations.");
    return NextResponse.redirect(back);
  }
  const state = newOAuthState();
  const store = await cookies();
  store.set(OAUTH_STATE_COOKIE, `${provider}.${state}.${viewer.userId}`, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/api/smms/oauth", maxAge: 600 });
  const redirectUri = new URL(`/api/smms/oauth/${provider}/callback`, req.url).toString();
  return NextResponse.redirect(await authorizeUrl(provider, redirectUri, state));
}
