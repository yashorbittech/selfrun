import "server-only";
import { getObject } from "@/lib/storage/blob";
import { companySiteUrl } from "@/lib/platform/tenancy/site-url";
import { isPlatformOwnerContext } from "@/lib/platform/tenancy/context";
import { signMediaToken } from "@/lib/smms/crypto";
import { accessToken, pageToken, jsonFetch, GRAPH, LINKEDIN_VERSION } from "@/lib/smms/integrations";
import { hashtagText } from "@/lib/smms/content";
import { PLATFORM_META, type PostPlatform } from "@/lib/smms/constants";
import type { MediaDoc } from "@/lib/smms/media";
import type { PostVariant } from "@/lib/smms/posts";
import { SmmsInputError } from "@/lib/smms/viewer";

/**
 * One adapter per organic-post platform. Each takes the post's version for
 * that platform plus its media and returns the platform's id/URL for the new
 * post. Adapters are only ever called from an explicit Publish action or an
 * approved schedule (`publishing.ts`) — never straight after generation.
 *
 * Platforms that fetch media by URL (Facebook, Instagram, Business Profile)
 * get a signed, one-hour URL to `/api/smms/media/public/[id]`; LinkedIn and
 * YouTube receive the bytes.
 *
 * NOTE: written against each platform's documented API; not yet exercised
 * against live accounts (no app credentials in this environment).
 */

export interface PublishInput {
  platform: PostPlatform;
  variant: PostVariant;
  title: string;
  link: string | null;
  images: MediaDoc[];
  video: MediaDoc | null;
  thumbnail: MediaDoc | null;
}

export interface PublishOutput {
  externalId: string;
  url: string | null;
}

/**
 * Signed media URL on the company's own site — the media route resolves the
 * company from the host. `SMMS_PUBLIC_BASE_URL` is one platform-wide env var,
 * so only the platform owner honours it.
 */
export async function publicMediaUrl(mediaId: string): Promise<string> {
  const exp = Date.now() + 60 * 60 * 1000;
  const sig = signMediaToken(mediaId, exp);
  if (!sig) throw new SmmsInputError("SMMS_ENCRYPTION_KEY isn't set, so media can't be handed to the platform.");
  const override = process.env.SMMS_PUBLIC_BASE_URL && (await isPlatformOwnerContext()) ? process.env.SMMS_PUBLIC_BASE_URL : null;
  const base = (override || (await companySiteUrl())).replace(/\/$/, "");
  return `${base}/api/smms/media/public/${mediaId}?exp=${exp}&sig=${sig}`;
}

async function mediaBytes(m: MediaDoc): Promise<Buffer> {
  const obj = await getObject(m.storageKey);
  if (!obj) throw new SmmsInputError(`The file for "${m.name}" is missing from storage.`);
  return Buffer.from(await new Response(obj.stream).arrayBuffer());
}

/** Body text for platforms that take one text field. Hashtags are appended unless already present or the platform doesn't use them. */
export function composeText(p: PostPlatform, v: PostVariant, link: string | null): string {
  const body = (v.content || v.caption).trim();
  const usesTags = p !== "google_business";
  const tags = usesTags && v.hashtags.length && !v.hashtags.every((h) => body.includes(h)) ? `\n\n${hashtagText(v.hashtags)}` : "";
  const withLink = link && p === "linkedin" && !body.includes(link) ? `${body}\n\n${link}` : body;
  return `${withLink}${tags}`.slice(0, PLATFORM_META[p].captionLimit);
}

async function facebook(i: PublishInput): Promise<PublishOutput> {
  const { doc } = await accessToken("meta");
  const pageId = doc.selected.facebook;
  if (!pageId) throw new SmmsInputError("Choose a Facebook Page in Settings → Integrations.");
  const token = pageToken(doc, pageId);
  const message = composeText("facebook", i.variant, i.link);
  const form = (o: Record<string, string>) => ({ method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ ...o, access_token: token }) });
  if (i.video) {
    const r = await jsonFetch<{ id: string }>(`${GRAPH.replace("graph.", "graph-video.")}/${pageId}/videos`, form({ file_url: await publicMediaUrl(i.video._id), description: message, ...(i.variant.title ? { title: i.variant.title } : {}) }));
    return { externalId: r.id, url: `https://www.facebook.com/${pageId}/videos/${r.id}` };
  }
  if (i.images.length > 0) {
    const r = await jsonFetch<{ id: string; post_id?: string }>(`${GRAPH}/${pageId}/photos`, form({ url: await publicMediaUrl(i.images[0]._id), caption: message }));
    return { externalId: r.post_id ?? r.id, url: `https://www.facebook.com/${r.post_id ?? r.id}` };
  }
  const r = await jsonFetch<{ id: string }>(`${GRAPH}/${pageId}/feed`, form({ message, ...(i.link ? { link: i.link } : {}) }));
  return { externalId: r.id, url: `https://www.facebook.com/${r.id}` };
}

