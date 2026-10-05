import { NextRequest, NextResponse } from "next/server";
import { readSafeJson } from "@/lib/security/safe-json";
import type OpenAI from "openai";
import { isOpenAIConfigured } from "@/lib/openai";
import { getChatbotConfig } from "@/lib/chatbot-config";
import { sanitizeUserMessage } from "@/lib/prompt-safety";
import { checkRateLimit } from "@/lib/chatbot-rate-limit";
import {
  applyChatCookies,
  resolveSession,
  recordUserMessage,
  recordAssistantMessage,
  getConversationHistory,
} from "@/lib/chatbot-sessions";
import { prepareAnswer, streamAnswer, resolveCitations } from "@/lib/chatbot-rag";
import { getVisitorProfile } from "@/lib/chat-visitors";
import { getCompanyBrand } from "@/lib/platform/branding";
import { companySiteUrl } from "@/lib/platform/tenancy/site-url";
import { isDemoChat, answerDemoQuestion, streamDemoAnswer, DEMO_MODEL } from "@/lib/chat-demo";

// Long-running streamed completion.
export const maxDuration = 60;

const GENERIC_ERROR = "Sorry — something went wrong generating a response. Please try again.";

export async function POST(req: NextRequest) {
  const demo = await isDemoChat();

  if (!demo && !(await isOpenAIConfigured())) {
    return NextResponse.json(
      { error: "The AI assistant is not configured yet. Please try again later." },
      { status: 503 }
    );
  }

  let body: { message?: unknown; sourcePage?: unknown; voice?: unknown };
  try {
    body = (await readSafeJson(req)) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const isVoice = body.voice === true;

  const config = await getChatbotConfig();
  const sanitized = sanitizeUserMessage(body.message, config.rateLimit.maxMessageChars);
  if (!sanitized.ok) {
    return NextResponse.json({ error: sanitized.error }, { status: 400 });
  }

  const sourcePage = typeof body.sourcePage === "string" ? body.sourcePage : null;
  const { session, cookiesToSet } = await resolveSession(req, { sourcePage });

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
      {
        error:
          rateLimit.scope === "day"
            ? "You've reached today's message limit. Please come back tomorrow or contact our team directly."
            : "You're sending messages too quickly. Please wait a few seconds and try again.",
        retryAfter: rateLimit.retryAfter,
      },
      { status: 429 }
    );
    res.headers.set("Retry-After", String(rateLimit.retryAfter));
    return applyChatCookies(res, cookiesToSet);
  }

  // Persist the user's message up front so it survives a mid-stream failure.
  const userMsg = await recordUserMessage(session.sessionId, sanitized.text, {
    flaggedInjection: sanitized.flaggedInjection,
    voice: isVoice,
  });

  const historyWithNew = await getConversationHistory(session.sessionId, config.contextMessageLimit + 4);
  const priorHistory = historyWithNew.slice(0, -1); // drop the message we just inserted

  const encoder = new TextEncoder();
  const startedAt = Date.now();

  // ---- Demo mode: scripted, locally-streamed answer -----------------------
  if (demo) {
    const answer = answerDemoQuestion(sanitized.text, { name: (await getCompanyBrand()).name, siteUrl: await companySiteUrl() });
    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (obj: unknown) =>
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        send({ type: "session", sessionId: session.sessionId });

        let full = "";
        try {
          for await (const chunk of streamDemoAnswer(answer.text)) {
            full += chunk;
            send({ type: "delta", text: chunk });
          }
          const assistantMsg = await recordAssistantMessage(session.sessionId, {
            content: full,
            citations: answer.citations,
            model: DEMO_MODEL,
            responseTimeMs: Date.now() - startedAt,
            voice: isVoice,
          });
          send({
            type: "done",
            messageId: String(assistantMsg._id),
            userMessageId: String(userMsg._id),
            citations: answer.citations,
          });
        } catch (err) {
          console.error("chat(demo): stream error", err);
          send({ type: "error", message: GENERIC_ERROR });
        } finally {
          controller.close();
        }
      },
    });

    const res = new NextResponse(readable, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
    return applyChatCookies(res, cookiesToSet);
  }

  // ---- Live mode: OpenAI Responses API ------------------------------------
  let prepared;
  let stream;
  try {
    prepared = await prepareAnswer(priorHistory, sanitized.text);
    stream = await streamAnswer(prepared);
  } catch (err) {
    console.error("chat: failed to start stream", err);
    await recordAssistantMessage(session.sessionId, {
      content: "",
      error: err instanceof Error ? err.message : "stream start failed",
      model: config.model,
      voice: isVoice,
    });
    const res = NextResponse.json({ error: GENERIC_ERROR }, { status: 502 });
    return applyChatCookies(res, cookiesToSet);
  }

  const model = prepared.config.model;

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

      send({ type: "session", sessionId: session.sessionId });

      let full = "";
      let finalResponse: OpenAI.Responses.Response | null = null;

      try {
        for await (const event of stream!) {
          switch (event.type) {
            case "response.output_text.delta":
            case "response.refusal.delta":
              full += event.delta;
              send({ type: "delta", text: event.delta });
              break;
            case "response.file_search_call.searching":
            case "response.file_search_call.in_progress":
              send({ type: "status", value: "searching" });
              break;
            case "response.completed":
              finalResponse = event.response;
              break;
            case "response.failed":
              throw new Error(event.response.error?.message ?? "response failed");
            case "error":
              throw new Error(event.message ?? "stream error");
          }
        }

        const citations = finalResponse ? await resolveCitations(finalResponse) : [];
        const usage = finalResponse?.usage;
        const assistantMsg = await recordAssistantMessage(session.sessionId, {
          content: full,
          citations,
          model,
          responseTimeMs: Date.now() - startedAt,
          promptTokens: usage?.input_tokens,
          completionTokens: usage?.output_tokens,
          voice: isVoice,
        });
        send({
          type: "done",
          messageId: String(assistantMsg._id),
          userMessageId: String(userMsg._id),
          citations,
        });
      } catch (err) {
        console.error("chat: stream error", err);
        await recordAssistantMessage(session.sessionId, {
          content: full,
          error: err instanceof Error ? err.message : "stream error",
          model,
          responseTimeMs: Date.now() - startedAt,
          voice: isVoice,
        });
        send({ type: "error", message: GENERIC_ERROR });
      } finally {
        controller.close();
      }
    },
  });

  const res = new NextResponse(readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
  return applyChatCookies(res, cookiesToSet);
}
