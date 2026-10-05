"use server";

import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { getCurrentSmmsUser } from "@/lib/smms-auth";
import { destroySessionsEverywhere } from "@/lib/cross-module-sso";
import { run } from "@/lib/smms/run";
import { requireViewer, can, ForbiddenError, SmmsInputError } from "@/lib/smms/viewer";
import { recordAudit, diffSummary } from "@/lib/smms/audit";
import { markSmmsNotificationsRead } from "@/lib/smms/notifications";
import { recordVersion, getVersion, listWorkspaceRuns, type TargetType } from "@/lib/smms/generations";
import { createCampaign, duplicateCampaign, parseBrief, requireCampaign, saveCampaignAi, setCampaignStatus, setLmsLinks, softDeleteCampaign, statusAfterEdit, updateBrief } from "@/lib/smms/campaigns";
import { contentFromConcept, createAd, duplicateAd, parseAdHeader, parseSchedule, requireAd, softDeleteAd, updateAd } from "@/lib/smms/ads";
import { createPost, duplicatePost, parsePostBrief, reconcileVariants, requirePost, softDeletePost, updatePost, METRIC_KEYS, type PostMetrics } from "@/lib/smms/posts";
import { deleteMedia, getMedia, registerUpload, replaceMediaFile, updateMediaMeta, validMediaIds, toMediaCard, listMedia, mediaUsage } from "@/lib/smms/media";
import { generateAdCreative, generateCampaignStrategy, generateImageToLibrary, generateMediaPrompt, generatePostContent, regenerateVariant, runWorkspace, postSnapshot } from "@/lib/smms/generate";
import { markPublishedManually, publishPostNow, resetPublish } from "@/lib/smms/publishing";
import { saveAi, saveBrand } from "@/lib/smms/settings";
import { disconnect, isProvider, selectTarget } from "@/lib/smms/integrations";
import { normalizeAd, normalizeCampaignAi, normalizeCreative, normalizeVariant } from "@/lib/smms/content";
import { isAdPlatform, isGeneratorType, isPostPlatform, isPlatform, PLATFORM_META, type ContentStatus } from "@/lib/smms/constants";
import type { SmmsViewer } from "@/lib/smms/viewer";

/**
 * Every SMMS mutation except media uploads (browser → Blob, then registered
 * here) and OAuth redirects (route handlers). Each resolves the viewer from
 * the session cookie via `run` and re-checks the permission it needs.
 */

const who = (v: SmmsViewer) => ({ actorId: v.userId, actorEmail: v.email });
const instr = (s: unknown) => (typeof s === "string" && s.trim() ? s.trim().slice(0, 1000) : null);

export async function smmsLogoutAction(): Promise<void> {
  const user = await getCurrentSmmsUser();
  if (user && ObjectId.isValid(user.id)) await destroySessionsEverywhere(new ObjectId(user.id));
  redirect("/workspace/login");
}

export async function markNotificationsReadAction(ids?: string[]) {
  const v = await requireViewer().catch(() => null);
  if (!v) return;
  await markSmmsNotificationsRead(v.userId, ids?.filter((i) => typeof i === "string"));
}

// ── Campaigns ───────────────────────────────────────────────────────────────

const BRIEF_FIELDS = ["name", "objective", "platforms", "industry", "location", "budget", "cta", "landingPage", "offerService", "tone", "language"];

export async function createCampaignAction(input: Record<string, unknown>, generate: boolean) {
  return run(["CREATE_CAMPAIGNS"], async (v) => {
    const c = await createCampaign(parseBrief(input), v.userId);
    await recordAudit({ ...who(v), action: "create", entity: "campaign", entityId: c._id, entityLabel: c.name, recordId: c._id, summary: c.platforms.map((p) => PLATFORM_META[p].label).join(", ") });
    let generated = false;
    let generateError: string | null = null;
    if (generate && can(v, "GENERATE_AI_CONTENT")) {
      try {
        await generateCampaignStrategy(c, v, null);
        await recordAudit({ ...who(v), action: "generate", entity: "campaign", entityId: c._id, entityLabel: c.name, recordId: c._id, summary: "Campaign strategy" });
        generated = true;
      } catch (err) {
        generateError = err instanceof SmmsInputError ? err.message : "AI generation failed — you can retry from the campaign.";
      }
    }
    return { id: c._id, generated, generateError };
  });
}

export async function updateCampaignBriefAction(id: string, input: Record<string, unknown>) {
  return run(["EDIT_CAMPAIGNS"], async (v) => {
    const { before, after } = await updateBrief(id, parseBrief(input), v.userId);
    const flat = (c: typeof before) => ({ ...c, platforms: c.platforms.join(",") });
    await recordAudit({ ...who(v), action: "update", entity: "campaign", entityId: id, entityLabel: after.name, recordId: id, summary: diffSummary(flat(before), flat(after), BRIEF_FIELDS) ?? "Brief edited" });
    return {};
  });
}

export async function generateCampaignAction(id: string, instruction?: string) {
  return run(["EDIT_CAMPAIGNS", "GENERATE_AI_CONTENT"], async (v) => {
    const c = await requireCampaign(id);
    const hadContent = Boolean(c.ai.summary);
    const { version } = await generateCampaignStrategy(c, v, instr(instruction));
    await recordAudit({ ...who(v), action: hadContent ? "regenerate" : "generate", entity: "campaign", entityId: id, entityLabel: c.name, recordId: id, summary: `Strategy v${version}${instr(instruction) ? ` · “${instr(instruction)}”` : ""}` });
    return { version };
  });
}