async function instagram(i: PublishInput): Promise<PublishOutput> {
  const { doc, token } = await accessToken("meta");
  const igId = doc.selected.instagram;
  if (!igId) throw new SmmsInputError("Choose an Instagram account in Settings → Integrations.");
  if (!i.video && i.images.length === 0) throw new SmmsInputError("Instagram needs an image or a video.");
  const caption = composeText("instagram", i.variant, null);
  const post = (url: string, o: Record<string, string>) => jsonFetch<{ id: string }>(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ ...o, access_token: token }) });
  let creationId: string;
  if (i.video) {
    creationId = (await post(`${GRAPH}/${igId}/media`, { media_type: "REELS", video_url: await publicMediaUrl(i.video._id), caption, ...(i.thumbnail ? { cover_url: await publicMediaUrl(i.thumbnail._id) } : {}) })).id;
  } else if (i.images.length > 1) {
    const children: string[] = [];
    for (const img of i.images.slice(0, 10)) children.push((await post(`${GRAPH}/${igId}/media`, { image_url: await publicMediaUrl(img._id), is_carousel_item: "true" })).id);
    creationId = (await post(`${GRAPH}/${igId}/media`, { media_type: "CAROUSEL", children: children.join(","), caption })).id;
  } else {
    creationId = (await post(`${GRAPH}/${igId}/media`, { image_url: await publicMediaUrl(i.images[0]._id), caption })).id;
  }
  // Containers (videos especially) must finish processing before they can be published.
  for (let n = 0; n < 24; n++) {
    const st = await jsonFetch<{ status_code?: string }>(`${GRAPH}/${creationId}?fields=status_code&access_token=${encodeURIComponent(token)}`);
    if (st.status_code === "FINISHED" || !st.status_code) break;
    if (st.status_code === "ERROR" || st.status_code === "EXPIRED") throw new Error(`Instagram couldn't process the media (${st.status_code}).`);
    await new Promise((r) => setTimeout(r, 5000));
  }
  const published = await post(`${GRAPH}/${igId}/media_publish`, { creation_id: creationId });
  const info = await jsonFetch<{ permalink?: string }>(`${GRAPH}/${published.id}?fields=permalink&access_token=${encodeURIComponent(token)}`).catch(() => ({ permalink: undefined }));
  return { externalId: published.id, url: info.permalink ?? null };
}

