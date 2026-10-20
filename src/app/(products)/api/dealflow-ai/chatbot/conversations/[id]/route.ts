import { withTransport } from "@/lib/security/transport";
import { NextRequest, NextResponse } from "next/server";
import { requireLms } from "@/lib/lms-auth";
import { getConversation } from "@/lib/chat-conversations";

async function handleGET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const lmsUser = await requireLms("VIEW_CHATBOT");
  if (!lmsUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const detail = await getConversation(id);
  if (!detail) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(detail);
}

export const GET = withTransport(handleGET);
