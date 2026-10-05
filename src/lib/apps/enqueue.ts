import "server-only";
import { randomUUID } from "node:crypto";
import { getPlatformDb } from "@/lib/platform/tenancy/platform-db";
import { runAsCompany } from "@/lib/platform/tenancy/context";
import { appUrlForCompany } from "@/lib/platform/tenancy/site-url";
import { COMPANIES_COLLECTION, type Company } from "@/lib/platform/tenancy/companies";
import { buildCompanyIdentity } from "@/lib/pwa/identity";
import { resolvedRootDomain } from "@/lib/platform/integrations/store";
import { saasAppOrigin } from "@/lib/saas/hosts";
import { buildsCol, emptyPlatforms, overallStatus, platformsOf, recentBuilds, type BuildDoc } from "@/lib/apps/store";
import { APP_PLATFORMS, SCOPE_PLATFORMS, type BuildTrigger, type GenerationScope } from "@/lib/apps/types";
import { getAppSettings } from "@/lib/pwa/store";

/**
 * Creates and starts a company's desktop-app build. The build itself runs on a build service (a GitHub Actions workflow, see
 * `.github/workflows/desktop.yml`) that this hands the work to and that reports back to `/api/apps/builds/callback`.
 * Needs three settings on the platform: GITHUB_DISPATCH_TOKEN (can start workflows), GITHUB_REPOSITORY (`owner/repo`) and
 * DESKTOP_BUILD_SECRET (shared with the workflow). Until they exist builds wait in the queue and start the moment they do.
 */
export function buildsConfigured(): boolean {
  return Boolean(process.env.GITHUB_DISPATCH_TOKEN?.trim() && process.env.GITHUB_REPOSITORY?.trim() && process.env.DESKTOP_BUILD_SECRET?.trim());
}

/** A build handed over longer ago than this without finishing is treated as lost. */
export const BUILD_TIMEOUT_MS = 90 * 60_000;
const MAX_ATTEMPTS = 3;

export interface BuildInput {
  origin: string;
  slug: string;
  rootDomain: string;
  hash: string;
}

/** What an installer for this company would bake in right now (its panels address, name and icon), inside the company's scope. */
export async function currentBuildInput(companyId: string): Promise<BuildInput> {
  return runAsCompany(companyId, async () => {
    const [identity, origin, company] = await Promise.all([
      buildCompanyIdentity(),
      appUrlForCompany(companyId),
      getPlatformDb().then((db) => db.collection<Company>(COMPANIES_COLLECTION).findOne({ _id: companyId }, { projection: { slug: 1 } })),
    ]);
    return { origin, slug: company?.slug ?? "workspace", rootDomain: resolvedRootDomain(), hash: `${identity.buildHash}:${origin}` };
  });
}

export type EnqueueResult = { ok: true; id: string; created: boolean } | { ok: false; reason: "up-to-date" | "in-progress" | "automatic-off" | "error"; message: string };

/** Whether this company lets the platform build its apps by itself. */
export async function automaticEnabled(companyId: string): Promise<boolean> {
  return runAsCompany(companyId, async () => (await getAppSettings()).settings.generation.automatic);
}

export async function enqueueBuild(companyId: string, trigger: BuildTrigger, opts: { force?: boolean; scope?: GenerationScope } = {}): Promise<EnqueueResult> {
  const scope = opts.scope ?? "all";
  try {
    // Everything except a person pressing Generate follows the company's "generate automatically" choice.
    if (trigger !== "manual" && !(await automaticEnabled(companyId))) return { ok: false, reason: "automatic-off", message: "Automatic generation is switched off." };
    const col = await buildsCol();
    const recent = await recentBuilds(companyId, 10);
    const active = recent.find((b) => ["queued", "building"].includes(overallStatus(b)) && Date.now() - b.requestedAt.getTime() < BUILD_TIMEOUT_MS);
    if (active) {
      // Handed over nothing yet (no build service was connected): try again now.
      if (!active.dispatchedAt && buildsConfigured()) await dispatchBuild(active);
      return { ok: false, reason: "in-progress", message: "A build is already in progress." };
    }
    const input = await currentBuildInput(companyId);
    const lastReady = recent.find((b) => overallStatus(b) === "ready" && SCOPE_PLATFORMS[scope].every((p) => platformsOf(b)[p].status === "ready"));
    if (!opts.force && lastReady && lastReady.input.hash === input.hash) return { ok: false, reason: "up-to-date", message: "The apps are up to date." };

    const doc: BuildDoc = {
      _id: randomUUID(),
      companyId,
      version: `1.0.${(await col.countDocuments({ companyId })) + 1}`,
      trigger,
      scope,
      input,
      platforms: emptyPlatforms(scope),
      requestedAt: new Date(),
      dispatchedAt: null,
      finishedAt: null,
      runUrl: null,
      error: null,
      attempts: 0,
    };
    await col.insertOne(doc);
    if (buildsConfigured()) await dispatchBuild(doc);
    return { ok: true, id: doc._id, created: true };
  } catch (err) {
    console.error("[apps] could not queue a build", err);
    return { ok: false, reason: "error", message: err instanceof Error ? err.message : "Could not queue the build." };
  }
}