async function linkedin(i: PublishInput): Promise<PublishOutput> {
  const { doc, token } = await accessToken("linkedin");
  const author = doc.selected.linkedin;
  if (!author) throw new SmmsInputError("Choose a LinkedIn author in Settings → Integrations.");
  const headers = { Authorization: `Bearer ${token}`, "LinkedIn-Version": LINKEDIN_VERSION, "X-Restli-Protocol-Version": "2.0.0", "Content-Type": "application/json" };
  let content: Record<string, unknown> | undefined;
  if (i.video) {
    const bytes = await mediaBytes(i.video);
    const init = await jsonFetch<{ value: { video: string; uploadToken: string; uploadInstructions: { uploadUrl: string; firstByte: number; lastByte: number }[] } }>("https://api.linkedin.com/rest/videos?action=initializeUpload", {
      method: "POST",
      headers,
      body: JSON.stringify({ initializeUploadRequest: { owner: author, fileSizeBytes: bytes.length, uploadCaptions: false, uploadThumbnail: false } }),
    });
    const etags: string[] = [];
    for (const part of init.value.uploadInstructions) {
      const res = await fetch(part.uploadUrl, { method: "PUT", body: new Uint8Array(bytes.subarray(part.firstByte, part.lastByte + 1)), headers: { "Content-Type": "application/octet-stream" } });
      if (!res.ok) throw new Error(`LinkedIn video upload failed (HTTP ${res.status}).`);
      etags.push(res.headers.get("etag") ?? "");
    }
    await jsonFetch("https://api.linkedin.com/rest/videos?action=finalizeUpload", { method: "POST", headers, body: JSON.stringify({ finalizeUploadRequest: { video: init.value.video, uploadToken: init.value.uploadToken, uploadedPartIds: etags } }) });
    content = { media: { id: init.value.video, title: i.variant.title || i.title } };
  } else if (i.images.length > 0) {
    const bytes = await mediaBytes(i.images[0]);
    const init = await jsonFetch<{ value: { uploadUrl: string; image: string } }>("https://api.linkedin.com/rest/images?action=initializeUpload", { method: "POST", headers, body: JSON.stringify({ initializeUploadRequest: { owner: author } }) });
    const up = await fetch(init.value.uploadUrl, { method: "PUT", body: new Uint8Array(bytes), headers: { Authorization: `Bearer ${token}` } });
    if (!up.ok) throw new Error(`LinkedIn image upload failed (HTTP ${up.status}).`);
    content = { media: { id: init.value.image, altText: i.images[0].altText || i.variant.title || i.title } };
  } else if (i.link) {
    content = { article: { source: i.link, title: i.variant.title || i.title } };
  }
  const res = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers,
    body: JSON.stringify({ author, commentary: composeText("linkedin", i.variant, content?.article ? null : i.link), visibility: "PUBLIC", distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] }, lifecycleState: "PUBLISHED", isReshareDisabledByAuthor: false, ...(content ? { content } : {}) }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`LinkedIn rejected the post (HTTP ${res.status}): ${(await res.text()).slice(0, 200)}`);
  const urn = res.headers.get("x-restli-id") ?? "";
  return { externalId: urn, url: urn ? `https://www.linkedin.com/feed/update/${urn}` : null };
}

async function youtube(i: PublishInput): Promise<PublishOutput> {
  const { token } = await accessToken("google");
  if (!i.video) throw new SmmsInputError("YouTube needs a video.");
  const bytes = await mediaBytes(i.video);
  const v = i.variant;
  const init = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=UTF-8", "X-Upload-Content-Length": String(bytes.length), "X-Upload-Content-Type": i.video.contentType },
    body: JSON.stringify({ snippet: { title: (v.title || i.title).slice(0, 100), description: composeText("youtube", v, i.link), tags: v.keywords.slice(0, 30), categoryId: "22" }, status: { privacyStatus: "public", selfDeclaredMadeForKids: false } }),
  });
  const location = init.headers.get("location");
  if (!init.ok || !location) throw new Error(`YouTube refused the upload (HTTP ${init.status}).`);
  const up = await jsonFetch<{ id: string }>(location, { method: "PUT", headers: { "Content-Type": i.video.contentType }, body: new Uint8Array(bytes) });
  if (i.thumbnail) {
    const thumb = await mediaBytes(i.thumbnail);
    await fetch(`https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${up.id}`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": i.thumbnail.contentType }, body: new Uint8Array(thumb) }).catch(() => {});
  }
  return { externalId: up.id, url: `https://www.youtube.com/watch?v=${up.id}` };
}

const GBP_ACTIONS: Record<string, string> = { "book now": "BOOK", "book": "BOOK", "shop now": "SHOP", "order": "ORDER", "sign up": "SIGN_UP", "register": "SIGN_UP", "call now": "CALL" };

async function googleBusiness(i: PublishInput): Promise<PublishOutput> {
  const { doc, token } = await accessToken("google");
  const location = doc.selected.google_business;
  if (!location) throw new SmmsInputError("Choose a Business Profile location in Settings → Integrations.");
  const actionType = GBP_ACTIONS[i.variant.cta.trim().toLowerCase()] ?? "LEARN_MORE";
  const body = {
    languageCode: "en",
    topicType: "STANDARD",
    summary: composeText("google_business", i.variant, null),
    ...(i.link || actionType === "CALL" ? { callToAction: actionType === "CALL" ? { actionType } : { actionType, url: i.link } } : {}),
    ...(i.images[0] ? { media: [{ mediaFormat: "PHOTO", sourceUrl: await publicMediaUrl(i.images[0]._id) }] } : {}),
  };
  const r = await jsonFetch<{ name: string; searchUrl?: string }>(`https://mybusiness.googleapis.com/v4/${location}/localPosts`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return { externalId: r.name, url: r.searchUrl ?? null };
}

export const PUBLISHERS: Record<PostPlatform, (i: PublishInput) => Promise<PublishOutput>> = {
  facebook,
  instagram,
  linkedin,
  youtube,
  google_business: googleBusiness,
};
