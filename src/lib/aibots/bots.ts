import "server-only";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getOpenAI, isOpenAIConfigured } from "@/lib/openai";
import { hasAibotsAccess } from "@/lib/aibots-roles";
import { COLLECTIONS, aibotsCollection, createStamp, escapeRegex, newId, notDeleted, str, updateStamp, type Stamps } from "@/lib/aibots/db";
import { BOT_COLORS, BOT_ICONS, GENERAL_BOT_ID, GENERAL_BOT_NAME, LIMITS, type BotColor, type BotIcon, type BotStatus } from "@/lib/aibots/constants";
import { AibotsInputError, NotFoundError, can, type AibotsViewer } from "@/lib/aibots/viewer";
import { getSettings } from "@/lib/aibots/settings";
import { getCompanyBrand } from "@/lib/platform/branding";

/**
 * A bot is pure configuration: instructions + model + an OpenAI vector store
 * (its private knowledge base) + an access list. Every bot is rendered by the
 * same pages/components — adding one is a database row, never new code.
 */

export interface BotAccess {
  /** "all" = every AI Bots user; "restricted" = only the listed roles / users (plus bot editors). */
  mode: "all" | "restricted";
  roles: string[];
  userIds: string[];
}

export interface BotDoc extends Stamps {
  _id: string;
  name: string;
  icon: BotIcon;
  color: BotColor;
  description: string;
  category: string;
  instructions: string;
  model: string;
  /** null = the model's default (and required for reasoning models). */
  temperature: number | null;
  allowAttachments: boolean;
  starterPrompts: string[];
  access: BotAccess;
  status: BotStatus;
  /** This bot's private OpenAI vector store — the ONLY place its knowledge lives. */
  vectorStoreId: string | null;
}

/** What the client needs to render a bot anywhere (sidebar, picker, workspace header). */
export interface BotSummary {
  _id: string;
  name: string;
  icon: BotIcon;
  color: BotColor;
  description: string;
  category: string;
  model: string;
  status: BotStatus;
  allowAttachments: boolean;
  starterPrompts: string[];
}

export function toSummary(b: BotDoc): BotSummary {
  return {
    _id: b._id,
    name: b.name,
    icon: b.icon,
    color: b.color,
    description: b.description,
    category: b.category,
    model: b.model,
    status: b.status,
    allowAttachments: b.allowAttachments,
    starterPrompts: b.starterPrompts ?? [],
  };
}

let indexesEnsured = false;
export async function botsCollection() {
  const col = await aibotsCollection<BotDoc>(COLLECTIONS.bots);
  if (!indexesEnsured) {
    indexesEnsured = true;
    await Promise.all([col.createIndex({ status: 1, name: 1 }).catch(() => {}), col.createIndex({ deletedAt: 1 }).catch(() => {})]);
  }
  return col;
}

/** The access gate for chatting with a bot. Editors can use every bot (they need to test them). */
export function canUseBot(viewer: AibotsViewer, bot: Pick<BotDoc, "access" | "status" | "deletedAt">): boolean {
  if (bot.deletedAt) return false;
  if (can(viewer, "EDIT_BOT")) return true;
  if (!can(viewer, "USE_BOT") || bot.status !== "active") return false;
  if (bot.access.mode === "all") return true;
  return bot.access.userIds.includes(viewer.userId) || bot.access.roles.some((r) => viewer.roles.includes(r));
}

/** Mongo filter matching the ACTIVE bots a viewer may chat with. The sidebar and the bot picker go through this. */
function usableFilter(viewer: AibotsViewer): Record<string, unknown> {
  if (can(viewer, "EDIT_BOT")) return { ...notDeleted, status: "active" };
  if (!can(viewer, "USE_BOT")) return { _id: "__none__" };
  return {
    ...notDeleted,
    status: "active",
    $or: [{ "access.mode": "all" }, { "access.userIds": viewer.userId }, { "access.roles": { $in: viewer.roles } }],
  };
}

export async function listUsableBots(viewer: AibotsViewer): Promise<BotSummary[]> {
  const col = await botsCollection();
  const rows = await col.find(usableFilter(viewer)).sort({ name: 1 }).limit(500).toArray();
  return rows.map(toSummary);
}

/** Management list (every non-deleted bot, active or not). Caller checks EDIT_BOT. */
export async function listAllBots(): Promise<BotDoc[]> {
  const col = await botsCollection();
  return col.find(notDeleted).sort({ status: 1, name: 1 }).toArray();
}

