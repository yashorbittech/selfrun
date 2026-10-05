import { NextRequest, NextResponse } from "next/server";
import { getCurrentLmsUser } from "@/lib/lms-auth";
import { getConversation } from "@/lib/chat-conversations";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const lmsUser = await getCurrentLmsUser();
  if (!lmsUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const detail = await getConversation(id);
  if (!detail) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(detail);
}