export async function saveCampaignAiAction(id: string, ai: unknown) {
  return run(["EDIT_CAMPAIGNS"], async (v) => {
    const c = await requireCampaign(id);
    if (c.status === "archived") throw new SmmsInputError("Restore the campaign before editing it.");
    const data = normalizeCampaignAi(ai);
    await saveCampaignAi(id, data, statusAfterEdit(c.status), v.userId);
    const version = await recordVersion({ targetType: "campaign", targetId: id, source: "edit", kind: "campaign_strategy", label: c.name, snapshot: data, userId: v.userId, userEmail: v.email });
    await recordAudit({ ...who(v), action: "update", entity: "campaign", entityId: id, entityLabel: c.name, recordId: id, summary: `Strategy edited (v${version})` });
    return { version };
  });
}

export async function duplicateCampaignAction(id: string) {
  return run(["CREATE_CAMPAIGNS"], async (v) => {
    const copy = await duplicateCampaign(id, v.userId);
    await recordAudit({ ...who(v), action: "duplicate", entity: "campaign", entityId: copy._id, entityLabel: copy.name, recordId: copy._id, summary: `From ${id}` });
    return { id: copy._id };
  });
}

export async function archiveCampaignAction(id: string, archive: boolean) {
  return run(["EDIT_CAMPAIGNS"], async (v) => {
    const c = await requireCampaign(id);
    if (archive) await setCampaignStatus(id, "archived", v.userId, { archivedFrom: c.status === "archived" ? c.archivedFrom : c.status });
    else await setCampaignStatus(id, c.archivedFrom && c.archivedFrom !== "archived" ? c.archivedFrom : "edited", v.userId, { archivedFrom: null });
    await recordAudit({ ...who(v), action: archive ? "archive" : "unarchive", entity: "campaign", entityId: id, entityLabel: c.name, recordId: id });
    return {};
  });
}

export async function deleteCampaignAction(id: string) {
  return run(["DELETE_CAMPAIGNS"], async (v) => {
    const c = await softDeleteCampaign(id, v.userId);
    await recordAudit({ ...who(v), action: "delete", entity: "campaign", entityId: id, entityLabel: c.name, recordId: id, summary: "Campaign and its ads removed" });
    return {};
  });
}

/** scheduled = planned launch (needs dates); published = launched in the ad platforms (by a person). */
export async function setCampaignLifecycleAction(id: string, to: "scheduled" | "published" | "unschedule" | "failed") {
  const perm = to === "published" || to === "failed" ? "PUBLISH_CONTENT" : "SCHEDULE_POSTS";
  return run(["VIEW_CAMPAIGNS", perm], async (v) => {
    const c = await requireCampaign(id);
    if (c.status === "archived") throw new SmmsInputError("Restore the campaign first.");
    let status: ContentStatus;
    if (to === "scheduled") {
      if (!c.startDate) throw new SmmsInputError("Set the campaign's start date in the brief first.");
      status = "scheduled";
    } else if (to === "unschedule") status = c.ai.summary ? "edited" : "draft";
    else status = to;
    await setCampaignStatus(id, status, v.userId, to === "published" ? { launchedAt: new Date(), launchedBy: v.userId } : {});
    await recordAudit({ ...who(v), action: to === "published" ? "publish" : to === "failed" ? "publish_failed" : to === "scheduled" ? "schedule" : "unschedule", entity: "campaign", entityId: id, entityLabel: c.name, recordId: id, summary: to === "published" ? "Marked launched" : to === "failed" ? "Marked failed" : null });
    return {};
  });
}

export async function linkLmsCampaignsAction(id: string, keys: string[]) {
  return run(["EDIT_CAMPAIGNS"], async (v) => {
    const c = await requireCampaign(id);
    await setLmsLinks(id, Array.isArray(keys) ? keys : [], v.userId);
    await recordAudit({ ...who(v), action: "update", entity: "campaign", entityId: id, entityLabel: c.name, recordId: id, summary: `Linked ${keys.length} LMS campaign${keys.length === 1 ? "" : "s"}` });
    return {};
  });
}

// ── Ads ─────────────────────────────────────────────────────────────────────

export async function createAdAction(campaignId: string, header: Record<string, unknown>, conceptIndex: number | null) {
  return run(["CREATE_ADS"], async (v) => {
    const c = await requireCampaign(campaignId);
    if (c.status === "archived") throw new SmmsInputError("Restore the campaign first.");
    let h;
    let content;
    if (conceptIndex !== null) {
      const concept = c.ai.adConcepts[conceptIndex];
      if (!concept) throw new SmmsInputError("That ad concept no longer exists.");
      const platform = isAdPlatform(concept.platform) && c.platforms.includes(concept.platform) ? concept.platform : c.platforms[0];
      h = parseAdHeader({ name: concept.title, platform, format: concept.format }, c.platforms);
      content = contentFromConcept(concept);
    } else h = parseAdHeader(header, c.platforms);
    const ad = await createAd(campaignId, h, v.userId, content);
    await recordAudit({ ...who(v), action: "create", entity: "ad", entityId: ad._id, entityLabel: ad.name, recordId: campaignId, summary: `${PLATFORM_META[ad.platform].label} ${ad.format} ad in ${c.name}` });
    return { id: ad._id };
  });
}

