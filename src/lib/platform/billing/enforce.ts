import "server-only";
import { notFound, redirect, unstable_rethrow } from "next/navigation";
import { getDb } from "@/lib/mongodb";
import { currentCompanyId, currentCompanyIdOrNull, runAsCompany } from "@/lib/platform/tenancy/context";
import { getEntitlements } from "@/lib/platform/billing/entitlements";
import { getCompanySubscription } from "@/lib/platform/billing/subscription";
import { getUsage, recordUsage } from "@/lib/platform/billing/usage";
import { isPanelAvailable } from "@/lib/platform/panels/store";
import type { ModuleKey } from "@/lib/platform/onboarding/catalog";
import type { SubscriptionStatus } from "@/lib/platform/billing/types";

/**
 * Plan enforcement for the business panels: module gating, read-only mode,
 * and the seat / AI-token / storage limits. Everything reads the current
 * company's entitlements (`getEntitlements()`), so the platform owner
 * (`internal`) is never gated or blocked — only metered.
 *
 * Two styles for every check: `…BlockReason()` returns a friendly message or
 * null (for code that returns `{ ok: false, error }`), `assert…()` throws a
 * `BillingLimitError` carrying the same message (HTTP 402 for API routes).
 */

export const BILLING_SETTINGS_PATH = "/workspace/settings/billing";

export type BillingBlockCode = "read_only" | "seats" | "ai_tokens" | "storage" | "module";

export class BillingLimitError extends Error {
  readonly status = 402;
  constructor(
    readonly code: BillingBlockCode,
    message: string,
  ) {
    super(message);
    this.name = "BillingLimitError";
  }
}

export function isBillingLimitError(err: unknown): err is BillingLimitError {
  return err instanceof BillingLimitError || (err instanceof Error && err.name === "BillingLimitError");
}

const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(n);

// ---------------------------------------------------------------------------
// Module access
// ---------------------------------------------------------------------------

/** Friendly reason a panel is locked for the current company, or null when it's included. */
export async function moduleBlockReason(moduleKey: ModuleKey | string): Promise<string | null> {
  const e = await getEntitlements();
  if (e.modules === null || e.modules.has(moduleKey)) return null;
  return `This panel isn't included in your ${e.planName ?? "current"} plan. Upgrade in Settings → Billing to unlock it.`;
}

/**
 * Called at the top of a panel's protected layout. A panel outside the
 * company's plan redirects to the "Upgrade to unlock" page. Fails open on a
 * lookup error (the layout's own data access fails on its own if the DB is down).
 */
export async function requireModule(moduleKey: ModuleKey): Promise<void> {
  let locked = false;
  try {
    // Switched off in the Panel Registry (everywhere, or for this company)? The proxy already blocks it; this is the second lock.
    if (!(await isPanelAvailable(await currentCompanyId(), moduleKey))) notFound();
    locked = (await moduleBlockReason(moduleKey)) !== null;
  } catch (err) {
    unstable_rethrow(err);
    console.error(`[billing] module check failed for ${moduleKey}`, err);
  }
  if (locked) redirect(`/workspace/upgrade?module=${encodeURIComponent(moduleKey)}`);
}

// ---------------------------------------------------------------------------
// Read-only mode (suspended / canceled)
// ---------------------------------------------------------------------------

export const READ_ONLY_MESSAGE = "Your workspace is read-only because its subscription is suspended or has ended. You can still view everything; renew in Settings → Billing to make changes.";

export async function writeBlockReason(): Promise<string | null> {
  return (await getEntitlements()).readOnly ? READ_ONLY_MESSAGE : null;
}

/** Guard for mutations: throws `BillingLimitError("read_only")` while the company is suspended or canceled. */
export async function assertWritable(): Promise<void> {
  const reason = await writeBlockReason();
  if (reason) throw new BillingLimitError("read_only", reason);
}

// ---------------------------------------------------------------------------
// Seats (active staff accounts)
// ---------------------------------------------------------------------------

/** Accounts holding only these roles don't take a seat (training students log in to learn, not to work). */
const SEATLESS_ROLES = ["training_student"];

/** Whether an account with these roles takes a seat: any role other than a seatless one. */
export function rolesUseSeat(roles: readonly string[] | null | undefined): boolean {
  return Array.isArray(roles) && roles.some((r) => !SEATLESS_ROLES.includes(r));
}

/** Mongo filter for `admin_users` that take a seat (mirrors `rolesUseSeat`). */
export const SEAT_FILTER = { roles: { $elemMatch: { $nin: SEATLESS_ROLES } } };

export async function countSeatsUsed(): Promise<number> {
  return (await getDb()).collection("admin_users").countDocuments(SEAT_FILTER);
}

async function pendingInvitationCount(): Promise<number> {
  return (await getDb()).collection("company_invitations").countDocuments({ status: "pending", expiresAt: { $gt: new Date() } });
}

/**
 * Why `adding` more active accounts can't be created, or null. With
 * `countPendingInvites`, outstanding invitations count as seats already
 * promised (used when sending a new invitation).
 */
export async function seatBlockReason(adding = 1, opts: { countPendingInvites?: boolean } = {}): Promise<string | null> {
  const e = await getEntitlements();
  if (e.readOnly) return READ_ONLY_MESSAGE;
  const limit = e.limits.seats;
  if (limit === null || adding <= 0) return null;
  const [used, pending] = await Promise.all([countSeatsUsed(), opts.countPendingInvites ? pendingInvitationCount() : Promise.resolve(0)]);
  if (used + pending + adding <= limit) return null;
  const inUse = pending > 0 ? `${fmt(used)} active and ${fmt(pending)} invited` : `${fmt(used)} in use`;
  return `Your plan includes ${fmt(limit)} user${limit === 1 ? "" : "s"} (${inUse}). Deactivate someone or add seats in Settings → Billing.`;
}

