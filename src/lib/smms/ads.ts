import "server-only";
import { COLLECTIONS, smmsCollection, newId, createStamp, updateStamp, notDeleted, str, dateOrNull, type Stamps } from "@/lib/smms/db";
import { findFormat, isAdPlatform, PLATFORM_META, type AdPlatform, type ContentStatus } from "@/lib/smms/constants";
import { EMPTY_AD, normalizeAd, type AdConcept, type AdContent } from "@/lib/smms/content";
import { SmmsInputError, NotFoundError } from "@/lib/smms/viewer";

/**
 * An ad creative inside a campaign: one platform, one format (image or video),
 * its copy, creative direction, variations and attached media. Ads are never
 * pushed to an ad platform automatically — "Mark live" records that someone
 * launched it in the platform's ad manager (optionally with the ad's id/URL).
 */

export interface AdDoc extends Stamps {
  _id: string;
  campaignId: string;
  name: string;
  platform: AdPlatform;
  format: "image" | "video";
  /** A `PLATFORM_META[platform].formats[].key` — placement + dimensions. */
  formatKey: string | null;
  status: ContentStatus;
  content: AdContent;
  mediaIds: string[];
  thumbnailId: string | null;
  /** Planned go-live. */
  scheduledAt: Date | null;
  scheduledBy: string | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  /** Set when marked live: the ad's id or URL in the ad platform. */
  externalRef: string | null;
  launchedAt: Date | null;
  launchedBy: string | null;
  archivedFrom: ContentStatus | null;
}

let indexesEnsured = false;
export async function adsCollection() {
  const col = await smmsCollection<AdDoc>(COLLECTIONS.ads);
  if (!indexesEnsured) {
    indexesEnsured = true;
    await Promise.all([col.createIndex({ campaignId: 1, deletedAt: 1 }).catch(() => {}), col.createIndex({ status: 1, scheduledAt: 1 }).catch(() => {})]);
  }
  return col;
}

export function parseAdHeader(input: Record<string, unknown>, allowed: readonly string[]): { name: string; platform: AdPlatform; format: "image" | "video"; formatKey: string | null } {
  const platform = input.platform;
  if (!isAdPlatform(platform) || !allowed.includes(platform)) throw new SmmsInputError("Pick one of the campaign's platforms.");
  const format = input.format === "video" ? "video" : "image";
  const fk = str(input.formatKey, 40);
  const f = findFormat(platform, fk);
  if (fk && (!f || (f.kind !== "both" && f.kind !== format))) throw new SmmsInputError("That size doesn't fit this platform and format.");
  return { name: str(input.name, 120) || `${PLATFORM_META[platform].label} ${format} ad`, platform, format, formatKey: f ? f.key : null };
}

export async function createAd(campaignId: string, header: ReturnType<typeof parseAdHeader>, actorId: string, content: AdContent = EMPTY_AD): Promise<AdDoc> {
  const col = await adsCollection();
  const hasContent = Boolean(content.headline || content.primaryText);
  const doc: AdDoc = {
    _id: newId(),
    campaignId,
    ...header,
    status: hasContent ? "edited" : "draft",
    content,
    mediaIds: [],
    thumbnailId: null,
    scheduledAt: null,
    scheduledBy: null,
    approvedBy: null,
    approvedAt: null,
    externalRef: null,
    launchedAt: null,
    launchedBy: null,
    archivedFrom: null,
    ...createStamp(actorId),
  };
  await col.insertOne(doc);
  return doc;
}

/** A campaign's AI ad concept → a pre-filled ad draft. */
export function contentFromConcept(c: AdConcept): AdContent {
  return { ...EMPTY_AD, headline: c.headline, primaryText: c.primaryText, description: c.description, cta: c.cta, image: { ...EMPTY_AD.image, concept: c.format === "image" ? c.angle : "" }, video: { ...EMPTY_AD.video, concept: c.format === "video" ? c.angle : "" } };
}

export async function getAd(id: string): Promise<AdDoc | null> {
  if (!id) return null;
  const col = await adsCollection();
  const doc = await col.findOne({ _id: id, ...notDeleted });
  return doc ? { ...doc, content: normalizeAd(doc.content) } : null;
}

export async function requireAd(campaignId: string, id: string): Promise<AdDoc> {
  const ad = await getAd(id);
  if (!ad || ad.campaignId !== campaignId) throw new NotFoundError();
  return ad;
}

export async function listAdsForCampaign(campaignId: string): Promise<AdDoc[]> {
  const col = await adsCollection();
  return col.find({ campaignId, ...notDeleted }).sort({ createdAt: 1 }).toArray();
}

export async function updateAd(id: string, set: Partial<AdDoc>, actorId: string): Promise<void> {
  const col = await adsCollection();
  await col.updateOne({ _id: id }, { $set: { ...set, ...updateStamp(actorId) } });
}

export async function duplicateAd(ad: AdDoc, actorId: string, override: Partial<Pick<AdDoc, "platform" | "name" | "formatKey">> = {}): Promise<AdDoc> {
  const col = await adsCollection();
  const doc: AdDoc = {
    ...ad,
    ...override,
    _id: newId(),
    name: override.name ?? `${ad.name} (copy)`.slice(0, 120),
    status: ad.content.headline || ad.content.primaryText ? "edited" : "draft",
    scheduledAt: null,
    scheduledBy: null,
    approvedBy: null,
    approvedAt: null,
    externalRef: null,
    launchedAt: null,
    launchedBy: null,
    archivedFrom: null,
    ...createStamp(actorId),
  };
  await col.insertOne(doc);
  return doc;
}

export async function softDeleteAd(id: string, actorId: string): Promise<void> {
  const col = await adsCollection();
  await col.updateOne({ _id: id }, { $set: { deletedAt: new Date(), ...updateStamp(actorId) } });
}

export function parseSchedule(v: unknown): Date {
  const d = dateOrNull(v);
  if (!d) throw new SmmsInputError("Pick a date and time.");
  if (d.getTime() < Date.now() - 60_000) throw new SmmsInputError("Pick a time in the future.");
  return d;
}
