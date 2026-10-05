import "server-only";
import { connectionValues } from "@/lib/platform/connections/resolve";
import { randomBytes } from "node:crypto";
import { COLLECTIONS, smmsCollection, str } from "@/lib/smms/db";
import { encryptSecret, decryptSecret, isEncryptionConfigured, type EncryptedValue } from "@/lib/smms/crypto";
import { PLATFORM_META, type Platform, type Provider } from "@/lib/smms/constants";
import { SmmsInputError } from "@/lib/smms/viewer";

/**
 * Platform connections, one document per OAuth provider (`smms_integrations`,
 * `_id` = provider): Meta (Facebook Pages + Instagram professional accounts),
 * Google (YouTube + Business Profile) and LinkedIn. Tokens are encrypted with
 * `SMMS_ENCRYPTION_KEY` (AES-256-GCM, record id as AAD) and only decrypted at
 * the moment a publish call needs them — never sent to a page or logged.
 *
 * Google Ads is deliberately not a publishing target: SMMS never creates paid
 * ads (that spends money) — ad results reach SMMS through the LMS import.
 */

export const GRAPH = `https://graph.facebook.com/${process.env.META_GRAPH_VERSION || "v23.0"}`;
export const LINKEDIN_VERSION = process.env.LINKEDIN_API_VERSION || "202509";

interface ProviderConfig {
  label: string;
  platforms: Platform[];
  clientIdEnv: string;
  secretEnv: string;
  authorizeUrl: string;
  scopes: string[];
  extraAuthParams?: Record<string, string>;
}

export const PROVIDERS: Record<Provider, ProviderConfig> = {
  meta: {
    label: "Meta (Facebook & Instagram)",
    platforms: ["facebook", "instagram"],
    clientIdEnv: "META_APP_ID",
    secretEnv: "META_APP_SECRET",
    authorizeUrl: `https://www.facebook.com/${process.env.META_GRAPH_VERSION || "v23.0"}/dialog/oauth`,
    scopes: ["pages_show_list", "pages_read_engagement", "pages_manage_posts", "instagram_basic", "instagram_content_publish", "business_management"],
  },
  google: {
    label: "Google (YouTube & Business Profile)",
    platforms: ["youtube", "google_business"],
    clientIdEnv: "GOOGLE_OAUTH_CLIENT_ID",
    secretEnv: "GOOGLE_OAUTH_CLIENT_SECRET",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    scopes: ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube.readonly", "https://www.googleapis.com/auth/business.manage"],
    extraAuthParams: { access_type: "offline", prompt: "consent", include_granted_scopes: "true" },
  },
  linkedin: {
    label: "LinkedIn",
    platforms: ["linkedin"],
    clientIdEnv: "LINKEDIN_CLIENT_ID",
    secretEnv: "LINKEDIN_CLIENT_SECRET",
    authorizeUrl: "https://www.linkedin.com/oauth/v2/authorization",
    scopes: ["openid", "profile", "w_member_social"],
  },
};

export const isProvider = (v: unknown): v is Provider => v === "meta" || v === "google" || v === "linkedin";

/** The workspace's own OAuth app for a provider (Workspace → Settings → Integrations), or null. */
export async function oauthApp(p: Provider): Promise<{ id: string; secret: string } | null> {
  const v = await connectionValues(p);
  const id = p === "meta" ? v?.appId : v?.clientId;
  const secret = p === "meta" ? v?.appSecret : v?.clientSecret;
  return id && secret ? { id, secret } : null;
}

export async function providerConfigured(p: Provider): Promise<boolean> {
  return (await oauthApp(p)) !== null;
}

export interface Target {
  id: string;
  name: string;
  /** Meta page access token (encrypted) — pages publish with their own token. */
  tokenEnc?: EncryptedValue | null;
  /** Instagram: the Facebook Page the account is linked to. */
  pageId?: string;
}

export interface IntegrationDoc {
  _id: Provider;
  status: "connected" | "error";
  accountName: string;
  accessEnc: EncryptedValue;
  refreshEnc: EncryptedValue | null;
  expiresAt: Date | null;
  scopes: string[];
  /** What this connection can publish to. */
  targets: { facebookPages: Target[]; instagramAccounts: Target[]; youtubeChannels: Target[]; gbpLocations: Target[]; linkedinAuthors: Target[] };
  /** The chosen target per platform. */
  selected: Partial<Record<Platform, string>>;
  lastError: string | null;
  connectedBy: string;
  connectedAt: Date;
  updatedAt: Date;
}

