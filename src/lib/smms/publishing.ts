import "server-only";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { smmsCan, type SmmsPermission } from "@/lib/smms-roles";
import { notDeleted } from "@/lib/smms/db";
import { connectedPlatforms, markIntegrationError, providerFor } from "@/lib/smms/integrations";
import { PUBLISHERS } from "@/lib/smms/publishers";
import { getMediaMany, getMedia } from "@/lib/smms/media";
import { EMPTY_PUBLISH, getPost, postsCollection, statusFromVariants, updatePost, type PostDoc, type PostVariant } from "@/lib/smms/posts";
import { adsCollection } from "@/lib/smms/ads";
import { recordAudit } from "@/lib/smms/audit";
import { notifySmmsUsers } from "@/lib/smms/notifications";
import { PLATFORM_META, type PostPlatform } from "@/lib/smms/constants";
import { SmmsInputError } from "@/lib/smms/viewer";
import { currentCompanyId } from "@/lib/platform/tenancy/context";

/**
 * Publishing is kept separate from AI generation. Content reaches a platform
 * only through:
 *   1. an explicit "Publish" by someone with PUBLISH_CONTENT, or
 *   2. a schedule that someone with PUBLISH_CONTENT approved — checked again
 *      at publish time, so revoking the approver's permission stops it.
 * Editing or regenerating a scheduled post withdraws its approval.
 *
 * Platforms without a connected account are published by hand in the
 * platform's own app and then "Marked as published" here (with the post URL).
 */

type Actor = { userId: string; email: string | null };

export async function smmsUsersWith(permission: SmmsPermission): Promise<string[]> {
  const db = await getDb();
  const rows = await db
    .collection<{ _id: ObjectId; roles?: string[]; permissionOverrides?: Record<string, boolean> }>("admin_users")
    .find({ roles: { $elemMatch: { $regex: "^(smms_|super_admin$)" } } }, { projection: { roles: 1, permissionOverrides: 1 } })
    .toArray();
  return rows.filter((r) => smmsCan({ roles: r.roles ?? [], permissionOverrides: r.permissionOverrides ?? {} }, permission)).map((r) => r._id.toString());
}

async function userCan(userId: string | null, permission: SmmsPermission): Promise<boolean> {
  if (!userId || !ObjectId.isValid(userId)) return false;
  const db = await getDb();
  const u = await db.collection<{ _id: ObjectId; roles?: string[]; permissionOverrides?: Record<string, boolean> }>("admin_users").findOne({ _id: new ObjectId(userId) }, { projection: { roles: 1, permissionOverrides: 1 } });
  return Boolean(u && smmsCan({ roles: u.roles ?? [], permissionOverrides: u.permissionOverrides ?? {} }, permission));
}

function mediaCheck(p: PostDoc, platform: PostPlatform, images: number, videos: number): string | null {
  const need = PLATFORM_META[platform].needsMedia;
  if (need === "video" && videos === 0) return `${PLATFORM_META[platform].label} needs a video attached.`;
  if (need === "image_or_video" && images + videos === 0) return `${PLATFORM_META[platform].label} needs an image or a video attached.`;
  const v = p.variants.find((x) => x.platform === platform);
  if (!v || !(v.content || v.caption).trim()) return `The ${PLATFORM_META[platform].label} version has no text yet.`;
  return null;
}

