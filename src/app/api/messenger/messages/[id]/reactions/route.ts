import type { NextRequest } from "next/server";
import { resolveScope, requireSession, jsonError, HttpError } from "@/lib/messenger/route-helpers";
import { toggleReaction } from "@/lib/messenger/messages";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST /api/messenger/messages/[id]/reactions  { scopeType, scopeId, emoji } */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/messenger/messages/[id]/reactions">) {
  try {
    const user = await requireSession();
    const { id } = await ctx.params;
    const data = (await request.json()) as { scopeType?: string; scopeId?: string; emoji?: string };
    const resolved = await resolveScope(data.scopeType, data.scopeId, user);
    if (!resolved.canPost) throw new HttpError(403, "You can't react in this conversation.");
    if (!data.emoji) throw new HttpError(400, "Missing emoji.");
    const result = await toggleReaction(resolved.scope, id, user.id, data.emoji);
    return Response.json(result);
  } catch (err) {
    return jsonError(err);
  }
}
