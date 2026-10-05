import { NextRequest, NextResponse } from "next/server";
import { getChatbotConfig } from "@/lib/chatbot-config";
import { isOpenAIConfigured } from "@/lib/openai";
import { isElevenLabsConfigured } from "@/lib/elevenlabs";
import { getVisitorIdFromRequest } from "@/lib/chatbot-sessions";
import { getVisitorProfile } from "@/lib/chat-visitors";
import { isDemoChat, isDemoVoice } from "@/lib/chat-demo";

/** Public subset of the chatbot config, for the welcome screen / composer. */
export async function GET(req: NextRequest) {
  const config = await getChatbotConfig();

  const visitorId = getVisitorIdFromRequest(req);
  const profile = visitorId ? await getVisitorProfile(visitorId) : null;

  const demo = await isDemoChat();
  const demoVoice = await isDemoVoice();
  const liveVoice = config.voice.enabled && (await isElevenLabsConfigured());

  return NextResponse.json({
    available: (await isOpenAIConfigured()) || demo,
    demo,
    welcomeMessage: config.welcomeMessage,
    suggestedQuestions: config.suggestedQuestions,
    maxMessageChars: config.rateLimit.maxMessageChars,
    preChat: {
      enabled: config.preChat.enabled,
      title: config.preChat.title,
      description: config.preChat.description,
      fields: config.preChat.fields,
      consentText: config.preChat.consentText,
    },
    identified: Boolean(profile),
    visitorName: profile?.name ?? null,
    voice: {
      enabled: config.voice.enabled || demoVoice,
      available: liveVoice || demoVoice,
      streaming: config.voice.streaming,
      // "browser" → Web Speech APIs (demo); "elevenlabs" → server STT/TTS.
      mode: demoVoice ? "browser" : "elevenlabs",
    },
  });
}
