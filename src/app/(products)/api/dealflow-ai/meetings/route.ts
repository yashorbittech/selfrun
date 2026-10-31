import { NextRequest, NextResponse } from "next/server";
import { listMeetings, createMeeting } from "@/lib/dealflow-ai/db-meetings";
import { getVoiceAgent } from "@/lib/dealflow-ai/db-voice-agents";
import { nanoid } from "@/lib/dealflow-ai/nanoid";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as "scheduled" | "live" | "ended" | null;
    const meetings = await listMeetings(status ? { status } : undefined);
    return NextResponse.json({ ok: true, meetings });
  } catch (err) {
    console.error("[meetings] GET error:", err);
    return NextResponse.json({ ok: false, error: "Failed to load meetings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      clientName,
      clientEmail,
      clientPhone,
      clientCompany,
      scheduledAt,
      durationMinutes,
      agentIds,
      salesPersonName,
      notes,
    } = body;

    if (!title || !clientName || !clientEmail || !scheduledAt) {
      return NextResponse.json({ ok: false, error: "title, clientName, clientEmail, scheduledAt are required" }, { status: 400 });
    }

    // Generate unique room slug
    const roomId = `df-${nanoid(10)}`;

    // Fetch agent names for display
    const agentNames: string[] = [];
    if (Array.isArray(agentIds)) {
      for (const id of agentIds) {
        const agent = await getVoiceAgent(id);
        if (agent) agentNames.push(agent.name);
      }
    }

    // Client join link — public page, no auth required
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const clientJoinLink = `${baseUrl}/meeting/${roomId}`;

    const meeting = await createMeeting({
      roomId,
      title,
      clientName,
      clientEmail,
      clientPhone: clientPhone ?? "",
      clientCompany: clientCompany ?? "",
      scheduledAt,
      durationMinutes: durationMinutes ?? 30,
      status: "scheduled",
      agentIds: agentIds ?? [],
      agentNames,
      salesPersonName: salesPersonName ?? "",
      notes: notes ?? "",
      clientJoinLink,
    });

    return NextResponse.json({ ok: true, meeting }, { status: 201 });
  } catch (err) {
    console.error("[meetings] POST error:", err);
    return NextResponse.json({ ok: false, error: "Failed to create meeting" }, { status: 500 });
  }
}
