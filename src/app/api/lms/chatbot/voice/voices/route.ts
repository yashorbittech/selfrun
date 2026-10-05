import { NextRequest, NextResponse } from "next/server";
import { getCurrentLmsUser } from "@/lib/lms-auth";
import { isElevenLabsConfigured, listVoices } from "@/lib/elevenlabs";

/** ElevenLabs voice catalogue for the AI Config voice picker. */
export async function GET(_req: NextRequest) {
  const lmsUser = await getCurrentLmsUser();
  if (!lmsUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isElevenLabsConfigured())) return NextResponse.json({ voices: [], configured: false });

  try {
    const voices = await listVoices();
    return NextResponse.json({ voices, configured: true });
  } catch (err) {
    console.error("voice: failed to list voices", err);
    return NextResponse.json({ voices: [], configured: true, error: "Couldn't load voices from ElevenLabs." });
  }
}
