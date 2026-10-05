import type { NextRequest } from "next/server";
import { resolveScope, requireSession, jsonError, HttpError } from "@/lib/messenger/route-helpers";
import {
  postMessage,
  editMessage,
  softDeleteMessage,
  listMessages,
  listThread,
} from "@/lib/messenger/messages";
import { getChatUser } from "@/lib/messenger/users";
import { advanceChannelRead } from "@/lib/messenger/channels";
import { advanceDirectRead } from "@/lib/messenger/conversations";
import type { Attachment } from "@/lib/messenger/attachments";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET  /api/messenger/messages?scopeType=&scopeId=&beforeSeq=&threadRootId= */
export async function GET(request: NextRequest) {
  try {
    const user = await requireSession();
    const sp = request.nextUrl.searchParams;
    const resolved = await resolveScope(sp.get("scopeType"), sp.get("scopeId"), user);
    const me = await getChatUser(user.id);
    const starredIds = me?.starredMessageIds ?? [];

    const threadRootId = sp.get("threadRootId");
    if (threadRootId) {
      const messages = await listThread(resolved.scope, threadRootId, user.id, starredIds);
      return Response.json({ messages });
    }

    const beforeSeq = sp.get("beforeSeq") ? Number(sp.get("beforeSeq")) : undefined;
    const messages = await listMessages({
      scope: resolved.scope,
      viewerId: user.id,
      starredIds,
      beforeSeq: Number.isFinite(beforeSeq) ? beforeSeq : undefined,
      limit: sp.get("limit") ? Number(sp.get("limit")) : undefined,
    });
    return Response.json({ messages });
  } catch (err) {
    return jsonError(err);
  }
}

/** POST /api/messenger/messages  { scopeType, scopeId, body, attachments?, mentions?, parentId? } */
export async function POST(request: NextRequest) {
  try {
    const user = await requireSession();
    const data = (await request.json()) as {
      scopeType?: string;
      scopeId?: string;
      body?: string;
      attachments?: Attachment[];
      mentions?: string[];
      parentId?: string | null;
    };
    const resolved = await resolveScope(data.scopeType, data.scopeId, user);
    if (!resolved.canPost) throw new HttpError(403, "You can't post in this conversation.");

    const message = await postMessage({
      scope: resolved.scope,
      authorId: user.id,
      body: data.body ?? "",
      attachments: Array.isArray(data.attachments) ? data.attachments.slice(0, 10) : [],
      mentions: Array.isArray(data.mentions) ? data.mentions : [],
      parentId: typeof data.parentId === "string" ? data.parentId : null,
    });

    // Posting marks the conversation read up to this message for the author.
    if (resolved.scope.type === "channel") await advanceChannelRead(resolved.scope.id, user.id, message.seq);
    else await advanceDirectRead(resolved.scope.id, user.id, message.seq);

    return Response.json({ message });
  } catch (err) {
    return jsonError(err);
  }
}

/** PATCH /api/messenger/messages  { scopeType, scopeId, messageId, body, attachments? } */
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireSession();
    const data = (await request.json()) as {
      scopeType?: string;
      scopeId?: string;
      messageId?: string;
      body?: string;
      attachments?: Attachment[];
    };
    const resolved = await resolveScope(data.scopeType, data.scopeId, user);
    if (!data.messageId) throw new HttpError(400, "Missing message.");
    const message = await editMessage(resolved.scope, data.messageId, user.id, data.body ?? "", data.attachments);
    return Response.json({ message });
  } catch (err) {
    return jsonError(err);
  }
}

/** DELETE /api/messenger/messages  { scopeType, scopeId, messageId } */
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireSession();
    const data = (await request.json()) as { scopeType?: string; scopeId?: string; messageId?: string };
    const resolved = await resolveScope(data.scopeType, data.scopeId, user);
    if (!data.messageId) throw new HttpError(400, "Missing message.");
    await softDeleteMessage(resolved.scope, data.messageId, { id: user.id, isModerator: resolved.isModerator });
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