/** Asks the build service (GitHub Actions) to build this row. Records the outcome on the row; never throws. */
export async function dispatchBuild(build: BuildDoc): Promise<boolean> {
  const col = await buildsCol();
  const repo = process.env.GITHUB_REPOSITORY!.trim();
  const workflow = process.env.GITHUB_WORKFLOW_FILE?.trim() || "desktop.yml";
  const ref = process.env.GITHUB_WORKFLOW_REF?.trim() || "main";
  try {
    const api = (process.env.GITHUB_API_URL?.trim() || "https://api.github.com").replace(/\/+$/, "");
    const res = await fetch(`${api}/repos/${repo}/actions/workflows/${encodeURIComponent(workflow)}/dispatches`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.GITHUB_DISPATCH_TOKEN!.trim()}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json" },
      body: JSON.stringify({
        ref,
        inputs: {
          build_id: build._id,
          origin: build.input.origin,
          version: build.version,
          root_domain: build.input.rootDomain,
          platforms: SCOPE_PLATFORMS[build.scope ?? "all"].join(","),
          callback_url: `${saasAppOrigin()}/api/apps/builds/callback`,
        },
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (res.status !== 204) throw new Error(`GitHub answered ${res.status}: ${(await res.text()).slice(0, 200)}`);
    await col.updateOne({ _id: build._id }, { $set: { dispatchedAt: new Date(), error: null }, $inc: { attempts: 1 } });
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[apps] could not start the build service", message);
    await col.updateOne({ _id: build._id }, { $set: { error: `Could not start the build: ${message}` }, $inc: { attempts: 1 } });
    return false;
  }
}

/** Every platform that hasn't finished successfully is marked failed (the build service timed out or vanished). */
async function failStale(b: BuildDoc): Promise<void> {
  const set: Record<string, unknown> = { finishedAt: new Date(), error: "The build did not finish in time." };
  const all = platformsOf(b);
  for (const p of APP_PLATFORMS) if (!["ready", "skipped"].includes(all[p].status)) Object.assign(set, { [`platforms.${p}.status`]: "failed", [`platforms.${p}.error`]: "The build did not finish in time.", [`platforms.${p}.finishedAt`]: new Date() });
  await (await buildsCol()).updateOne({ _id: b._id }, { $set: set });
}

export interface CronReport {
  generated: number;
  dispatched: number;
  retried: number;
  timedOut: number;
  rebuilt: number;
}

/**
 * Daily housekeeping, so nothing depends on a person remembering:
 *  1. companies that finished onboarding and have no apps yet get them (covers companies finished before this existed);
 *  2. builds still waiting for a build service are handed over once one is connected;
 *  3. builds that never finished are failed, and retried (up to 3 attempts);
 *  4. companies whose name or icon changed get rebuilt installers (when their "automatic rebuild" option is on).
 */
export async function runBuildCron(): Promise<CronReport> {
  const report: CronReport = { generated: 0, dispatched: 0, retried: 0, timedOut: 0, rebuilt: 0 };
  const platform = await getPlatformDb();
  const col = await buildsCol();

  // 3. timeouts first, so a company with a stuck build can get a fresh one below
  const stale = await col.find({ dispatchedAt: { $lt: new Date(Date.now() - BUILD_TIMEOUT_MS) }, finishedAt: null }).limit(200).toArray();
  for (const b of stale) {
    if (["ready", "failed"].includes(overallStatus(b))) continue;
    await failStale(b);
    report.timedOut++;
  }

  // 2. waiting for a build service
  if (buildsConfigured()) {
    for (const b of await col.find({ dispatchedAt: null, finishedAt: null }).limit(100).toArray()) if (await dispatchBuild(b)) report.dispatched++;
  }

  const companies = await platform
    .collection<Company & { onboarding?: { completedAt?: Date | null } }>(COMPANIES_COLLECTION)
    .find({ status: "active", isPlatformOwner: { $ne: true }, "onboarding.completedAt": { $ne: null } }, { projection: { _id: 1 } })
    .limit(2000)
    .toArray();
  for (const c of companies) {
    const recent = await recentBuilds(c._id, 5);
    if (recent.length === 0) {
      // 1. no apps yet
      if ((await enqueueBuild(c._id, "onboarding")).ok) report.generated++;
      continue;
    }
    const newest = recent[0];
    const status = overallStatus(newest);
    if (status === "failed" && newest.attempts < MAX_ATTEMPTS && !recent.some((b) => b !== newest && overallStatus(b) === "building")) {
      if ((await enqueueBuild(c._id, "retry", { force: true })).ok) report.retried++;
      continue;
    }
    if (status === "ready" && Date.now() - (newest.finishedAt ?? newest.requestedAt).getTime() > 60 * 60_000) {
      const autoRebuild = await runAsCompany(c._id, async () => (await (await import("@/lib/pwa/store")).getAppSettings()).settings.desktop.autoRebuild);
      if (autoRebuild && (await enqueueBuild(c._id, "branding")).ok) report.rebuilt++;
    }
  }
  return report;
}
