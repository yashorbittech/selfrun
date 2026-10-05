import type { NextRequest } from "next/server";
import { requireSession, jsonError, HttpError } from "@/lib/messenger/route-helpers";
import { toggleStarredMessage } from "@/lib/messenger/users";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST /api/messenger/star  { messageId } — toggles a personal star. */
export async function POST(request: NextRequest) {
  try {
    const user = await requireSession();
    const { messageId } = (await request.json()) as { messageId?: string };
    if (!messageId) throw new HttpError(400, "Missing message.");
    const starred = await toggleStarredMessage(user.id, messageId);
    return Response.json({ starred });
  } catch (err) {
    return jsonError(err);
  }
}
