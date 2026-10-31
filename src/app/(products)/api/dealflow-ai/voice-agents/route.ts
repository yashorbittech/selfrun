import { NextRequest, NextResponse } from "next/server";
import { listVoiceAgents, createVoiceAgent } from "@/lib/dealflow-ai/db-voice-agents";

export async function GET() {
  try {
    const agents = await listVoiceAgents();
    return NextResponse.json({ ok: true, agents });
  } catch (err) {
    console.error("[voice-agents] GET error:", err);
    return NextResponse.json({ ok: false, error: "Failed to load agents" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, role, personality, knowledgeBase, voiceId, voiceName, voiceGender } = body;

    if (!name || !role || !personality || !knowledgeBase || !voiceId || !voiceName) {
      return NextResponse.json({ ok: false, error: "All fields are required" }, { status: 400 });
    }

    // Generate initials and a deterministic avatar color
    const initials = name
      .split(" ")
      .slice(0, 2)
      .map((w: string) => w[0]?.toUpperCase() ?? "")
      .join("");

    const colors = [
      "bg-violet-600", "bg-blue-600", "bg-emerald-600", "bg-rose-600",
      "bg-amber-600", "bg-indigo-600", "bg-teal-600", "bg-pink-600",
    ];
    const avatarColor = colors[name.charCodeAt(0) % colors.length];

    const agent = await createVoiceAgent({
      name,
      role,
      personality,
      knowledgeBase,
      voiceId,
      voiceName,
      voiceGender: voiceGender ?? "female",
      avatarColor,
      avatarInitials: initials || name.slice(0, 2).toUpperCase(),
      isActive: true,
    });

    return NextResponse.json({ ok: true, agent }, { status: 201 });
  } catch (err) {
    console.error("[voice-agents] POST error:", err);
    return NextResponse.json({ ok: false, error: "Failed to create agent" }, { status: 500 });
  }
}