export async function saveAdAction(campaignId: string, adId: string, input: { header: Record<string, unknown>; content: unknown; mediaIds: unknown; thumbnailId: unknown }) {
  return run(["CREATE_ADS"], async (v) => {
    const [c, ad] = await Promise.all([requireCampaign(campaignId), requireAd(campaignId, adId)]);
    if (ad.status === "archived") throw new SmmsInputError("Restore the ad before editing it.");
    const h = parseAdHeader(input.header, c.platforms);
    const content = normalizeAd(input.content);
    const mediaIds = await validMediaIds(input.mediaIds, h.format === "video" ? ["video", "image"] : ["image"]);
    const thumb = typeof input.thumbnailId === "string" && input.thumbnailId ? (await validMediaIds([input.thumbnailId], ["image"]))[0] ?? null : null;
    const scheduled = ad.status === "scheduled";
    await updateAd(adId, { ...h, content, mediaIds, thumbnailId: thumb, status: statusAfterEdit(ad.status), ...(scheduled ? { approvedBy: null, approvedAt: null } : {}) }, v.userId);
    const version = await recordVersion({ targetType: "ad", targetId: adId, source: "edit", kind: `${h.format}_ad`, label: `${h.name} · ${PLATFORM_META[h.platform].label}`, platform: h.platform, snapshot: content, userId: v.userId, userEmail: v.email });
    await recordAudit({ ...who(v), action: "update", entity: "ad", entityId: adId, entityLabel: h.name, recordId: campaignId, summary: `Saved v${version}` });
    return { version };
  });
}

export async function generateAdAction(campaignId: string, adId: string, instruction?: string) {
  return run(["CREATE_ADS", "GENERATE_AI_CONTENT"], async (v) => {
    const [c, ad] = await Promise.all([requireCampaign(campaignId), requireAd(campaignId, adId)]);
    const { version } = await generateAdCreative(ad, c, v, instr(instruction));
    await recordAudit({ ...who(v), action: ad.content.headline ? "regenerate" : "generate", entity: "ad", entityId: adId, entityLabel: ad.name, recordId: campaignId, summary: `v${version}${instr(instruction) ? ` · “${instr(instruction)}”` : ""}` });
    return { version };
  });
}

export async function duplicateAdAction(campaignId: string, adId: string, targetPlatform?: string) {
  return run(["CREATE_ADS"], async (v) => {
    const [c, ad] = await Promise.all([requireCampaign(campaignId), requireAd(campaignId, adId)]);
    const adapt = targetPlatform && targetPlatform !== ad.platform;
    if (adapt && (!isAdPlatform(targetPlatform) || !c.platforms.includes(targetPlatform))) throw new SmmsInputError("Pick one of the campaign's platforms.");
    const copy = await duplicateAd(ad, v.userId, adapt ? { platform: targetPlatform as typeof ad.platform, formatKey: null, name: `${ad.name} — ${PLATFORM_META[targetPlatform as typeof ad.platform].label}`.slice(0, 120) } : {});
    await recordAudit({ ...who(v), action: "duplicate", entity: "ad", entityId: copy._id, entityLabel: copy.name, recordId: campaignId, summary: adapt ? `Adapted from ${PLATFORM_META[ad.platform].label}` : "Copy" });
    let adapted = false;
    if (adapt && can(v, "GENERATE_AI_CONTENT")) {
      try {
        await generateAdCreative(copy, c, v, `Adapt this ad for ${PLATFORM_META[copy.platform].label}: respect its limits, format and conventions while keeping the same message.`);
        adapted = true;
      } catch {
        // The copy exists; the user can generate from the ad page.
      }
    }
    return { id: copy._id, adapted };
  });
}

export async function scheduleAdAction(campaignId: string, adId: string, when: string | null) {
  return run(["SCHEDULE_POSTS"], async (v) => {
    const ad = await requireAd(campaignId, adId);
    if (ad.status === "archived" || ad.status === "published") throw new SmmsInputError("This ad can't be scheduled in its current state.");
    if (when) {
      const at = parseSchedule(when);
      await updateAd(adId, { status: "scheduled", scheduledAt: at, scheduledBy: v.userId }, v.userId);
      await recordAudit({ ...who(v), action: "schedule", entity: "ad", entityId: adId, entityLabel: ad.name, recordId: campaignId, summary: `Go-live ${at.toISOString()}` });
    } else {
      await updateAd(adId, { status: ad.content.headline ? "edited" : "draft", scheduledAt: null, scheduledBy: null, approvedBy: null, approvedAt: null }, v.userId);
      await recordAudit({ ...who(v), action: "unschedule", entity: "ad", entityId: adId, entityLabel: ad.name, recordId: campaignId });
    }
    return {};
  });
}

export async function markAdLiveAction(campaignId: string, adId: string, externalRef: string, failed = false) {
  return run(["PUBLISH_CONTENT"], async (v) => {
    const ad = await requireAd(campaignId, adId);
    if (ad.status === "archived") throw new SmmsInputError("Restore the ad first.");
    const ref = externalRef.trim().slice(0, 500) || null;
    if (failed) await updateAd(adId, { status: "failed" }, v.userId);
    else await updateAd(adId, { status: "published", externalRef: ref, launchedAt: new Date(), launchedBy: v.userId }, v.userId);
    await recordAudit({ ...who(v), action: failed ? "publish_failed" : "publish", entity: "ad", entityId: adId, entityLabel: ad.name, recordId: campaignId, summary: failed ? "Marked failed" : `Marked live${ref ? ` · ${ref}` : ""}` });
    return {};
  });
}