const EMPTY_TARGETS: IntegrationDoc["targets"] = { facebookPages: [], instagramAccounts: [], youtubeChannels: [], gbpLocations: [], linkedinAuthors: [] };

async function col() {
  return smmsCollection<IntegrationDoc>(COLLECTIONS.integrations);
}

export async function getIntegration(p: Provider): Promise<IntegrationDoc | null> {
  return (await col()).findOne({ _id: p });
}

/** What a page may show — never tokens. */
export interface IntegrationView {
  provider: Provider;
  label: string;
  platforms: Platform[];
  configured: boolean;
  connected: boolean;
  status: "connected" | "error" | null;
  accountName: string | null;
  expiresAt: string | null;
  lastError: string | null;
  connectedAt: string | null;
  targets: Record<string, { id: string; name: string }[]>;
  selected: Partial<Record<Platform, string>>;
}

export async function listIntegrationViews(): Promise<IntegrationView[]> {
  const docs = await (await col()).find({}).toArray();
  return Promise.all((Object.keys(PROVIDERS) as Provider[]).map(async (p) => {
    const d = docs.find((x) => x._id === p);
    const t = d?.targets ?? EMPTY_TARGETS;
    const strip = (xs: Target[]) => xs.map((x) => ({ id: x.id, name: x.name }));
    return {
      provider: p,
      label: PROVIDERS[p].label,
      platforms: PROVIDERS[p].platforms,
      configured: await providerConfigured(p),
      connected: Boolean(d),
      status: d?.status ?? null,
      accountName: d?.accountName ?? null,
      expiresAt: d?.expiresAt?.toISOString() ?? null,
      lastError: d?.lastError ?? null,
      connectedAt: d?.connectedAt?.toISOString() ?? null,
      targets: { facebook: strip(t.facebookPages), instagram: strip(t.instagramAccounts), youtube: strip(t.youtubeChannels), google_business: strip(t.gbpLocations), linkedin: strip(t.linkedinAuthors) },
      selected: d?.selected ?? {},
    };
  }));
}

/** Which post platforms can publish through the API right now (connected + a target selected). */
export async function connectedPlatforms(): Promise<Set<Platform>> {
  const docs = await (await col()).find({ status: "connected" }).toArray();
  const out = new Set<Platform>();
  for (const d of docs) for (const p of PROVIDERS[d._id].platforms) if (d.selected?.[p]) out.add(p);
  return out;
}

// ── OAuth ───────────────────────────────────────────────────────────────────

export function newOAuthState(): string {
  return randomBytes(24).toString("base64url");
}

export async function authorizeUrl(p: Provider, redirectUri: string, state: string): Promise<string> {
  const cfg = PROVIDERS[p];
  const app = await oauthApp(p);
  if (!app) throw new SmmsInputError(`${cfg.label} isn't set up. Add your app credentials in Workspace → Settings → Integrations.`);
  const params = new URLSearchParams({ client_id: app.id, redirect_uri: redirectUri, state, response_type: "code", scope: cfg.scopes.join(p === "meta" ? "," : " "), ...(cfg.extraAuthParams ?? {}) });
  return `${cfg.authorizeUrl}?${params.toString()}`;
}

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(30_000) });
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const b = body as { error?: { message?: string } | string; error_description?: string; message?: string } | null;
    const msg = (typeof b?.error === "object" ? b.error?.message : b?.error_description || b?.message || (typeof b?.error === "string" ? b.error : null)) || `HTTP ${res.status}`;
    throw new Error(String(msg).slice(0, 300));
  }
  return body as T;
}
export { jsonFetch };

interface TokenSet {
  access: string;
  refresh: string | null;
  expiresIn: number | null;
  scopes: string[];
}

