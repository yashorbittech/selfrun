import "server-only";
import { isPlatformOwnerContext, currentCompanyIdOrNull } from "@/lib/platform/tenancy/context";
import { getSavedConnection } from "@/lib/platform/connections/store";

/**
 * What the rest of the app asks for: "the credentials for <provider>, for the current company".
 *
 *  1. the company's own saved connection (Workspace → Settings → Integrations)
 *  2. else — for the PLATFORM OWNER's own workspace only — the deployment's environment variables, so an existing
 *     env-configured deployment keeps working
 *  3. else nothing. No company ever falls back to another company's or the platform's keys.
 */
export const ENV_CONNECTION_PROVIDERS = (): string[] => Object.keys(ENV);
const ENV: Record<string, Record<string, string[]>> = {
  openai: { apiKey: ["OPENAI_API_KEY"] },
  elevenlabs: { apiKey: ["ELEVENLABS_API_KEY"] },
  "google-service-account": { clientEmail: ["GOOGLE_SEO_CLIENT_EMAIL", "GOOGLE_INDEXING_CLIENT_EMAIL"], privateKey: ["GOOGLE_SEO_PRIVATE_KEY", "GOOGLE_INDEXING_PRIVATE_KEY"] },
  pagespeed: { apiKey: ["PAGESPEED_API_KEY"] },
  turn: { url: ["MESSENGER_TURN_URL"], username: ["MESSENGER_TURN_USERNAME"], credential: ["MESSENGER_TURN_CREDENTIAL"] },
  meta: { appId: ["META_APP_ID"], appSecret: ["META_APP_SECRET"] },
  google: { clientId: ["GOOGLE_OAUTH_CLIENT_ID"], clientSecret: ["GOOGLE_OAUTH_CLIENT_SECRET"] },
  linkedin: { clientId: ["LINKEDIN_CLIENT_ID"], clientSecret: ["LINKEDIN_CLIENT_SECRET"] },
};

/** The credentials a deployment's environment holds for `provider` (null when none) — used by the platform operator, and by the operator-separation migration. */
export function fromEnv(provider: string): Record<string, string> | null {
  const map = ENV[provider];
  if (!map) return null;
  const out: Record<string, string> = {};
  for (const [field, names] of Object.entries(map)) {
    const v = names.map((n) => process.env[n]?.trim()).find(Boolean);
    if (v) out[field] = v;
  }
  return Object.keys(out).length ? out : null;
}

export type ResolvedConnection = { values: Record<string, string>; source: "workspace" | "environment" };

export async function resolveConnection(provider: string): Promise<ResolvedConnection | null> {
  if (!(await currentCompanyIdOrNull())) return null;
  const saved = await getSavedConnection(provider);
  if (saved && Object.keys(saved).length) return { values: saved, source: "workspace" };
  if (await isPlatformOwnerContext()) {
    const env = fromEnv(provider);
    if (env) return { values: env, source: "environment" };
  }
  return null;
}

/** The credentials, or null. */
export async function connectionValues(provider: string): Promise<Record<string, string> | null> {
  return (await resolveConnection(provider))?.values ?? null;
}

/** Is a usable connection (every required field present) available for this workspace? */
export async function isConnected(provider: string, requiredFields: string[]): Promise<boolean> {
  const v = await connectionValues(provider);
  return !!v && requiredFields.every((f) => !!v[f]);
}
