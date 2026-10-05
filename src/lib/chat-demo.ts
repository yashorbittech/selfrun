import "server-only";
import { isOpenAIConfigured } from "@/lib/openai";
import { isElevenLabsConfigured } from "@/lib/elevenlabs";
import type { ChatCitation } from "@/lib/chatbot-sessions";

/**
 * Scripted "demo mode" assistant.
 *
 * When the real OpenAI backend isn't configured, the Ask-the-assistant experience
 * still needs to be fully interactive for demos and design review. This module
 * produces grounded, Markdown-formatted answers from a small generic
 * script and streams them token-by-token so the chat window behaves
 * exactly as it would with a live model. The moment `OPENAI_API_KEY` is set,
 * `isDemoChat()` returns false and the real RAG pipeline takes over untouched.
 */

export async function isDemoChat(): Promise<boolean> {
  return !(await isOpenAIConfigured());
}

/** In demo mode, Voice Mode runs entirely on the browser's Web Speech APIs. */
export async function isDemoVoice(): Promise<boolean> {
  return (await isDemoChat()) && !(await isElevenLabsConfigured());
}

export const DEMO_MODEL = "demo";

export interface DemoAnswer {
  text: string;
  citations: ChatCitation[];
}

/** Who the demo assistant speaks for — the current company. */
export interface DemoContext {
  name: string;
  siteUrl: string;
}

const cite = (ctx: DemoContext, title: string, path: string, id: string): ChatCitation => ({ fileId: `demo-${id}`, kind: "website" as const, title, url: `${ctx.siteUrl}${path}` });

/** A scripted, generic answer in the company's own name (demo mode only — no company facts are invented). */
export function answerDemoQuestion(rawQuestion: string, ctx: DemoContext): DemoAnswer {
  const text = ` ${rawQuestion.toLowerCase().replace(/[^\w\s]/g, " ")} `;
  const has = (...words: string[]) => words.some((w) => text.includes(` ${w}`));
  if (text.trim().length <= 4 || has("hi ", "hello", "hey")) {
    return { text: `Hi! I'm the ${ctx.name} AI Assistant. Ask me about our services or how to get in touch. What would you like to know?`, citations: [] };
  }
  if (has("contact", "email", "phone", "reach", "quote", "price", "pricing")) {
    return { text: `You can reach ${ctx.name} through the [contact page](${ctx.siteUrl}/contact) — send a message and the team will get back to you.`, citations: [cite(ctx, "Contact Us", "/contact", "contact")] };
  }
  if (has("service", "offer", "what do you", "capabilit", "product")) {
    return { text: `You'll find everything ${ctx.name} offers on the [services page](${ctx.siteUrl}/services). For anything specific, the fastest path is the [contact page](${ctx.siteUrl}/contact).`, citations: [cite(ctx, "Our Services", "/services", "services")] };
  }
  return {
    text: `I don't have a specific answer to that in demo mode. For details about ${ctx.name}, please see the [services page](${ctx.siteUrl}/services) or reach the team through the [contact page](${ctx.siteUrl}/contact).`,
    citations: [cite(ctx, "Our Services", "/services", "fallback-services"), cite(ctx, "Contact Us", "/contact", "fallback-contact")],
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Streams `text` in small chunks with human-paced delays so the chat window's
 * streaming cursor, auto-scroll, and typing indicator all exercise the same
 * code paths as a live model response.
 */
export async function* streamDemoAnswer(text: string): AsyncGenerator<string> {
  // Break on word boundaries but emit 1–3 words per frame.
  const tokens = text.match(/\S+\s*/g) ?? [text];
  await sleep(450); // "thinking" beat before the first token
  let buffer = "";
  let sinceFlush = 0;
  for (const token of tokens) {
    buffer += token;
    sinceFlush += 1;
    const atBreak = /[.!?:\n]\s*$/.test(token);
    if (sinceFlush >= 2 || atBreak) {
      yield buffer;
      buffer = "";
      sinceFlush = 0;
      await sleep(atBreak ? 90 : 45);
    }
  }
  if (buffer) yield buffer;
}