export async function archiveAdAction(campaignId: string, adId: string, archive: boolean) {
  return run(["CREATE_ADS"], async (v) => {
    const ad = await requireAd(campaignId, adId);
    if (archive) await updateAd(adId, { status: "archived", archivedFrom: ad.status === "archived" ? ad.archivedFrom : ad.status }, v.userId);
    else await updateAd(adId, { status: ad.archivedFrom && ad.archivedFrom !== "archived" ? ad.archivedFrom : "edited", archivedFrom: null }, v.userId);
    await recordAudit({ ...who(v), action: archive ? "archive" : "unarchive", entity: "ad", entityId: adId, entityLabel: ad.name, recordId: campaignId });
    return {};
  });
}

export async function deleteAdAction(campaignId: string, adId: string) {
  return run(["DELETE_CAMPAIGNS"], async (v) => {
    const ad = await requireAd(campaignId, adId);
    await softDeleteAd(adId, v.userId);
    await recordAudit({ ...who(v), action: "delete", entity: "ad", entityId: adId, entityLabel: ad.name, recordId: campaignId });
    return {};
  });
}

export async function generateAdImageAction(campaignId: string, adId: string, prompt: string) {
  return run(["CREATE_ADS", "GENERATE_AI_CONTENT"], async (v) => {
    const ad = await requireAd(campaignId, adId);
    const media = await generateImageToLibrary({ prompt: prompt || ad.content.image.prompt, platform: ad.platform, formatKey: ad.formatKey, name: `${ad.name} — AI image`, actor: v, link: { targetType: "ad", targetId: adId } });
    await updateAd(adId, ad.format === "video" ? { thumbnailId: ad.thumbnailId ?? media._id } : { mediaIds: [...ad.mediaIds, media._id].slice(0, 10) }, v.userId);
    await recordAudit({ ...who(v), action: "generate", entity: "media", entityId: media._id, entityLabel: media.name, recordId: campaignId, summary: `AI image for ad ${ad.name}` });
    return { media: toMediaCard(media) };
  });
}

// ── Posts ───────────────────────────────────────────────────────────────────

export async function createPostAction(input: Record<string, unknown>, generate: boolean) {
  return run(["MANAGE_POSTS"], async (v) => {
    const p = await createPost(parsePostBrief(input), v.userId);
    await recordAudit({ ...who(v), action: "create", entity: "post", entityId: p._id, entityLabel: p.title, recordId: p._id, summary: p.platforms.map((x) => PLATFORM_META[x].label).join(", ") });
    let generateError: string | null = null;
    if (generate && can(v, "GENERATE_AI_CONTENT")) {
      try {
        await generatePostContent(p, v, null);
        await recordAudit({ ...who(v), action: "generate", entity: "post", entityId: p._id, entityLabel: p.title, recordId: p._id, summary: "Post + platform versions" });
      } catch (err) {
        generateError = err instanceof SmmsInputError ? err.message : "AI generation failed — you can retry from the post.";
      }
    }
    return { id: p._id, generateError };
  });
}

export async function updatePostBriefAction(id: string, input: Record<string, unknown>) {
  return run(["MANAGE_POSTS"], async (v) => {
    const p = await requirePost(id);
    if (p.status === "archived") throw new SmmsInputError("Restore the post before editing it.");
    const brief = parsePostBrief(input);
    const removedPublished = p.variants.filter((x) => x.publish.state === "published" && !brief.platforms.includes(x.platform));
    if (removedPublished.length) throw new SmmsInputError(`${removedPublished.map((x) => PLATFORM_META[x.platform].label).join(", ")} is already published and can't be removed.`);
    await updatePost(id, { ...brief, variants: reconcileVariants(p.variants, brief.platforms), status: statusAfterEdit(p.status), ...(p.status === "scheduled" ? { approvedBy: null, approvedAt: null } : {}) }, v.userId);
    await recordAudit({ ...who(v), action: "update", entity: "post", entityId: id, entityLabel: brief.title, recordId: id, summary: diffSummary({ ...p, platforms: p.platforms.join(",") }, { ...brief, platforms: brief.platforms.join(",") }, ["title", "topic", "tone", "language", "objective", "contentType", "platforms", "link"]) ?? "Brief edited" });
    return {};
  });
}

export async function savePostContentAction(id: string, input: { idea: unknown; creative: unknown; variants: unknown; mediaIds: unknown; thumbnailId: unknown }) {
  return run(["MANAGE_POSTS"], async (v) => {
    const p = await requirePost(id);
    if (p.status === "archived") throw new SmmsInputError("Restore the post before editing it.");
    const incoming = Array.isArray(input.variants) ? (input.variants as { platform?: unknown }[]) : [];
    const variants = p.variants.map((cur) => {
      const x = incoming.find((i) => i.platform === cur.platform);
      // Published versions are a record of what went out — they aren't edited in place.
      return x && cur.publish.state !== "published" ? { ...cur, ...normalizeVariant(x) } : cur;
    });
    const mediaIds = await validMediaIds(input.mediaIds, p.contentType === "video" ? ["video", "image"] : ["image"]);
    const thumb = typeof input.thumbnailId === "string" && input.thumbnailId ? (await validMediaIds([input.thumbnailId], ["image"]))[0] ?? null : null;
    const idea = typeof input.idea === "string" ? input.idea.slice(0, 3000) : p.idea;
    const creative = normalizeCreative(input.creative);
    await updatePost(id, { idea, creative, variants, mediaIds, thumbnailId: thumb, status: statusAfterEdit(p.status), ...(p.status === "scheduled" ? { approvedBy: null, approvedAt: null } : {}) }, v.userId);
    const version = await recordVersion({ targetType: "post", targetId: id, source: "edit", kind: "post", label: p.title, snapshot: postSnapshot({ idea, creative, variants }), userId: v.userId, userEmail: v.email });
    await recordAudit({ ...who(v), action: "update", entity: "post", entityId: id, entityLabel: p.title, recordId: id, summary: `Saved v${version}${p.status === "scheduled" && p.approvedBy ? " · approval withdrawn" : ""}` });
    return { version };
  });
}

