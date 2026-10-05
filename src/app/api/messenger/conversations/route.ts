import { requireSession, jsonError } from "@/lib/messenger/route-helpers";
import { listMemberChannels } from "@/lib/messenger/channels";
import { listConversationsForUser } from "@/lib/messenger/conversations";
import { getChatUsers } from "@/lib/messenger/users";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/messenger/conversations — the caller's channels + DMs, for pickers (forward, share). */
export async function GET() {
  try {
    const user = await requireSession();
    const [channels, convs] = await Promise.all([
      listMemberChannels(user.id),
      listConversationsForUser(user.id),
    ]);
    const otherIds = convs.map((c) => c.participantIds.find((p) => p !== user.id) ?? user.id);
    const users = await getChatUsers(otherIds);

    return Response.json({
      channels: channels
        .filter((c) => !c.archivedAt)
        .map((c) => ({ id: c._id, name: c.name, slug: c.slug, kind: c.kind, visibility: c.visibility })),
      dms: convs.map((c) => {
        const otherId = c.participantIds.find((p) => p !== user.id) ?? user.id;
        return { id: c._id, name: users[otherId]?.displayName ?? "Unknown" };
      }),
    });
  } catch (err) {
    return jsonError(err);
  }
}
