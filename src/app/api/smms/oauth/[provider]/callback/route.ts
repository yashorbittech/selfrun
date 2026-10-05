import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";
import { getViewer, can, SmmsInputError } from "@/lib/smms/viewer";
import { completeOAuth, isProvider, PROVIDERS } from "@/lib/smms/integrations";
import { recordAudit } from "@/lib/smms/audit";

type Context = { params: Promise<{ provider: string }> };

const STATE_COOKIE = "smms_oauth_state";

/** OAuth redirect target: checks state + session + permission, exchanges the code and stores the (encrypted) tokens. */
export async function GET(req: NextRequest, { params }: Context) {
  const back = new URL("/smms/settings?tab=integrations", req.url);
  const fail = (msg: string) => {
    back.searchParams.set("error", msg);
    return NextResponse.redirect(back);
  };
  const viewer = await getViewer();
  if (!viewer) return NextResponse.redirect(new URL("/smms/login", req.url));
  if (!can(viewer, "MANAGE_INTEGRATIONS")) return NextResponse.redirect(back);
  const { provider } = await params;
  if (!isProvider(provider)) return fail("Unknown platform.");

  const store = await cookies();
  const saved = store.get(STATE_COOKIE)?.value ?? "";
  store.delete(STATE_COOKIE);
  const [p, state, uid] = saved.split(".");
  const got = req.nextUrl.searchParams.get("state") ?? "";
  const same = state && got.length === state.length && timingSafeEqual(Buffer.from(got), Buffer.from(state));
  if (p !== provider || uid !== viewer.userId || !same) return fail("The connection request expired or didn't match — please try again.");
  const denied = req.nextUrl.searchParams.get("error_description") || req.nextUrl.searchParams.get("error");
  if (denied) return fail(`${PROVIDERS[provider].label} didn't grant access: ${denied.slice(0, 150)}`);
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return fail("No authorization code was returned.");

  try {
    const redirectUri = new URL(`/api/smms/oauth/${provider}/callback`, req.url).toString();
    const doc = await completeOAuth(provider, code, redirectUri, viewer.userId);
    await recordAudit({ actorId: viewer.userId, actorEmail: viewer.email, action: "connect", entity: "integration", entityId: provider, entityLabel: PROVIDERS[provider].label, summary: doc.accountName });
    back.searchParams.set("connected", provider);
    return NextResponse.redirect(back);
  } catch (err) {
    return fail(err instanceof SmmsInputError ? err.message : `Connecting ${PROVIDERS[provider].label} failed: ${(err as Error).message.slice(0, 150)}`);
  }
}