export async function generatePostAction(id: string, instruction?: string, platform?: string) {
  return run(["MANAGE_POSTS", "GENERATE_AI_CONTENT"], async (v) => {
    const p = await requirePost(id);
    const hadContent = Boolean(p.idea || p.variants.some((x) => x.content));
    const { version } = platform ? await regenerateVariant(p, platform, v, instr(instruction)) : await generatePostContent(p, v, instr(instruction));
    await recordAudit({ ...who(v), action: hadContent ? "regenerate" : "generate", entity: "post", entityId: id, entityLabel: p.title, recordId: id, summary: `${platform ? `${PLATFORM_META[platform as keyof typeof PLATFORM_META]?.label} version` : "All versions"} v${version}${instr(instruction) ? ` · “${instr(instruction)}”` : ""}` });
    return { version };
  });
}

export async function generatePostImageAction(id: string, prompt: string, platform: string | null, formatKey: string | null) {
  return run(["MANAGE_POSTS", "GENERATE_AI_CONTENT"], async (v) => {
    const p = await requirePost(id);
    const plat = platform && isPostPlatform(platform) ? platform : p.platforms[0];
    const media = await generateImageToLibrary({ prompt: prompt || p.creative.imagePrompt, platform: plat, formatKey, name: `${p.title} — AI image`, actor: v, link: { targetType: "post", targetId: id } });
    await updatePost(id, p.contentType === "video" ? { thumbnailId: p.thumbnailId ?? media._id } : { mediaIds: [...p.mediaIds, media._id].slice(0, 10) }, v.userId);
    await recordAudit({ ...who(v), action: "generate", entity: "media", entityId: media._id, entityLabel: media.name, recordId: id, summary: `AI image for post ${p.title}` });
    return { media: toMediaCard(media) };
  });
}

export async function duplicatePostAction(id: string) {
  return run(["MANAGE_POSTS"], async (v) => {
    const copy = await duplicatePost(await requirePost(id), v.userId);
    await recordAudit({ ...who(v), action: "duplicate", entity: "post", entityId: copy._id, entityLabel: copy.title, recordId: copy._id, summary: `From ${id}` });
    return { id: copy._id };
  });
}

export async function archivePostAction(id: string, archive: boolean) {
  return run(["MANAGE_POSTS"], async (v) => {
    const p = await requirePost(id);
    if (archive) await updatePost(id, { status: "archived", archivedFrom: p.status === "archived" ? p.archivedFrom : p.status, approvedBy: null, approvedAt: null }, v.userId);
    else {
      const back = p.archivedFrom && p.archivedFrom !== "archived" ? p.archivedFrom : "edited";
      // A post archived while scheduled comes back unscheduled — it has to be scheduled (and approved) again.
      await updatePost(id, { status: back === "scheduled" ? "edited" : back, archivedFrom: null, ...(back === "scheduled" ? { scheduledAt: null, scheduledBy: null } : {}) }, v.userId);
    }
    await recordAudit({ ...who(v), action: archive ? "archive" : "unarchive", entity: "post", entityId: id, entityLabel: p.title, recordId: id });
    return {};
  });
}

export async function deletePostAction(id: string) {
  return run(["MANAGE_POSTS"], async (v) => {
    const p = await requirePost(id);
    if (p.variants.some((x) => x.publish.state === "published") && !can(v, "DELETE_CAMPAIGNS")) throw new SmmsInputError("Published posts can only be archived.");
    await softDeletePost(id, v.userId);
    await recordAudit({ ...who(v), action: "delete", entity: "post", entityId: id, entityLabel: p.title, recordId: id });
    return {};
  });
}

export async function schedulePostAction(id: string, when: string | null, approve: boolean) {
  return run(["SCHEDULE_POSTS"], async (v) => {
    const p = await requirePost(id);
    if (p.status === "archived" || p.status === "published") throw new SmmsInputError("This post can't be scheduled in its current state.");
    if (!when) {
      await updatePost(id, { status: p.idea || p.variants.some((x) => x.content) ? "edited" : "draft", scheduledAt: null, scheduledBy: null, approvedBy: null, approvedAt: null }, v.userId);
      await recordAudit({ ...who(v), action: "unschedule", entity: "post", entityId: id, entityLabel: p.title, recordId: id });
      return { approved: false };
    }
    if (!p.variants.some((x) => (x.content || x.caption).trim())) throw new SmmsInputError("Write or generate the post before scheduling it.");
    const at = parseSchedule(when);
    const canApprove = approve && can(v, "PUBLISH_CONTENT");
    await updatePost(id, { status: "scheduled", scheduledAt: at, scheduledBy: v.userId, approvedBy: canApprove ? v.userId : null, approvedAt: canApprove ? new Date() : null }, v.userId);
    await recordAudit({ ...who(v), action: "schedule", entity: "post", entityId: id, entityLabel: p.title, recordId: id, summary: `${at.toISOString()}${canApprove ? " · approved to auto-publish" : " · awaiting approval"}` });
    return { approved: canApprove };
  });
}