export async function assertSeatAvailable(adding = 1, opts: { countPendingInvites?: boolean } = {}): Promise<void> {
  const reason = await seatBlockReason(adding, opts);
  if (reason) throw new BillingLimitError(reason === READ_ONLY_MESSAGE ? "read_only" : "seats", reason);
}

// ---------------------------------------------------------------------------
// AI tokens (monthly)
// ---------------------------------------------------------------------------

export async function aiBlockReason(): Promise<string | null> {
  const e = await getEntitlements();
  if (e.readOnly) return READ_ONLY_MESSAGE;
  const limit = e.limits.aiTokensPerMonth;
  if (limit === null) return null;
  const used = await getUsage("ai_tokens");
  if (used < limit) return null;
  return `Your workspace has used this month's ${fmt(limit)} AI tokens. The allowance resets on the 1st — to keep going now, upgrade or add AI tokens in Settings → Billing.`;
}

export async function assertAiAvailable(): Promise<void> {
  const reason = await aiBlockReason();
  if (reason) throw new BillingLimitError(reason === READ_ONLY_MESSAGE ? "read_only" : "ai_tokens", reason);
}

/**
 * Adds tokens to this month's AI meter. `companyId` lets callers that finish
 * outside the request scope (a streamed reply) meter against the company
 * captured when the call started. Never throws — metering must not break a reply.
 */
export async function meterAiTokens(tokens: number, companyId?: string | null): Promise<void> {
  if (!Number.isFinite(tokens) || tokens <= 0) return;
  try {
    const id = companyId === undefined ? await currentCompanyIdOrNull() : companyId;
    if (!id) return;
    await runAsCompany(id, () => recordUsage("ai_tokens", tokens));
  } catch (err) {
    console.error("[billing] AI usage metering failed", err);
  }
}

// ---------------------------------------------------------------------------
// Storage (cumulative, bytes)
// ---------------------------------------------------------------------------

/** Keyed doc in the company-scoped `billing_usage` collection holding total bytes stored. */
export const STORAGE_USAGE_ID = "storage_bytes";
const MB = 1024 * 1024;

export async function storageUsedBytes(): Promise<number> {
  const doc = await (await getDb()).collection<{ _id: string; total: number }>("billing_usage").findOne({ _id: STORAGE_USAGE_ID });
  return doc?.total ?? 0;
}

export async function storageBlockReason(addingBytes: number): Promise<string | null> {
  // Outside any company (scripts, seeders) there is no plan to check against.
  if (!(await currentCompanyIdOrNull())) return null;
  const e = await getEntitlements();
  const limitMb = e.limits.storageMb;
  if (limitMb === null || addingBytes <= 0) return null;
  const used = await storageUsedBytes();
  if (used + addingBytes <= limitMb * MB) return null;
  return `Your workspace has used its ${fmt(limitMb)} MB of file storage (${fmt(Math.round(used / MB))} MB stored). Delete old files, or upgrade or add storage in Settings → Billing.`;
}

export async function assertStorageAvailable(addingBytes: number): Promise<void> {
  const reason = await storageBlockReason(addingBytes);
  if (reason) throw new BillingLimitError("storage", reason);
}

/** Adjusts the stored-bytes meter (negative on delete; never below 0). Never throws. */
export async function meterStorage(deltaBytes: number): Promise<void> {
  if (!Number.isFinite(deltaBytes) || deltaBytes === 0) return;
  try {
    if (!(await currentCompanyIdOrNull())) return;
    await (await getDb()).collection<{ _id: string }>("billing_usage").updateOne(
      { _id: STORAGE_USAGE_ID },
      [{ $set: { metric: STORAGE_USAGE_ID, total: { $max: [0, { $add: [{ $ifNull: ["$total", 0] }, Math.round(deltaBytes)] }] }, updatedAt: "$$NOW" } }],
      { upsert: true },
    );
  } catch (err) {
    console.error("[billing] storage metering failed", err);
  }
}

// ---------------------------------------------------------------------------
// Billing notice (the banner shown in every panel)
// ---------------------------------------------------------------------------

export interface BillingNoticeInfo {
  status: Extract<SubscriptionStatus, "trialing" | "past_due" | "grace" | "suspended" | "canceled">;
  planName: string | null;
  /** Trial or grace days left; null for the other states. */
  daysLeft: number | null;
}

/** What the panel banner should say for the current company, or null (active / internal). */
export async function getBillingNotice(): Promise<BillingNoticeInfo | null> {
  const e = await getEntitlements();
  switch (e.status) {
    case "trialing":
      return { status: "trialing", planName: e.planName, daysLeft: e.trialDaysLeft };
    case "past_due":
    case "suspended":
    case "canceled":
      return { status: e.status, planName: e.planName, daysLeft: null };
    case "grace": {
      const sub = await getCompanySubscription(await currentCompanyId());
      const ends = sub?.graceEndsAt?.getTime();
      return { status: "grace", planName: e.planName, daysLeft: ends ? Math.max(0, Math.ceil((ends - Date.now()) / 86_400_000)) : null };
    }
    default:
      return null;
  }
}