/** Publishes the chosen platforms' versions through the connected APIs. Returns per-platform results; never throws for a single platform's failure. */
export async function publishPostNow(postId: string, platforms: PostPlatform[], actor: Actor): Promise<{ platform: PostPlatform; ok: boolean; error?: string; url?: string | null }[]> {
  const p = await getPost(postId);
  if (!p) throw new SmmsInputError("That post no longer exists.");
  if (p.status === "archived") throw new SmmsInputError("Restore the post before publishing it.");
  const wanted = platforms.filter((x) => p.platforms.includes(x));
  if (wanted.length === 0) throw new SmmsInputError("Pick at least one of the post's platforms.");
  const connected = await connectedPlatforms();
  const media = await getMediaMany(p.mediaIds);
  const images = media.filter((m) => m.kind === "image");
  const video = media.find((m) => m.kind === "video") ?? null;
  const thumbnail = p.thumbnailId ? await getMedia(p.thumbnailId) : video?.thumbnailId ? await getMedia(video.thumbnailId) : null;

  const results: { platform: PostPlatform; ok: boolean; error?: string; url?: string | null }[] = [];
  const variants: PostVariant[] = [...p.variants];
  for (const platform of wanted) {
    const idx = variants.findIndex((v) => v.platform === platform);
    if (idx < 0) continue;
    if (variants[idx].publish.state === "published") {
      results.push({ platform, ok: true, url: variants[idx].publish.url });
      continue;
    }
    let error: string | null = null;
    if (!connected.has(platform)) error = `${PLATFORM_META[platform].label} isn't connected — publish it in the app and use “Mark as published”.`;
    else error = mediaCheck(p, platform, images.length, video ? 1 : 0);
    if (!error) {
      try {
        const out = await PUBLISHERS[platform]({ platform, variant: variants[idx], title: p.title, link: p.link, images, video, thumbnail });
        variants[idx] = { ...variants[idx], publish: { state: "published", method: "api", externalId: out.externalId, url: out.url, error: null, at: new Date(), by: actor.userId } };
        results.push({ platform, ok: true, url: out.url });
        await recordAudit({ actorId: actor.userId, actorEmail: actor.email, action: "publish", entity: "post", entityId: p._id, entityLabel: p.title, recordId: p._id, summary: `${PLATFORM_META[platform].label} via API${out.url ? ` · ${out.url}` : ""}` });
        continue;
      } catch (err) {
        error = err instanceof SmmsInputError ? err.message : `${PLATFORM_META[platform].label}: ${(err as Error).message ?? "publish failed"}`.replace(/access_token=[^&\s]+/g, "access_token=[redacted]").slice(0, 300);
        if (!(err instanceof SmmsInputError)) await markIntegrationError(providerFor(platform), error);
      }
    }
    variants[idx] = { ...variants[idx], publish: { ...variants[idx].publish, state: "failed", error, at: new Date(), by: actor.userId } };
    results.push({ platform, ok: false, error });
    await recordAudit({ actorId: actor.userId, actorEmail: actor.email, action: "publish_failed", entity: "post", entityId: p._id, entityLabel: p.title, recordId: p._id, summary: error });
  }
  const status = statusFromVariants(variants, p.status === "scheduled" ? "scheduled" : p.status);
  const allDone = status === "published";
  await updatePost(p._id, { variants, status, ...(allDone ? { publishedAt: new Date() } : {}) }, actor.userId);
  return results;
}

export async function markPublishedManually(postId: string, platform: PostPlatform, url: string | null, actor: Actor): Promise<PostDoc> {
  const p = await getPost(postId);
  if (!p) throw new SmmsInputError("That post no longer exists.");
  if (url && !/^https?:\/\/\S+$/i.test(url)) throw new SmmsInputError("The post URL must be a full http(s) URL.");
  const variants = p.variants.map((v) => (v.platform === platform ? { ...v, publish: { state: "published" as const, method: "manual" as const, externalId: null, url: url || null, error: null, at: new Date(), by: actor.userId } } : v));
  if (!variants.some((v) => v.platform === platform)) throw new SmmsInputError("That platform isn't part of this post.");
  const status = statusFromVariants(variants, p.status === "failed" ? "edited" : p.status);
  await updatePost(p._id, { variants, status, ...(status === "published" ? { publishedAt: new Date() } : {}) }, actor.userId);
  return p;
}

export async function resetPublish(postId: string, platform: PostPlatform, actorId: string): Promise<void> {
  const p = await getPost(postId);
  if (!p) throw new SmmsInputError("That post no longer exists.");
  const variants = p.variants.map((v) => (v.platform === platform ? { ...v, publish: EMPTY_PUBLISH } : v));
  const status = statusFromVariants(variants, p.scheduledAt ? "scheduled" : "edited");
  await updatePost(p._id, { variants, status, publishedAt: status === "published" ? p.publishedAt : null }, actorId);
}