export async function approvePostAction(id: string, approve: boolean) {
  return run(["PUBLISH_CONTENT"], async (v) => {
    const p = await requirePost(id);
    if (p.status !== "scheduled") throw new SmmsInputError("Only scheduled posts can be approved.");
    await updatePost(id, { approvedBy: approve ? v.userId : null, approvedAt: approve ? new Date() : null }, v.userId);
    await recordAudit({ ...who(v), action: "approve", entity: "post", entityId: id, entityLabel: p.title, recordId: id, summary: approve ? "Approved to auto-publish" : "Approval withdrawn" });
    return {};
  });
}

export async function publishPostAction(id: string, platforms: string[]) {
  return run(["PUBLISH_CONTENT"], async (v) => {
    const results = await publishPostNow(id, (Array.isArray(platforms) ? platforms : []).filter(isPostPlatform), { userId: v.userId, email: v.email });
    return { results };
  });
}

export async function markPostPublishedAction(id: string, platform: string, url: string) {
  return run(["PUBLISH_CONTENT"], async (v) => {
    if (!isPostPlatform(platform)) throw new SmmsInputError("Unknown platform.");
    const p = await markPublishedManually(id, platform, url?.trim() || null, { userId: v.userId, email: v.email });
    await recordAudit({ ...who(v), action: "publish", entity: "post", entityId: id, entityLabel: p.title, recordId: id, summary: `${PLATFORM_META[platform].label} marked published${url ? ` · ${url}` : ""}` });
    return {};
  });
}

export async function resetVariantPublishAction(id: string, platform: string) {
  return run(["PUBLISH_CONTENT"], async (v) => {
    if (!isPostPlatform(platform)) throw new SmmsInputError("Unknown platform.");
    const p = await requirePost(id);
    await resetPublish(id, platform, v.userId);
    await recordAudit({ ...who(v), action: "status", entity: "post", entityId: id, entityLabel: p.title, recordId: id, summary: `${PLATFORM_META[platform].label} publish status reset` });
    return {};
  });
}

export async function savePostMetricsAction(id: string, platform: string, metrics: Record<string, unknown>) {
  return run(["VIEW_ANALYTICS"], async (v) => {
    const p = await requirePost(id);
    const idx = p.variants.findIndex((x) => x.platform === platform);
    if (idx < 0) throw new SmmsInputError("That platform isn't part of this post.");
    if (p.variants[idx].publish.state !== "published") throw new SmmsInputError("Record performance once the post is published.");
    const m = Object.fromEntries(METRIC_KEYS.map((k) => [k, Math.min(Math.max(Math.round(Number(metrics[k]) || 0), 0), 1e12)])) as Omit<PostMetrics, "updatedAt" | "updatedBy">;
    const variants = p.variants.map((x, i) => (i === idx ? { ...x, metrics: { ...m, updatedAt: new Date(), updatedBy: v.userId } } : x));
    await updatePost(id, { variants }, v.userId);
    await recordAudit({ ...who(v), action: "metrics", entity: "post", entityId: id, entityLabel: p.title, recordId: id, summary: `${PLATFORM_META[platform as keyof typeof PLATFORM_META].label}: ${m.impressions} impressions, ${m.engagements} engagements` });
    return {};
  });
}

// ── Versions ────────────────────────────────────────────────────────────────

async function assertVersionAccess(v: SmmsViewer, targetType: TargetType, targetId: string, write: boolean): Promise<{ campaignId?: string }> {
  if (targetType === "campaign") {
    if (!can(v, write ? "EDIT_CAMPAIGNS" : "VIEW_CAMPAIGNS")) throw new ForbiddenError();
    await requireCampaign(targetId);
    return {};
  }
  if (targetType === "ad") {
    if (!can(v, write ? "CREATE_ADS" : "VIEW_CAMPAIGNS")) throw new ForbiddenError();
    return {};
  }
  if (targetType === "post") {
    if (!(can(v, "MANAGE_POSTS") || (!write && can(v, "VIEW_CAMPAIGNS")))) throw new ForbiddenError();
    await requirePost(targetId);
    return {};
  }
  throw new ForbiddenError();
}

export async function getVersionAction(targetType: TargetType, targetId: string, versionId: string) {
  return run([], async (v) => {
    await assertVersionAccess(v, targetType, targetId, false);
    const doc = await getVersion(targetType, targetId, versionId);
    if (!doc) throw new SmmsInputError("That version no longer exists.");
    return { snapshot: JSON.parse(JSON.stringify(doc.snapshot ?? null)), version: doc.version };
  }, { revalidate: false });
}

