import { NextRequest, NextResponse } from "next/server";
import { applyChatCookies, startNewConversation } from "@/lib/chatbot-sessions";

/** Ends the current conversation and issues a fresh session cookie. */
export async function POST(req: NextRequest) {
  const { session, cookiesToSet } = await startNewConversation(req);
  const res = NextResponse.json({ sessionId: session.sessionId });
  return applyChatCookies(res, cookiesToSet);
}
