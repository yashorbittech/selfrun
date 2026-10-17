import type { NextRequest } from "next/server";
import { requireSession, jsonError, HttpError } from "@/lib/products/huddle-ai/route-helpers";
import { toggleStarredMessage } from "@/lib/products/huddle-ai/users";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST /api/huddle-ai/star  { messageId } — toggles a personal star. */
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
