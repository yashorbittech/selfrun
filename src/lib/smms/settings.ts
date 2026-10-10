import "server-only";
import { getDb } from "@/lib/mongodb";
import { COLLECTIONS, str, strList, updateStamp } from "@/lib/smms/db";
import { DEFAULT_MODELS } from "@/lib/aibots/constants";
import type { ModelPrice } from "@/lib/smms/constants";
import { SmmsInputError } from "@/lib/smms/viewer";

/**
 * Single settings document (`smms_settings` / `_id: "main"`): the brand
 * context the AI writes from, and the OpenAI configuration.
 *
 * The brand context holds ONLY marketing voice that no other panel owns (tone,
 * messaging, audience, selling points…). Company name / website / contact are
 * read live from HRMS company details, services from the site catalogue and
 * offers from Festival Offers — see `brand.ts`.
 */

export interface BrandContext {
  about: string;
  /** Services from the site catalogue (labels) and/or free text. */
  services: string[];
  products: string[];
  tone: string;
  targetAudience: string;
  messaging: string;
  websiteInfo: string;
  sellingPoints: string[];
  /** Words, claims or topics the AI must avoid. */
  avoid: string[];
  /** Branded hashtags added to suggestions where the platform uses hashtags. */
  brandHashtags: string[];
  /** Feed currently active Festival Offers into generation. */
  includeOffers: boolean;
}

export interface AiSettings {
  textModel: string;
  imageModel: string;
  imageQuality: "low" | "medium" | "high";
  /** null = model default (reasoning models reject temperature). */
  temperature: number | null;
  maxOutputTokens: number;
  /** Per-user AI generations per day (0 = unlimited). */
  dailyGenerationLimit: number;
  /** USD estimate per generated image, for the usage ledger. */
  imageCostUsd: number;
  /** Text-model price table used for cost estimates (shared defaults with AI Bots). */
  models: ModelPrice[];
}

export interface SmmsSettings {
  _id: string;
  brand: BrandContext;
  ai: AiSettings;
  updatedAt: Date;
  updatedBy: string | null;
}

const ID = "main";

export const DEFAULT_BRAND: BrandContext = {
  about: "",
  services: [],
  products: [],
  tone: "Professional, confident and approachable",
  targetAudience: "",
  messaging: "",
  websiteInfo: "",
  sellingPoints: [],
  avoid: [],
  brandHashtags: [],
  includeOffers: true,
};

export const DEFAULT_AI: AiSettings = {
  textModel: "gpt-4.1-mini",
  imageModel: "gpt-image-1",
  imageQuality: "medium",
  temperature: 0.8,
  maxOutputTokens: 6000,
  dailyGenerationLimit: 150,
  imageCostUsd: 0.04,
  models: DEFAULT_MODELS,
};

export async function getSettings(): Promise<SmmsSettings> {
  const db = await getDb();
  const doc = await db.collection<SmmsSettings>(COLLECTIONS.settings).findOne({ _id: ID });
  return {
    _id: ID,
    brand: { ...DEFAULT_BRAND, ...(doc?.brand ?? {}) },
    ai: { ...DEFAULT_AI, ...(doc?.ai ?? {}), models: doc?.ai?.models?.length ? doc.ai.models : DEFAULT_MODELS },
    updatedAt: doc?.updatedAt ?? new Date(0),
    updatedBy: doc?.updatedBy ?? null,
  };
}

/** USD estimate for one text generation. Unknown models cost 0. */
export function estimateCost(ai: AiSettings, model: string, inputTokens: number, outputTokens: number): number {
  const p = ai.models.find((m) => m.id === model);
  if (!p) return 0;
  return (inputTokens * p.input + outputTokens * p.output) / 1_000_000;
}

const MODEL_ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{1,63}$/;

export async function saveBrand(input: Record<string, unknown>, actorId: string): Promise<BrandContext> {
  const brand: BrandContext = {
    about: str(input.about, 3000),
    services: strList(input.services, 40, 120),
    products: strList(input.products, 40, 160),
    tone: str(input.tone, 300),
    targetAudience: str(input.targetAudience, 1500),
    messaging: str(input.messaging, 2000),
    websiteInfo: str(input.websiteInfo, 2000),
    sellingPoints: strList(input.sellingPoints, 20, 240),
    avoid: strList(input.avoid, 30, 120),
    brandHashtags: strList(input.brandHashtags, 10, 60).map((h) => (h.startsWith("#") ? h : `#${h}`).replace(/\s+/g, "")),
    includeOffers: input.includeOffers !== false,
  };
  const db = await getDb();
  await db.collection<SmmsSettings>(COLLECTIONS.settings).updateOne({ _id: ID }, { $set: { brand, ...updateStamp(actorId) } }, { upsert: true });
  return brand;
}

export async function saveAi(input: Record<string, unknown>, actorId: string): Promise<AiSettings> {
  const current = await getSettings();
  const textModel = str(input.textModel, 64);
  const imageModel = str(input.imageModel, 64);
  if (!MODEL_ID.test(textModel)) throw new SmmsInputError("Enter a valid OpenAI text model id.");
  if (!MODEL_ID.test(imageModel)) throw new SmmsInputError("Enter a valid OpenAI image model id.");
  const quality = input.imageQuality === "low" || input.imageQuality === "high" ? input.imageQuality : "medium";
  const t = input.temperature === null || input.temperature === "" ? null : Number(input.temperature);
  const ai: AiSettings = {
    ...current.ai,
    textModel,
    imageModel,
    imageQuality: quality,
    temperature: t === null || !Number.isFinite(t) ? null : Math.min(Math.max(t, 0), 2),
    maxOutputTokens: Math.min(Math.max(Math.round(Number(input.maxOutputTokens) || 0), 1000), 32000),
    dailyGenerationLimit: Math.min(Math.max(Math.round(Number(input.dailyGenerationLimit) || 0), 0), 5000),
    imageCostUsd: Math.min(Math.max(Number(input.imageCostUsd) || 0, 0), 5),
  };
  const db = await getDb();
  await db.collection<SmmsSettings>(COLLECTIONS.settings).updateOne({ _id: ID }, { $set: { ai, ...updateStamp(actorId) } }, { upsert: true });
  return ai;
}
