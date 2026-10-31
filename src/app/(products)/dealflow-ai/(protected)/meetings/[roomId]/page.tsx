import { notFound } from "next/navigation";
import { getMeeting } from "@/lib/dealflow-ai/db-meetings";
import { getVoiceAgent } from "@/lib/dealflow-ai/db-voice-agents";
import MeetingRoomClient from "./MeetingRoomClient";
import { requireLmsPage } from "@/lib/lms-auth";

export const dynamic = "force-dynamic";

export default async function MeetingRoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ mode?: string; name?: string }>;
}) {
  // Sales people need to be authenticated
  const sp = await searchParams;
  const mode = (sp.mode === "client" ? "client" : "sales") as "sales" | "client";

  if (mode === "sales") {
    await requireLmsPage("VIEW_LEADS");
  }

  const { roomId } = await params;
  const meeting = await getMeeting(roomId);
  if (!meeting) notFound();

  // Fetch all assigned agents
  const agents = (
    await Promise.all(meeting.agentIds.map((id) => getVoiceAgent(id)))
  ).filter(Boolean);

  const participantName =
    mode === "client"
      ? (sp.name ?? meeting.clientName)
      : (sp.name ?? meeting.salesPersonName ?? "Sales Person");

  return (
    <MeetingRoomClient
      meeting={{
        roomId: meeting.roomId,
        title: meeting.title,
        clientName: meeting.clientName,
        clientEmail: meeting.clientEmail,
        status: meeting.status,
        agentIds: meeting.agentIds,
        agentNames: meeting.agentNames,
        salesPersonName: meeting.salesPersonName ?? "",
        clientJoinLink: meeting.clientJoinLink,
        notes: meeting.notes ?? "",
      }}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      agents={agents as any[]}
      participantMode={mode}
      participantName={participantName}
    />
  );
}
