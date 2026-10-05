import type { NextRequest } from "next/server";
import { resolveScope, requireSession, jsonError, HttpError } from "@/lib/messenger/route-helpers";
import { advanceChannelRead } from "@/lib/messenger/channels";
import { advanceDirectRead } from "@/lib/messenger/conversations";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST /api/messenger/read  { scopeType, scopeId, seq }  — advances the caller's read cursor. */
export async function POST(request: NextRequest) {
  try {
    const user = await requireSession();
    const data = (await request.json()) as { scopeType?: string; scopeId?: string; seq?: number };
    const resolved = await resolveScope(data.scopeType, data.scopeId, user);
    const seq = Number(data.seq);
    if (!Number.isFinite(seq) || seq < 0) throw new HttpError(400, "Invalid position.");

    if (resolved.scope.type === "channel") await advanceChannelRead(resolved.scope.id, user.id, seq);
    else await advanceDirectRead(resolved.scope.id, user.id, seq);

    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
