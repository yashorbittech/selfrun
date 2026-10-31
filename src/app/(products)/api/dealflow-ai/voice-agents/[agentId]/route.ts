import { NextRequest, NextResponse } from "next/server";
import { getVoiceAgent, updateVoiceAgent, deleteVoiceAgent } from "@/lib/dealflow-ai/db-voice-agents";

export async function GET(_: NextRequest, { params }: { params: Promise<{ agentId: string }> }) {
  try {
    const { agentId } = await params;
    const agent = await getVoiceAgent(agentId);
    if (!agent) return NextResponse.json({ ok: false, error: "Agent not found" }, { status: 404 });
    return NextResponse.json({ ok: true, agent });
  } catch (err) {
    console.error("[voice-agents/[id]] GET error:", err);
    return NextResponse.json({ ok: false, error: "Failed to load agent" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ agentId: string }> }) {
  try {
    const { agentId } = await params;
    const data = await req.json();
    const updated = await updateVoiceAgent(agentId, data);
    if (!updated) return NextResponse.json({ ok: false, error: "Agent not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[voice-agents/[id]] PATCH error:", err);
    return NextResponse.json({ ok: false, error: "Failed to update agent" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ agentId: string }> }) {
  try {
    const { agentId } = await params;
    const deleted = await deleteVoiceAgent(agentId);
    if (!deleted) return NextResponse.json({ ok: false, error: "Agent not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[voice-agents/[id]] DELETE error:", err);
    return NextResponse.json({ ok: false, error: "Failed to delete agent" }, { status: 500 });
  }
}
