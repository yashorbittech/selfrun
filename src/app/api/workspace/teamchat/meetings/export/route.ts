import { NextRequest, NextResponse } from "next/server";
import { authorizeWorkspaceApi } from "@/lib/workspace/access";
import { exportMeetings } from "@/lib/workspace/teamchat";
import { toCsv } from "@/lib/csv";

export async function GET(req: NextRequest) {
  const auth = await authorizeWorkspaceApi("manage.teamchat.meetings");
  if (!auth.ok) return auth.response;

  const sp = req.nextUrl.searchParams;
  const rows = await exportMeetings({
    search: sp.get("search") ?? undefined,
    status: sp.get("status") ?? undefined,
  });

  const csv = toCsv(rows, [
    { header: "Title", value: (r) => r.title },
    { header: "Host", value: (r) => r.hostName },
    { header: "Kind", value: (r) => r.kind },
    { header: "Status", value: (r) => r.status },
    { header: "Start", value: (r) => r.startAt },
    { header: "Duration (mins)", value: (r) => String(r.durationMins) },
    { header: "Participants", value: (r) => String(r.participantCount) },
    { header: "Recording Enabled", value: (r) => (r.recordingEnabled ? "Yes" : "No") },
  ]);

  const filename = `admin-teamchat-meetings-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
