import "server-only";
import type OpenAI from "openai";
import { getOpenAI, isOpenAIConfigured, isUnsupportedParamError } from "@/lib/openai";
import { getSettings, estimateCost, type AiSettings } from "@/lib/smms/settings";
import { countUserAiToday } from "@/lib/smms/generations";
import { SmmsInputError } from "@/lib/smms/viewer";
import { PLATFORM_META, isPlatform, type ImageSize } from "@/lib/smms/constants";
import { aiBlockReason, isBillingLimitError } from "@/lib/platform/billing/enforce";

/**
 * The only AI provider in SMMS is OpenAI. Text goes through the Responses API
 * with a strict JSON-schema output format, so every generation comes back as
 * structured data the editors can show field by field; images come from the
 * Images API. Nothing here publishes anything — generation and publishing are
 * separate steps (see `publishing.ts`).
 */

// ── JSON schema builders (strict mode: every property required, no extras) ──

type Schema = Record<string, unknown>;
const S = {
  str: (description?: string): Schema => ({ type: "string", ...(description ? { description } : {}) }),
  num: (description?: string): Schema => ({ type: "number", ...(description ? { description } : {}) }),
  arr: (items: Schema, description?: string): Schema => ({ type: "array", items, ...(description ? { description } : {}) }),
  enum: (values: string[]): Schema => ({ type: "string", enum: values }),
  obj: (properties: Record<string, Schema>): Schema => ({ type: "object", properties, required: Object.keys(properties), additionalProperties: false }),
};

const SCENE = S.obj({ scene: S.str("Scene label, e.g. 'Scene 1 — Hook'"), duration: S.str("e.g. '0-3s'"), visual: S.str(), onScreenText: S.str(), voiceover: S.str() });
const VARIATION = S.obj({ label: S.str("Short angle name, e.g. 'Pain-point'"), headline: S.str(), primaryText: S.str(), description: S.str(), cta: S.str() });
const IMAGE = S.obj({ concept: S.str("What the image shows and why it works"), prompt: S.str("A detailed, ready-to-use prompt for an AI image model — no text in the image unless overlayText requires it"), overlayText: S.str("Short text to overlay on the image (or empty)"), designNotes: S.str("Layout, colours, typography and safe-zone guidance for the platform format") });
const VIDEO = S.obj({
  concept: S.str(),
  hook: S.str("The first 1-3 seconds"),
  scenes: S.arr(SCENE),
  voiceoverScript: S.str("Full voiceover script"),
  onScreenText: S.arr(S.str()),
  thumbnailConcept: S.str(),
  durationSec: S.num("Total length in seconds"),
});
const EMPTY_IMAGE_NOTE = "Fill `image` only for an image ad and `video` only for a video ad; leave every field of the other one empty (empty strings, empty arrays, 0).";

export const SCHEMAS = {
  campaign: S.obj({
    summary: S.str("Campaign strategy in 3-5 sentences"),
    positioning: S.str(),
    keyMessages: S.arr(S.str()),
    channelPlan: S.arr(S.obj({ platform: S.str(), budgetPercent: S.num(), role: S.str("What this platform does in the funnel") })),
    timeline: S.str("Phases across the campaign duration"),
    kpis: S.arr(S.str()),
    ideas: S.arr(S.obj({ title: S.str(), description: S.str() })),
    audiences: S.arr(S.obj({ name: S.str(), description: S.str(), interests: S.arr(S.str()) })),
    keywords: S.arr(S.str()),
    hashtags: S.arr(S.str()),
    adConcepts: S.arr(S.obj({ title: S.str(), platform: S.str("One of the campaign's platforms (value, e.g. 'instagram')"), format: S.enum(["image", "video"]), angle: S.str(), headline: S.str(), primaryText: S.str(), description: S.str(), cta: S.str() })),
  }),
  ad: S.obj({
    headline: S.str(),
    primaryText: S.str(),
    description: S.str(),
    cta: S.str(),
    caption: S.str(),
    hashtags: S.arr(S.str()),
    keywords: S.arr(S.str()),
    audienceSuggestions: S.arr(S.str()),
    image: IMAGE,
    video: VIDEO,
    variations: S.arr(VARIATION),
  }),
  post: S.obj({
    idea: S.str("The core idea in 1-2 sentences"),
    creative: S.obj({ imageConcept: S.str(), imagePrompt: S.str(), videoConcept: S.str(), hook: S.str(), videoScript: S.str(), scenes: S.arr(SCENE), thumbnailConcept: S.str() }),
    variants: S.arr(S.obj({ platform: S.str(), title: S.str("Headline / video title / event title where the platform has one, else empty"), content: S.str("The post body / description"), caption: S.str("Short caption or first-line hook"), cta: S.str(), hashtags: S.arr(S.str()), keywords: S.arr(S.str()) })),
  }),
  variant: S.obj({ title: S.str(), content: S.str(), caption: S.str(), cta: S.str(), hashtags: S.arr(S.str()), keywords: S.arr(S.str()) }),
  workspace: S.obj({ summary: S.str(), items: S.arr(S.obj({ heading: S.str(), platform: S.str(), body: S.str("Markdown"), cta: S.str(), hashtags: S.arr(S.str()) })) }),
  imagePrompt: S.obj({ concept: S.str(), prompt: S.str(), overlayText: S.str(), designNotes: S.str() }),
} as const;

export type SchemaName = keyof typeof SCHEMAS;