async function exchangeCode(p: Provider, code: string, redirectUri: string): Promise<TokenSet> {
  const cfg = PROVIDERS[p];
  const app = await oauthApp(p);
  if (!app) throw new SmmsInputError(`${cfg.label} isn't set up. Add your app credentials in Workspace → Settings → Integrations.`);
  const id = app.id;
  const secret = app.secret;
  if (p === "meta") {
    const short = await jsonFetch<{ access_token: string }>(`${GRAPH}/oauth/access_token?${new URLSearchParams({ client_id: id, client_secret: secret, redirect_uri: redirectUri, code })}`);
    // Long-lived user token (~60 days); page tokens derived from it don't expire.
    const long = await jsonFetch<{ access_token: string; expires_in?: number }>(`${GRAPH}/oauth/access_token?${new URLSearchParams({ grant_type: "fb_exchange_token", client_id: id, client_secret: secret, fb_exchange_token: short.access_token })}`);
    return { access: long.access_token, refresh: null, expiresIn: long.expires_in ?? null, scopes: cfg.scopes };
  }
  const url = p === "google" ? "https://oauth2.googleapis.com/token" : "https://www.linkedin.com/oauth/v2/accessToken";
  const t = await jsonFetch<{ access_token: string; refresh_token?: string; expires_in?: number; scope?: string }>(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri, client_id: id, client_secret: secret }),
  });
  return { access: t.access_token, refresh: t.refresh_token ?? null, expiresIn: t.expires_in ?? null, scopes: t.scope ? t.scope.split(/[ ,]+/) : cfg.scopes };
}

async function discoverTargets(p: Provider, access: string): Promise<{ accountName: string; targets: IntegrationDoc["targets"] }> {
  const targets: IntegrationDoc["targets"] = { facebookPages: [], instagramAccounts: [], youtubeChannels: [], gbpLocations: [], linkedinAuthors: [] };
  if (p === "meta") {
    const me = await jsonFetch<{ name?: string }>(`${GRAPH}/me?fields=name&access_token=${encodeURIComponent(access)}`);
    const pages = await jsonFetch<{ data: { id: string; name: string; access_token: string; instagram_business_account?: { id: string; username?: string } }[] }>(
      `${GRAPH}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&limit=100&access_token=${encodeURIComponent(access)}`
    );
    for (const pg of pages.data ?? []) {
      targets.facebookPages.push({ id: pg.id, name: pg.name, tokenEnc: encryptSecret(pg.access_token, `meta:page:${pg.id}`) });
      if (pg.instagram_business_account) targets.instagramAccounts.push({ id: pg.instagram_business_account.id, name: `@${pg.instagram_business_account.username ?? pg.instagram_business_account.id} (via ${pg.name})`, pageId: pg.id });
    }
    return { accountName: me.name ?? "Meta account", targets };
  }
  if (p === "google") {
    const auth = { headers: { Authorization: `Bearer ${access}` } };
    let accountName = "Google account";
    try {
      const ch = await jsonFetch<{ items?: { id: string; snippet: { title: string } }[] }>("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", auth);
      for (const c of ch.items ?? []) targets.youtubeChannels.push({ id: c.id, name: c.snippet.title });
      if (ch.items?.[0]) accountName = ch.items[0].snippet.title;
    } catch {
      // YouTube may not be enabled for this account — Business Profile can still work.
    }
    try {
      const accts = await jsonFetch<{ accounts?: { name: string; accountName: string }[] }>("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", auth);
      for (const a of (accts.accounts ?? []).slice(0, 10)) {
        const locs = await jsonFetch<{ locations?: { name: string; title: string }[] }>(`https://mybusinessbusinessinformation.googleapis.com/v1/${a.name}/locations?readMask=name,title&pageSize=100`, auth).catch(() => ({ locations: [] as { name: string; title: string }[] }));
        // Local posts (v4) address a location as accounts/{a}/locations/{l}.
        for (const l of locs.locations ?? []) targets.gbpLocations.push({ id: `${a.name}/${l.name}`, name: `${l.title} (${a.accountName})` });
      }
    } catch {
      // Business Profile API access not granted — YouTube can still work.
    }
    return { accountName, targets };
  }
  const me = await jsonFetch<{ sub: string; name?: string }>("https://api.linkedin.com/v2/userinfo", { headers: { Authorization: `Bearer ${access}` } });
  targets.linkedinAuthors.push({ id: `urn:li:person:${me.sub}`, name: `${me.name ?? "Member"} (personal profile)` });
  return { accountName: me.name ?? "LinkedIn member", targets };
}

