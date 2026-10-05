import type { NextRequest } from "next/server";
import { resolveScope, requireSession, jsonError, HttpError } from "@/lib/messenger/route-helpers";
import { forwardMessage } from "@/lib/messenger/messages";
import { advanceChannelRead } from "@/lib/messenger/channels";
import { advanceDirectRead } from "@/lib/messenger/conversations";
import { getChatUsers } from "@/lib/messenger/users";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/messenger/messages/[id]/forward
 *   { fromScopeType, fromScopeId, toScopeType, toScopeId }
 * Copies the message into the target conversation as a "Forwarded from …" post.
 */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/messenger/messages/[id]/forward">) {
  try {
    const user = await requireSession();
    const { id } = await ctx.params;
    const data = (await request.json()) as {
      fromScopeType?: string;
      fromScopeId?: string;
      toScopeType?: string;
      toScopeId?: string;
    };

    const from = await resolveScope(data.fromScopeType, data.fromScopeId, user);
    const to = await resolveScope(data.toScopeType, data.toScopeId, user);
    if (!from.canRead) throw new HttpError(403, "You can't read the original message.");
    if (!to.canPost) throw new HttpError(403, "You can't post in the target conversation.");

    let sourceLabel = "a direct message";
    if (from.channel) sourceLabel = `#${from.channel.name}`;
    else if (from.conversation) {
      const otherId = from.conversation.participantIds.find((p) => p !== user.id);
      const users = otherId ? await getChatUsers([otherId]) : {};
      sourceLabel = otherId ? `your DM with ${users[otherId]?.displayName ?? "someone"}` : "a direct message";
    }

    const message = await forwardMessage({
      source: from.scope,
      messageId: id,
      target: to.scope,
      actorId: user.id,
      sourceLabel,
    });

    if (to.scope.type === "channel") await advanceChannelRead(to.scope.id, user.id, message.seq);
    else await advanceDirectRead(to.scope.id, user.id, message.seq);

    return Response.json({ message, target: { type: to.scope.type, id: to.scope.id } });
  } catch (err) {
    return jsonError(err);
  }
}
