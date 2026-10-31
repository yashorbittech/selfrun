import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { getMeeting } from "@/lib/dealflow-ai/db-meetings";

/**
 * POST /api/dealflow-ai/meetings/[roomId]/token
 * Generates a LiveKit access token for a participant to join a meeting room.
 *
 * Body: { participantName: string; participantType: "sales" | "client" | "agent"; agentName?: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await req.json();
    const { participantName, participantType } = body;

    if (!participantName || !participantType) {
      return NextResponse.json({ ok: false, error: "participantName and participantType required" }, { status: 400 });
    }

    const meeting = await getMeeting(roomId);
    if (!meeting) {
      return NextResponse.json({ ok: false, error: "Meeting not found" }, { status: 404 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
      return NextResponse.json({ ok: false, error: "LiveKit credentials not configured" }, { status: 503 });
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: `${participantType}-${participantName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      name: participantName,
      ttl: "4h",
    });

    at.addGrant({
      roomJoin: true,
      room: meeting.roomId,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({
      ok: true,
      token,
      url: livekitUrl,
      roomId: meeting.roomId,
    });
  } catch (err) {
    console.error("[meetings/token] POST error:", err);
    return NextResponse.json({ ok: false, error: "Failed to generate token" }, { status: 500 });
  }
}
