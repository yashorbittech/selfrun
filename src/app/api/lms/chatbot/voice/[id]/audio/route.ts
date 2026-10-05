import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedLmsRequest } from "@/lib/api-auth";
import { getVoiceMessageAudioKey } from "@/lib/voice-conversations";
import { readVoiceAudioStream } from "@/lib/voice-storage";

type Context = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Context) {
  if (!(await isAuthorizedLmsRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const msg = req.nextUrl.searchParams.get("msg");
  if (!msg) return NextResponse.json({ error: "Missing message id." }, { status: 400 });

  const key = await getVoiceMessageAudioKey(id, msg);
  if (!key) return NextResponse.json({ error: "Audio not found." }, { status: 404 });

  const object = await readVoiceAudioStream(key);
  if (!object) return NextResponse.json({ error: "Audio not found." }, { status: 404 });

  return new NextResponse(object.stream, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "private, max-age=3600",
      "Content-Disposition": `inline; filename="voice-${msg}.mp3"`,
    },
  });
}