// ── Due-item sweep (cron + opportunistic) ────────────────────────────────────

const lastSweep = new Map<string, number>();

/** Runs the sweep at most every 5 minutes per server instance and company — called from page loads so schedules work even on a daily cron. */
export async function maybeSweep(): Promise<void> {
  const companyId = await currentCompanyId();
  if (Date.now() - (lastSweep.get(companyId) ?? 0) < 5 * 60_000) return;
  lastSweep.set(companyId, Date.now());
  await runDueSweep().catch((err) => console.error("[smms sweep]", (err as Error).message));
}

export async function runDueSweep(): Promise<{ published: number; failed: number; awaitingApproval: number; adsDue: number }> {
  const now = new Date();
  const posts = await postsCollection();
  const due = await posts.find({ ...notDeleted, status: "scheduled", scheduledAt: { $lte: now } }).limit(25).toArray();
  let published = 0;
  let failed = 0;
  let awaitingApproval = 0;
  const publishers = await smmsUsersWith("PUBLISH_CONTENT");

  for (const p of due) {
    const approved = p.approvedBy && (await userCan(p.approvedBy, "PUBLISH_CONTENT"));
    if (!approved) {
      awaitingApproval++;
      await notifySmmsUsers(publishers, { type: "smms_approval_needed", title: `Due, not approved: ${p.title}`, body: "This scheduled post is due but nobody with Publish has approved it.", link: `/smms/posts/${p._id}`, dedupeKey: `smms-due-${p._id}-${p.scheduledAt?.toISOString()}` });
      continue;
    }
    // Claim it so an overlapping sweep can't publish twice.
    const claim = await posts.updateOne({ _id: p._id, status: "scheduled", approvedBy: p.approvedBy }, { $set: { status: "edited" } });
    if (claim.modifiedCount === 0) continue;
    const pending = p.variants.filter((v) => v.publish?.state !== "published").map((v) => v.platform);
    const results = await publishPostNow(p._id, pending, { userId: p.approvedBy!, email: null }).catch((err) => [{ platform: pending[0], ok: false, error: (err as Error).message }]);
    const bad = results.filter((r) => !r.ok);
    if (bad.length === 0) {
      published++;
      await notifySmmsUsers([p.scheduledBy, p.approvedBy].filter((x): x is string => Boolean(x)), { type: "smms_published", title: `Published: ${p.title}`, body: results.map((r) => PLATFORM_META[r.platform].label).join(", "), link: `/smms/posts/${p._id}` });
    } else {
      failed++;
      await notifySmmsUsers([...new Set([...publishers, p.scheduledBy ?? ""])].filter(Boolean), { type: "smms_publish_failed", title: `Publishing failed: ${p.title}`, body: bad.map((b) => b.error).join(" · ").slice(0, 300), link: `/smms/posts/${p._id}`, dedupeKey: `smms-fail-${p._id}-${p.scheduledAt?.toISOString()}` });
    }
  }

  // Ads are launched by hand in each ad manager — remind publishers when one is due.
  const ads = await adsCollection();
  const dueAds = await ads.find({ ...notDeleted, status: "scheduled", scheduledAt: { $lte: now } }, { projection: { name: 1, campaignId: 1, scheduledAt: 1, platform: 1 } }).limit(50).toArray();
  for (const a of dueAds) {
    await notifySmmsUsers(publishers, { type: "smms_publish_due", title: `Ad due to go live: ${a.name}`, body: `Launch it in ${PLATFORM_META[a.platform].label} and mark it live.`, link: `/smms/campaigns/${a.campaignId}/ads/${a._id}`, dedupeKey: `smms-ad-due-${a._id}-${a.scheduledAt?.toISOString()}` });
  }
  return { published, failed, awaitingApproval, adsDue: dueAds.length };
}
