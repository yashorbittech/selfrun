import { NextResponse } from "next/server";
import {
  listVoiceCalls,
  initiateAiVoiceCall,
  takeoverVoiceCall,
  endVoiceCall,
} from "@/lib/dealflow-ai/store";

export async function GET() {
  const calls = listVoiceCalls();
  return NextResponse.json({ ok: true, calls });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "initiate") {
      const { entityType, entityId, contactName, phoneNumber, initiatedBy, initialObjective } = body;
      if (!phoneNumber || !contactName) {
        return NextResponse.json({ ok: false, error: "contactName and phoneNumber are required." }, { status: 400 });
      }

      const call = initiateAiVoiceCall({
        entityType: entityType || "lead",
        entityId: entityId || "LEAD-MANUAL",
        contactName,
        phoneNumber,
        initiatedBy: initiatedBy || "Staff Agent Authorized",
        initialObjective,
      });

      return NextResponse.json({
        ok: true,
        message: `AI Voice Call authorized & connected to ${phoneNumber}`,
        call,
      });
    }

    if (action === "takeover") {
      const { callId, agentName } = body;
      const call = takeoverVoiceCall(callId, agentName);
      if (!call) return NextResponse.json({ ok: false, error: "Call not found." }, { status: 404 });
      return NextResponse.json({
        ok: true,
        message: `Human agent ${agentName || "Director"} has successfully taken over the live voice call!`,
        call,
      });
    }

    if (action === "end") {
      const { callId, duration } = body;
      const call = endVoiceCall(callId, duration);
      if (!call) return NextResponse.json({ ok: false, error: "Call not found." }, { status: 404 });
      return NextResponse.json({
        ok: true,
        message: "Voice call completed and saved to call records with AI transcript.",
        call,
      });
    }

    return NextResponse.json({ ok: false, error: "Invalid action." }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
