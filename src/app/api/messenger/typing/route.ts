import type { NextRequest } from "next/server";
import { resolveScope, requireSession, jsonError } from "@/lib/messenger/route-helpers";
import { emit } from "@/lib/messenger/events";
import { getChatUser } from "@/lib/messenger/users";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST /api/messenger/typing  { scopeType, scopeId }  — emits an ephemeral typing ping. */
export async function POST(request: NextRequest) {
  try {
    const user = await requireSession();
    const data = (await request.json()) as { scopeType?: string; scopeId?: string };
    const resolved = await resolveScope(data.scopeType, data.scopeId, user);
    const me = await getChatUser(user.id);
    await emit({
      scope: resolved.scope,
      kind: "typing",
      payload: { userId: user.id, displayName: me?.displayName ?? "Someone" },
      actorId: user.id,
      ttlSeconds: 8,
    });
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
