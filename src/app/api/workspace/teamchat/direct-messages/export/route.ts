import { NextRequest, NextResponse } from "next/server";
import { authorizeWorkspaceApi } from "@/lib/workspace/access";
import { exportDirectConversations } from "@/lib/workspace/teamchat";
import { toCsv } from "@/lib/csv";

export async function GET(req: NextRequest) {
  const auth = await authorizeWorkspaceApi("manage.teamchat.direct-messages");
  if (!auth.ok) return auth.response;

  const sp = req.nextUrl.searchParams;
  const rows = await exportDirectConversations({ search: sp.get("search") ?? undefined });

  const csv = toCsv(rows, [
    { header: "Participant A", value: (r) => r.participantA },
    { header: "Participant B", value: (r) => r.participantB },
    { header: "Last Message Preview", value: (r) => r.lastMessagePreview ?? "" },
    { header: "Last Message At", value: (r) => r.lastMessageAt },
    { header: "Started", value: (r) => r.createdAt },
  ]);

  const filename = `admin-teamchat-dms-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
