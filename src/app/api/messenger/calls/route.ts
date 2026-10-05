import type { NextRequest } from "next/server";
import { resolveScope, requireSession, jsonError, HttpError } from "@/lib/messenger/route-helpers";
import { startCall, getActiveCallForScope, serializeCall, getIceServers } from "@/lib/messenger/calls";
import type { CallMode } from "@/lib/messenger/call-constants";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/messenger/calls?scopeType=&scopeId=  — the active call for a conversation, if any. */
export async function GET(request: NextRequest) {
  try {
    const user = await requireSession();
    const sp = request.nextUrl.searchParams;
    const resolved = await resolveScope(sp.get("scopeType"), sp.get("scopeId"), user);
    const call = await getActiveCallForScope(resolved.scope);
    return Response.json({ call: call ? await serializeCall(call, user.id) : null });
  } catch (err) {
    return jsonError(err);
  }
}

/** POST /api/messenger/calls  { scopeType, scopeId, mode, meetingId? }  — start (or reuse) a call. */
export async function POST(request: NextRequest) {
  try {
    const user = await requireSession();
    const data = (await request.json()) as { scopeType?: string; scopeId?: string; mode?: CallMode; meetingId?: string | null };
    const resolved = await resolveScope(data.scopeType, data.scopeId, user);
    if (!resolved.canPost) throw new HttpError(403, "You can't start a call here.");

    const mode: CallMode = data.mode === "audio" ? "audio" : "video";
    const result = await startCall({
      scope: resolved.scope,
      mode,
      initiatorId: user.id,
      meetingId: typeof data.meetingId === "string" ? data.meetingId : null,
    });
    if (!result.ok) throw new HttpError(400, result.error);

    return Response.json({
      callId: result.call._id,
      reused: result.reused,
      iceServers: (await getIceServers()),
      call: await serializeCall(result.call, user.id),
    });
  } catch (err) {
    return jsonError(err);
  }
}