export async function restoreVersionAction(targetType: TargetType, targetId: string, versionId: string, campaignId?: string) {
  return run([], async (v) => {
    await assertVersionAccess(v, targetType, targetId, true);
    const doc = await getVersion(targetType, targetId, versionId);
    if (!doc) throw new SmmsInputError("That version no longer exists.");
    let label = "";
    let recordId = targetId;
    if (targetType === "campaign") {
      const c = await requireCampaign(targetId);
      if (c.status === "archived") throw new SmmsInputError("Restore the campaign from the archive first.");
      await saveCampaignAi(targetId, normalizeCampaignAi(doc.snapshot), statusAfterEdit(c.status), v.userId);
      label = c.name;
    } else if (targetType === "ad") {
      const ad = await requireAd(campaignId ?? "", targetId);
      if (ad.status === "archived" || ad.status === "published") throw new SmmsInputError("This ad can't be changed in its current state.");
      await updateAd(targetId, { content: normalizeAd(doc.snapshot), status: statusAfterEdit(ad.status), ...(ad.status === "scheduled" ? { approvedBy: null, approvedAt: null } : {}) }, v.userId);
      label = ad.name;
      recordId = ad.campaignId;
    } else {
      const p = await requirePost(targetId);
      if (p.status === "archived") throw new SmmsInputError("Restore the post from the archive first.");
      const snap = (doc.snapshot ?? {}) as { idea?: string; creative?: unknown; variants?: { platform: string }[] };
      const variants = p.variants.map((cur) => {
        const x = (snap.variants ?? []).find((s) => s.platform === cur.platform);
        return x && cur.publish.state !== "published" ? { ...cur, ...normalizeVariant(x) } : cur;
      });
      await updatePost(targetId, { idea: typeof snap.idea === "string" ? snap.idea : p.idea, creative: normalizeCreative(snap.creative), variants, status: statusAfterEdit(p.status), ...(p.status === "scheduled" ? { approvedBy: null, approvedAt: null } : {}) }, v.userId);
      label = p.title;
    }
    const version = await recordVersion({ targetType, targetId, source: "restore", kind: doc.kind, label, platform: doc.platform, snapshot: doc.snapshot, userId: v.userId, userEmail: v.email, instruction: `Restored v${doc.version}` });
    await recordAudit({ ...who(v), action: "restore", entity: targetType === "campaign" ? "campaign" : targetType === "ad" ? "ad" : "post", entityId: targetId, entityLabel: label, recordId, summary: `v${doc.version} → v${version}` });
    return { version };
  });
}

// ── Media library ───────────────────────────────────────────────────────────

export async function registerMediaAction(pathname: string, meta: Record<string, unknown>) {
  return run(["MANAGE_MEDIA"], async (v) => {
    const m = await registerUpload(String(pathname), meta, v.userId);
    await recordAudit({ ...who(v), action: "upload", entity: "media", entityId: m._id, entityLabel: m.name, summary: `${m.kind} · ${(m.size / 1048576).toFixed(1)} MB` });
    return { media: toMediaCard(m) };
  });
}

export async function replaceMediaAction(id: string, pathname: string, meta: Record<string, unknown>) {
  return run(["MANAGE_MEDIA"], async (v) => {
    const { after } = await replaceMediaFile(id, String(pathname), meta, v.userId);
    await recordAudit({ ...who(v), action: "replace", entity: "media", entityId: id, entityLabel: after.name, summary: `New file (${(after.size / 1048576).toFixed(1)} MB)` });
    return {};
  });
}

export async function updateMediaMetaAction(id: string, meta: Record<string, unknown>) {
  return run(["MANAGE_MEDIA"], async (v) => {
    const { before, after } = await updateMediaMeta(id, meta, v.userId);
    await recordAudit({ ...who(v), action: "update", entity: "media", entityId: id, entityLabel: after.name, summary: diffSummary({ ...before, tags: before.tags.join(",") }, { ...after, tags: after.tags.join(",") }, ["name", "platform", "tags", "thumbnailId"]) ?? "Details edited" });
    return {};
  });
}

export async function deleteMediaAction(id: string) {
  return run(["MANAGE_MEDIA"], async (v) => {
    const m = await deleteMedia(id, v.userId);
    await recordAudit({ ...who(v), action: "delete", entity: "media", entityId: id, entityLabel: m.name });
    return {};
  });
}

export async function generateMediaPromptAction(id: string) {
  return run(["MANAGE_MEDIA", "GENERATE_AI_CONTENT"], async (v) => {
    const m = await getMedia(id);
    if (!m) throw new SmmsInputError("That media item no longer exists.");
    const out = await generateMediaPrompt(m, v);
    await updateMediaMeta(id, { ...m, tags: m.tags, thumbnailId: m.thumbnailId ?? undefined, creativePrompt: out.prompt }, v.userId);
    await recordAudit({ ...who(v), action: "generate", entity: "media", entityId: id, entityLabel: m.name, summary: "Creative prompt" });
    return { prompt: out.prompt, concept: out.concept };
  });
}

export async function generateLibraryImageAction(input: { prompt: string; platform: string; formatKey: string; name: string }) {
  return run(["MANAGE_MEDIA", "GENERATE_AI_CONTENT"], async (v) => {
    const platform = isPlatform(input.platform) ? input.platform : null;
    const media = await generateImageToLibrary({ prompt: String(input.prompt ?? ""), platform, formatKey: String(input.formatKey ?? "") || null, name: String(input.name ?? "").slice(0, 160) || "AI image", actor: v });
    await recordAudit({ ...who(v), action: "generate", entity: "media", entityId: media._id, entityLabel: media.name, summary: "AI image" });
    return { media: toMediaCard(media) };
  });
}

