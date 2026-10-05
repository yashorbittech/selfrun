import type { NextRequest } from "next/server";
import { requireSession, jsonError } from "@/lib/messenger/route-helpers";
import { heartbeat, type PresenceStatus } from "@/lib/messenger/presence";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CHOOSABLE: PresenceStatus[] = ["online", "away", "busy", "in_meeting"];

/** POST /api/messenger/presence  { status?, customStatus? } */
export async function POST(request: NextRequest) {
  try {
    const user = await requireSession();
    let body: { status?: string; customStatus?: string | null } = {};
    try {
      body = await request.json();
    } catch {
      // a bare heartbeat with no body is fine
    }
    const status = CHOOSABLE.includes(body.status as PresenceStatus)
      ? (body.status as Exclude<PresenceStatus, "offline">)
      : undefined;
    await heartbeat(user.id, status, body.customStatus === undefined ? undefined : body.customStatus);
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