export async function getBot(botId: string): Promise<BotDoc | null> {
  if (typeof botId !== "string" || botId.length > 64) return null;
  const col = await botsCollection();
  return col.findOne({ _id: botId, ...notDeleted });
}

/**
 * "Start New Chat" — the general assistant. It is not a bot row: it has no
 * knowledge base or access list, its instructions live in AI Bots settings and
 * it runs on the default model. Its chats use this reserved id as `botId`, so
 * the same workspace, history and usage ledger serve it unchanged.
 */
export { GENERAL_BOT_ID, GENERAL_BOT_NAME };

export async function generalBot(): Promise<BotDoc> {
  const settings = await getSettings();
  const epoch = new Date(0);
  return {
    _id: GENERAL_BOT_ID,
    name: GENERAL_BOT_NAME,
    icon: "sparkles",
    color: "indigo",
    description: "Ask anything — writing, analysis, planning or research. Not tied to any bot or knowledge base.",
    category: "General",
    instructions: settings.generalInstructions,
    model: settings.defaultModel,
    temperature: null,
    allowAttachments: true,
    starterPrompts: ["Draft a polite follow-up email to a client", "Summarise the key points of this text", "Help me plan my week", "Explain this concept simply"],
    access: { mode: "all", roles: [], userIds: [] },
    status: "active",
    vectorStoreId: null,
    createdAt: epoch,
    updatedAt: epoch,
    createdBy: null,
    updatedBy: null,
    deletedAt: null,
  };
}

/**
 * The bot a chat runs on — a database bot, or the general assistant — or null
 * when the viewer may not use it (never reveals that a restricted bot exists).
 * Editing, knowledge and deletion always go through `getBot`, which never
 * returns the general assistant.
 */
export async function getChatBot(viewer: AibotsViewer, botId: string): Promise<BotDoc | null> {
  if (botId === GENERAL_BOT_ID) return can(viewer, "USE_BOT") || can(viewer, "EDIT_BOT") ? generalBot() : null;
  const bot = await getBot(botId);
  return bot && canUseBot(viewer, bot) ? bot : null;
}

/** Loads a bot the viewer may chat with, or throws NotFound. */
export async function getUsableBot(viewer: AibotsViewer, botId: string): Promise<BotDoc> {
  const bot = await getChatBot(viewer, botId);
  if (!bot) throw new NotFoundError();
  return bot;
}

export interface BotInput {
  name: unknown;
  icon: unknown;
  color: unknown;
  description: unknown;
  category: unknown;
  instructions: unknown;
  model: unknown;
  temperature: unknown;
  allowAttachments: unknown;
  starterPrompts: unknown;
  accessMode: unknown;
  accessRoles: unknown;
  accessUserIds: unknown;
  status: unknown;
}

async function clean(input: BotInput) {
  const name = str(input.name, LIMITS.nameMax);
  if (!name) throw new AibotsInputError("Give the bot a name.");
  const instructions = str(input.instructions, LIMITS.instructionsMax);
  if (!instructions) throw new AibotsInputError("Write the bot's instructions — they define how it behaves.");
  const settings = await getSettings();
  const model = str(input.model, 64);
  if (!settings.models.some((m) => m.id === model)) throw new AibotsInputError("Pick one of the allowed OpenAI models.");
  let temperature: number | null = null;
  if (input.temperature !== null && input.temperature !== "" && input.temperature !== undefined) {
    const t = Number(input.temperature);
    if (!Number.isFinite(t) || t < 0 || t > 2) throw new AibotsInputError("Temperature must be between 0 and 2.");
    temperature = Math.round(t * 100) / 100;
  }
  const arr = (v: unknown, max: number, len: number) =>
    Array.isArray(v) ? Array.from(new Set(v.map((x) => str(x, len)).filter(Boolean))).slice(0, max) : [];
  const accessMode = input.accessMode === "restricted" ? "restricted" : "all";
  const userIds = arr(input.accessUserIds, 500, 40).filter((id) => ObjectId.isValid(id));
  return {
    name,
    icon: (BOT_ICONS as readonly string[]).includes(input.icon as string) ? (input.icon as BotIcon) : "bot",
    color: (BOT_COLORS as readonly string[]).includes(input.color as string) ? (input.color as BotColor) : "indigo",
    description: str(input.description, LIMITS.descriptionMax),
    category: str(input.category, 40) || "General",
    instructions,
    model,
    temperature,
    allowAttachments: input.allowAttachments === true,
    starterPrompts: arr(input.starterPrompts, LIMITS.starterPromptsMax, 200),
    access: { mode: accessMode, roles: accessMode === "restricted" ? arr(input.accessRoles, 50, 40) : [], userIds: accessMode === "restricted" ? userIds : [] } as BotAccess,
    status: (input.status === "inactive" ? "inactive" : "active") as BotStatus,
  };
}