export async function mediaUsageAction(id: string) {
  return run([], async (v) => {
    if (!can(v, "MANAGE_MEDIA") && !can(v, "MANAGE_POSTS") && !can(v, "CREATE_ADS")) throw new ForbiddenError();
    return { usage: await mediaUsage(String(id)) };
  }, { revalidate: false });
}

/** For the media picker dialog. */
export async function pickerMediaAction(q: string, kind: string, page: number) {
  return run([], async (v) => {
    if (!can(v, "MANAGE_POSTS") && !can(v, "CREATE_ADS") && !can(v, "MANAGE_MEDIA")) throw new ForbiddenError();
    const r = await listMedia({ q: String(q ?? "").slice(0, 100), kind, page, pageSize: 24 });
    return { items: r.items.map(toMediaCard), totalPages: r.totalPages };
  }, { revalidate: false });
}

// ── AI Content Generator ────────────────────────────────────────────────────

export async function runGeneratorAction(input: Record<string, unknown>) {
  return run(["GENERATE_AI_CONTENT"], async (v) => {
    if (!isGeneratorType(input.type)) throw new SmmsInputError("Pick what to generate.");
    const platform = typeof input.platform === "string" && isPlatform(input.platform) ? input.platform : "";
    const out = await runWorkspace(
      {
        type: input.type,
        platform,
        brief: String(input.brief ?? "").slice(0, 4000),
        audience: String(input.audience ?? "").slice(0, 1000),
        tone: String(input.tone ?? "").slice(0, 120),
        language: String(input.language ?? "").slice(0, 60),
        count: Number(input.count) || 3,
        offerId: typeof input.offerId === "string" && input.offerId ? input.offerId : null,
        clientId: typeof input.clientId === "string" && input.clientId ? input.clientId : null,
      },
      v
    );
    await recordAudit({ ...who(v), action: "generate", entity: "ai", entityId: out.id, entityLabel: String(input.brief ?? "").slice(0, 80), summary: `${input.type}${platform ? ` · ${PLATFORM_META[platform].label}` : ""}` });
    return out;
  });
}

export async function workspaceHistoryAction() {
  return run(["GENERATE_AI_CONTENT"], async (v) => {
    const rows = await listWorkspaceRuns(v.userId, 20);
    return { runs: rows.map((r) => ({ id: r.targetId, kind: r.kind, label: r.label, platform: r.platform, createdAt: r.createdAt.toISOString(), snapshot: JSON.parse(JSON.stringify(r.snapshot)) })) };
  }, { revalidate: false });
}

/** Turns one generator result into a post draft for its platform. */
export async function postFromGeneratorAction(item: { heading: string; body: string; cta: string; hashtags: string[] }, platform: string) {
  return run(["MANAGE_POSTS"], async (v) => {
    const plat = isPostPlatform(platform) ? platform : "linkedin";
    const brief = parsePostBrief({ topic: String(item.heading || item.body).slice(0, 300), title: String(item.heading ?? "").slice(0, 120), platforms: [plat], contentType: "image" });
    const variant = { platform: plat, ...normalizeVariant({ title: item.heading, content: item.body, cta: item.cta, hashtags: item.hashtags }) };
    const p = await createPost(brief, v.userId, { idea: String(item.heading ?? "").slice(0, 500), variants: reconcileVariants([{ ...variant, publish: { state: "pending", method: null, externalId: null, url: null, error: null, at: null, by: null }, metrics: null }], [plat]) });
    await recordVersion({ targetType: "post", targetId: p._id, source: "edit", kind: "post", label: p.title, snapshot: postSnapshot(p), userId: v.userId, userEmail: v.email, instruction: "Created from AI Content Generator" });
    await recordAudit({ ...who(v), action: "create", entity: "post", entityId: p._id, entityLabel: p.title, recordId: p._id, summary: "From AI Content Generator" });
    return { id: p._id };
  });
}

// ── Settings & integrations ─────────────────────────────────────────────────

export async function saveBrandAction(input: Record<string, unknown>) {
  return run(["MANAGE_INTEGRATIONS"], async (v) => {
    await saveBrand(input, v.userId);
    await recordAudit({ ...who(v), action: "settings", entity: "settings", entityId: "brand", entityLabel: "Brand context" });
    return {};
  });
}

export async function saveAiSettingsAction(input: Record<string, unknown>) {
  return run(["MANAGE_INTEGRATIONS"], async (v) => {
    const ai = await saveAi(input, v.userId);
    await recordAudit({ ...who(v), action: "settings", entity: "settings", entityId: "ai", entityLabel: "AI settings", summary: `${ai.textModel} / ${ai.imageModel}` });
    return {};
  });
}

export async function disconnectIntegrationAction(provider: string) {
  return run(["MANAGE_INTEGRATIONS"], async (v) => {
    if (!isProvider(provider)) throw new SmmsInputError("Unknown provider.");
    await disconnect(provider);
    await recordAudit({ ...who(v), action: "disconnect", entity: "integration", entityId: provider, entityLabel: provider });
    return {};
  });
}

export async function selectIntegrationTargetAction(provider: string, platform: string, targetId: string) {
  return run(["MANAGE_INTEGRATIONS"], async (v) => {
    if (!isProvider(provider) || !isPlatform(platform)) throw new SmmsInputError("Unknown provider.");
    await selectTarget(provider, platform, targetId);
    await recordAudit({ ...who(v), action: "update", entity: "integration", entityId: provider, entityLabel: provider, summary: `${PLATFORM_META[platform].label} → ${targetId}` });
    return {};
  });
}