export async function completeOAuth(p: Provider, code: string, redirectUri: string, actorId: string): Promise<IntegrationDoc> {
  if (!isEncryptionConfigured()) throw new SmmsInputError("SMMS_ENCRYPTION_KEY isn't set on the server, so tokens can't be stored safely.");
  const tokens = await exchangeCode(p, code, redirectUri);
  const { accountName, targets } = await discoverTargets(p, tokens.access);
  const selected: Partial<Record<Platform, string>> = {};
  if (targets.facebookPages[0]) selected.facebook = targets.facebookPages[0].id;
  if (targets.instagramAccounts[0]) selected.instagram = targets.instagramAccounts[0].id;
  if (targets.youtubeChannels[0]) selected.youtube = targets.youtubeChannels[0].id;
  if (targets.gbpLocations[0]) selected.google_business = targets.gbpLocations[0].id;
  if (targets.linkedinAuthors[0]) selected.linkedin = targets.linkedinAuthors[0].id;
  const now = new Date();
  const doc: IntegrationDoc = {
    _id: p,
    status: "connected",
    accountName,
    accessEnc: encryptSecret(tokens.access, `${p}:access`),
    refreshEnc: tokens.refresh ? encryptSecret(tokens.refresh, `${p}:refresh`) : null,
    expiresAt: tokens.expiresIn ? new Date(now.getTime() + tokens.expiresIn * 1000) : null,
    scopes: tokens.scopes,
    targets,
    selected,
    lastError: null,
    connectedBy: actorId,
    connectedAt: now,
    updatedAt: now,
  };
  await (await col()).replaceOne({ _id: p }, doc, { upsert: true });
  return doc;
}

export async function disconnect(p: Provider): Promise<void> {
  await (await col()).deleteOne({ _id: p });
}

export async function selectTarget(p: Provider, platform: Platform, targetId: string): Promise<void> {
  const d = await getIntegration(p);
  if (!d) throw new SmmsInputError("That account isn't connected.");
  if (!PROVIDERS[p].platforms.includes(platform)) throw new SmmsInputError("That platform doesn't belong to this connection.");
  const key = { facebook: "facebookPages", instagram: "instagramAccounts", youtube: "youtubeChannels", google_business: "gbpLocations", linkedin: "linkedinAuthors" }[platform as string] as keyof IntegrationDoc["targets"] | undefined;
  if (!key || !d.targets[key].some((t) => t.id === targetId)) throw new SmmsInputError("Pick one of the discovered accounts.");
  await (await col()).updateOne({ _id: p }, { $set: { [`selected.${platform}`]: str(targetId, 300), updatedAt: new Date() } });
}

export async function markIntegrationError(p: Provider, message: string): Promise<void> {
  await (await col()).updateOne({ _id: p }, { $set: { lastError: message.slice(0, 300), updatedAt: new Date() } });
}

/** A usable access token for the provider, refreshing Google's when it's close to expiry. */
export async function accessToken(p: Provider): Promise<{ doc: IntegrationDoc; token: string }> {
  const doc = await getIntegration(p);
  if (!doc) throw new SmmsInputError(`${PROVIDERS[p].label} isn't connected.`);
  let token = decryptSecret(doc.accessEnc, `${p}:access`);
  if (!token) throw new SmmsInputError(`The stored ${PROVIDERS[p].label} token can't be read — reconnect the account.`);
  if (p === "google" && doc.expiresAt && doc.expiresAt.getTime() < Date.now() + 120_000) {
    const refresh = decryptSecret(doc.refreshEnc, `${p}:refresh`);
    if (!refresh) throw new SmmsInputError("The Google connection expired — reconnect it in Settings.");
    const t = await jsonFetch<{ access_token: string; expires_in?: number }>("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refresh, client_id: (await oauthApp("google"))?.id ?? "", client_secret: (await oauthApp("google"))?.secret ?? "" }),
    });
    token = t.access_token;
    await (await col()).updateOne({ _id: p }, { $set: { accessEnc: encryptSecret(token, `${p}:access`), expiresAt: new Date(Date.now() + (t.expires_in ?? 3600) * 1000), updatedAt: new Date() } });
  } else if (doc.expiresAt && doc.expiresAt.getTime() < Date.now()) {
    throw new SmmsInputError(`The ${PROVIDERS[p].label} connection expired — reconnect it in Settings.`);
  }
  return { doc, token };
}

export function pageToken(doc: IntegrationDoc, pageId: string): string {
  const page = doc.targets.facebookPages.find((x) => x.id === pageId);
  const t = page?.tokenEnc ? decryptSecret(page.tokenEnc, `meta:page:${pageId}`) : null;
  if (!t) throw new SmmsInputError("The Facebook Page token can't be read — reconnect Meta.");
  return t;
}

export function providerFor(platform: Platform): Provider {
  return PLATFORM_META[platform].provider;
}