/** Creates the bot's private OpenAI vector store (lazily — a bot can exist before OpenAI is configured). */
export async function ensureBotVectorStore(bot: Pick<BotDoc, "_id" | "name" | "vectorStoreId">): Promise<string> {
  const openai = await getOpenAI();
  if (bot.vectorStoreId) {
    try {
      await openai.vectorStores.retrieve(bot.vectorStoreId);
      return bot.vectorStoreId;
    } catch (err) {
      if ((err as { status?: number }).status !== 404) throw err;
      // Deleted upstream — recreate below.
    }
  }
  const store = await openai.vectorStores.create({
    name: `${(await getCompanyBrand()).name} AI Bot · ${bot.name}`.slice(0, 120),
    metadata: { app: "aibots", bot_id: bot._id },
  });
  const col = await botsCollection();
  await col.updateOne({ _id: bot._id }, { $set: { vectorStoreId: store.id } });
  return store.id;
}

export async function createBot(input: BotInput, actorId: string): Promise<BotDoc> {
  const data = await clean(input);
  const col = await botsCollection();
  if (await col.findOne({ ...notDeleted, name: { $regex: `^${escapeRegex(data.name)}$`, $options: "i" } })) {
    throw new AibotsInputError("A bot with that name already exists.");
  }
  const doc: BotDoc = { _id: newId(), ...data, vectorStoreId: null, ...createStamp(actorId) };
  await col.insertOne(doc);
  if ((await isOpenAIConfigured())) {
    // Best-effort now; uploading the first file retries it.
    await ensureBotVectorStore(doc).then((id) => (doc.vectorStoreId = id)).catch((err) => console.error("[aibots] vector store create failed", err instanceof Error ? err.message : err));
  }
  return doc;
}

export async function updateBot(botId: string, input: BotInput, actorId: string): Promise<{ before: BotDoc; after: BotDoc }> {
  const before = await getBot(botId);
  if (!before) throw new NotFoundError();
  const data = await clean(input);
  const col = await botsCollection();
  const clash = await col.findOne({ ...notDeleted, _id: { $ne: botId }, name: { $regex: `^${escapeRegex(data.name)}$`, $options: "i" } });
  if (clash) throw new AibotsInputError("A bot with that name already exists.");
  await col.updateOne({ _id: botId }, { $set: { ...data, ...updateStamp(actorId) } });
  return { before, after: { ...before, ...data } };
}

export async function setBotStatus(botId: string, status: BotStatus, actorId: string): Promise<BotDoc> {
  const bot = await getBot(botId);
  if (!bot) throw new NotFoundError();
  const col = await botsCollection();
  await col.updateOne({ _id: botId }, { $set: { status, ...updateStamp(actorId) } });
  return bot;
}

/**
 * Soft-deletes the bot (its chats stay for the record) and removes its
 * knowledge from OpenAI: every file and the vector store. Best-effort upstream.
 */
export async function deleteBot(botId: string, actorId: string): Promise<BotDoc> {
  const bot = await getBot(botId);
  if (!bot) throw new NotFoundError();
  const col = await botsCollection();
  await col.updateOne({ _id: botId }, { $set: { deletedAt: new Date(), status: "inactive", ...updateStamp(actorId) } });
  const { purgeBotFiles } = await import("@/lib/aibots/knowledge");
  await purgeBotFiles(bot).catch(() => {});
  return bot;
}

/** Everyone who can sign in to AI Bots — for the per-bot user access picker. */
export async function listAibotsStaff(): Promise<{ value: string; label: string }[]> {
  const db = await getDb();
  const rows = await db
    .collection<{ _id: ObjectId; email: string; roles?: string[] }>("admin_users")
    .find({ roles: { $exists: true, $ne: [] } }, { projection: { email: 1, roles: 1 } })
    .sort({ email: 1 })
    .limit(2000)
    .toArray();
  return rows.filter((u) => hasAibotsAccess(u.roles)).map((u) => ({ value: String(u._id), label: u.email }));
}
