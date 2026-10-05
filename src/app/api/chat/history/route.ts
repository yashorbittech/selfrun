import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, listSessionMessages } from "@/lib/chatbot-sessions";

/** Returns the current browser session's transcript (lazy-loaded, paginated). */
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ sessionId: null, messages: [], hasMore: false, nextCursor: null });
  }

  const { searchParams } = req.nextUrl;
  const limit = Number(searchParams.get("limit")) || 50;
  const before = searchParams.get("before") ?? undefined;

  const { items, hasMore, nextCursor } = await listSessionMessages(session.sessionId, { limit, before });
  return NextResponse.json({
    sessionId: session.sessionId,
    messages: items,
    hasMore,
    nextCursor,
    startedAt: session.startedAt,
  });
}