export const SYSTEM = [
  "You are the senior social media strategist and copywriter of an in-house marketing team.",
  "Write platform-native content: respect each platform's character limits, conventions and audience. Never exceed a limit you are given.",
  "Use only facts from the brand context and the brief. Do not invent statistics, prices, discounts, awards, client names or testimonials.",
  "Write in the requested language and tone. Hashtags must start with #. Keep claims compliant with ad platform policies (no misleading or sensational claims, no personal-attribute targeting language).",
  "Return only the JSON the schema asks for.",
].join("\n");

export function platformGuide(platforms: string[]): string {
  return platforms
    .filter(isPlatform)
    .map((p) => {
      const m = PLATFORM_META[p];
      return `- ${p} (${m.label}): caption/body limit ${m.captionLimit} chars${m.headlineLimit ? `, headline/title limit ${m.headlineLimit} chars` : ""}; hashtags: ${m.hashtagAdvice}; formats: ${m.formats.map((f) => `${f.label} ${f.width}x${f.height}`).join(", ")}`;
    })
    .join("\n");
}

export interface AiResult<T> {
  data: T;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  durationMs: number;
}

/** Friendly, key-free message for an OpenAI failure. */
export function aiErrorMessage(err: unknown): string {
  if (isBillingLimitError(err)) return err.message;
  const e = err as { status?: number; message?: string };
  if (e?.status === 401) return "OpenAI rejected the API key configured on the server.";
  if (e?.status === 429) return "OpenAI rate limit or quota reached — try again shortly.";
  if (e?.status === 400 && e.message) return `OpenAI couldn't process that request: ${e.message.replace(/sk-[A-Za-z0-9_-]+/g, "[redacted]").slice(0, 200)}`;
  return "OpenAI didn't respond as expected. Please try again.";
}

async function guard(userId: string, ai: AiSettings) {
  if (!(await isOpenAIConfigured())) throw new SmmsInputError("OpenAI isn't connected for this workspace (Settings → Integrations), so AI generation is unavailable.");
  const planBlock = await aiBlockReason();
  if (planBlock) throw new SmmsInputError(planBlock);
  if (ai.dailyGenerationLimit > 0 && (await countUserAiToday(userId)) >= ai.dailyGenerationLimit) {
    throw new SmmsInputError(`You've reached today's limit of ${ai.dailyGenerationLimit} AI generations.`);
  }
}

/** One structured text generation. `input` is the full user prompt (brief + brand + any current content). */
export async function generateStructured<T>(opts: { userId: string; schema: SchemaName; input: string; normalize: (v: unknown) => T }): Promise<AiResult<T>> {
  const { ai } = await getSettings();
  await guard(opts.userId, ai);
  const openai = await getOpenAI();
  const started = Date.now();
  const params: OpenAI.Responses.ResponseCreateParamsNonStreaming = {
    model: ai.textModel,
    instructions: SYSTEM,
    input: opts.input,
    max_output_tokens: ai.maxOutputTokens,
    text: { format: { type: "json_schema", name: `smms_${opts.schema}`, schema: SCHEMAS[opts.schema] as Record<string, unknown>, strict: true } },
    store: false,
  };
  let res: OpenAI.Responses.Response;
  try {
    res = await openai.responses.create(ai.temperature === null ? params : { ...params, temperature: ai.temperature });
  } catch (err) {
    if (ai.temperature !== null && isUnsupportedParamError(err, "temperature")) res = await openai.responses.create(params);
    else throw err;
  }
  if (res.status === "incomplete") throw new SmmsInputError("The AI response was cut off (output limit). Try a shorter brief or raise the output limit in Settings.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(res.output_text);
  } catch {
    throw new SmmsInputError("The AI returned something that couldn't be read. Please try again.");
  }
  const inputTokens = res.usage?.input_tokens ?? 0;
  const outputTokens = res.usage?.output_tokens ?? 0;
  return { data: opts.normalize(parsed), model: ai.textModel, inputTokens, outputTokens, costUsd: estimateCost(ai, ai.textModel, inputTokens, outputTokens), durationMs: Date.now() - started };
}

/** One image from OpenAI's image model. Returns PNG bytes. */
export async function generateImage(opts: { userId: string; prompt: string; size: ImageSize }): Promise<AiResult<Buffer>> {
  const { ai } = await getSettings();
  await guard(opts.userId, ai);
  const prompt = opts.prompt.trim();
  if (prompt.length < 10) throw new SmmsInputError("Write (or generate) an image prompt first.");
  const openai = await getOpenAI();
  const started = Date.now();
  const res = await openai.images.generate({ model: ai.imageModel, prompt: prompt.slice(0, 4000), size: opts.size, quality: ai.imageQuality, n: 1 });
  const b64 = res.data?.[0]?.b64_json;
  if (!b64) throw new SmmsInputError("OpenAI didn't return an image. Try a different prompt.");
  const usage = (res as { usage?: { input_tokens?: number; output_tokens?: number } }).usage;
  return { data: Buffer.from(b64, "base64"), model: ai.imageModel, inputTokens: usage?.input_tokens ?? 0, outputTokens: usage?.output_tokens ?? 0, costUsd: ai.imageCostUsd, durationMs: Date.now() - started };
}

/** Appended to a prompt when the user asked to refine the existing content rather than start over. */
export function refineBlock(current: unknown, instruction: string | null): string {
  if (!instruction) return "";
  return `\n\nCURRENT CONTENT (JSON):\n${JSON.stringify(current).slice(0, 12000)}\n\nREVISION REQUEST: ${instruction}\nApply the request to the current content and keep everything the request doesn't touch.`;
}

export { EMPTY_IMAGE_NOTE };
