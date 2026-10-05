import { NextRequest, NextResponse } from "next/server";
import { getChatbotConfig } from "@/lib/chatbot-config";
import { isElevenLabsConfigured, transcribeAudio } from "@/lib/elevenlabs";
import { checkRateLimit } from "@/lib/chatbot-rate-limit";
import { applyChatCookies, resolveSession } from "@/lib/chatbot-sessions";
import { getVisitorProfile } from "@/lib/chat-visitors";
import { ensureVoiceConversation, recordVoiceTranscript } from "@/lib/voice-conversations";

export const maxDuration = 30;

const MAX_AUDIO_BYTES = 12 * 1024 * 1024; // ~12 MB (roughly 2–3 min of Opus/webm)

export async function POST(req: NextRequest) {
  const config = await getChatbotConfig();

  if (!config.voice.enabled) {
    return NextResponse.json({ error: "Voice mode is turned off." }, { status: 403 });
  }
  if (!(await isElevenLabsConfigured())) {
    return NextResponse.json({ error: "Voice mode is not configured yet." }, { status: 503 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Request must be multipart form data." }, { status: 400 });
  }
  const audio = formData.get("audio");
  if (!(audio instanceof File) || audio.size === 0) {
    return NextResponse.json({ error: "No audio received." }, { status: 400 });
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: "That recording is too long — keep it under ~2 minutes." }, { status: 413 });
  }

  const { session, cookiesToSet } = await resolveSession(req);

  if (config.preChat.enabled) {
    const profile = await getVisitorProfile(session.visitorId);
    if (!profile) {
      const res = NextResponse.json(
        { error: "Please introduce yourself before starting the chat.", needsIdentification: true },
        { status: 403 }
      );
      return applyChatCookies(res, cookiesToSet);
    }
  }

  const rateLimit = await checkRateLimit(session.ipHash, config.rateLimit);
  if (!rateLimit.ok) {
    const res = NextResponse.json(
      { error: "You're sending messages too quickly. Please wait a moment.", retryAfter: rateLimit.retryAfter },
      { status: 429 }
    );
    res.headers.set("Retry-After", String(rateLimit.retryAfter));
    return applyChatCookies(res, cookiesToSet);
  }

  const buffer = Buffer.from(await audio.arrayBuffer());
  const startedAt = Date.now();

  let result;
  try {
    result = await transcribeAudio(buffer, audio.type || "audio/webm");
  } catch (err) {
    console.error("voice: transcription failed", err);
    const res = NextResponse.json({ error: "Couldn't understand that — please try again." }, { status: 502 });
    return applyChatCookies(res, cookiesToSet);
  }
  const sttMs = Date.now() - startedAt;

  if (!result.text) {
    const res = NextResponse.json({ text: "", empty: true, sttMs });
    return applyChatCookies(res, cookiesToSet);
  }

  await ensureVoiceConversation(session, config.voice.voiceId);
  const transcriptId = await recordVoiceTranscript({
    sessionId: session.sessionId,
    rawText: result.text,
    languageCode: result.languageCode,
    languageProbability: result.languageProbability,
    audioDurationSecs: result.audioDurationSecs,
    model: result.model,
  });

  const res = NextResponse.json({
    text: result.text,
    transcriptId,
    audioDurationMs: Math.round((result.audioDurationSecs ?? 0) * 1000),
    sttMs,
  });
  return applyChatCookies(res, cookiesToSet);
}
