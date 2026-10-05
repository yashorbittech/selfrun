import "server-only";
import { runAsCompany } from "@/lib/platform/tenancy/context";
import { getOnboarding } from "@/lib/platform/onboarding/state";
import { getAppSettings } from "@/lib/pwa/store";
import { appUrlForCompany } from "@/lib/platform/tenancy/site-url";
import { BUILD_TIMEOUT_MS, buildsConfigured, currentBuildInput } from "@/lib/apps/enqueue";
import { overallStatus, platformsOf, recentBuilds, toView, type BuildDoc } from "@/lib/apps/store";
import { APP_PLATFORMS, DESKTOP_PLATFORMS, MOBILE_PLATFORMS, type AppsOverview, type ManualState } from "@/lib/apps/types";

const covers = (b: BuildDoc, group: "desktop" | "mobile") => (group === "desktop" ? DESKTOP_PLATFORMS : MOBILE_PLATFORMS).some((p) => platformsOf(b)[p].status !== "skipped");

/** Everything the Apps page needs, for the company in scope. */
export async function getAppsOverview(companyId: string): Promise<AppsOverview> {
  const [builds, input, { state }, { settings }, appUrl] = await Promise.all([
    recentBuilds(companyId, 12),
    currentBuildInput(companyId),
    getOnboarding(),
    getAppSettings(),
    appUrlForCompany(companyId),
  ]);
  const configured = buildsConfigured();
  const live = (b: BuildDoc) => ["queued", "building"].includes(overallStatus(b)) && Date.now() - b.requestedAt.getTime() < BUILD_TIMEOUT_MS;
  const active = builds.find(live) ?? null;

  const downloads = {} as AppsOverview["downloads"];
  for (const p of APP_PLATFORMS) {
    const b = builds.find((x) => platformsOf(x)[p].status === "ready");
    downloads[p] = b ? { version: b.version, builtAt: (platformsOf(b)[p].finishedAt ?? b.requestedAt).toISOString(), files: platformsOf(b)[p].files } : null;
  }

  const manualFor = (group: "desktop" | "mobile"): ManualState => {
    const running = builds.find((b) => live(b) && covers(b, group));
    if (running) {
      if (running.trigger === "manual") return { kind: "manual-running", since: running.requestedAt.toISOString() };
      // Queued but never handed to a build service: automatic generation is not actually running.
      if (!running.dispatchedAt) return { kind: "auto-stalled", reason: configured ? "The build service hasn't picked it up yet." : "Waiting for the platform's build service to be connected." };
      return { kind: "auto-running", since: running.requestedAt.toISOString() };
    }
    if (!settings.generation.automatic) return { kind: "auto-off" };
    const latest = builds.find((b) => covers(b, group));
    const g = group === "desktop" ? DESKTOP_PLATFORMS : MOBILE_PLATFORMS;
    if (latest && g.some((p) => platformsOf(latest)[p].status === "failed")) return { kind: "auto-stalled", reason: "The last automatic build failed." };
    if (!configured && !latest && state.completedAt) return { kind: "auto-stalled", reason: "Automatic generation is waiting for the platform's build service to be connected." };
    return { kind: "ready" };
  };

  const lastReady = builds.find((b) => overallStatus(b) === "ready");
  const lastFailed = builds[0] && overallStatus(builds[0]) === "failed" ? builds[0] : null;
  const template = process.env.DESKTOP_DOWNLOAD_URL?.trim();

  return {
    configured,
    outdated: Boolean(lastReady && lastReady.input.hash !== input.hash),
    automatic: settings.generation.automatic,
    onboardingDone: Boolean(state.completedAt),
    active: active ? toView(active) : null,
    latest: builds[0] ? toView(builds[0]) : null,
    downloads,
    manual: { desktop: manualFor("desktop"), mobile: manualFor("mobile") },
    genericUrl: template ? template.replace("{address}", encodeURIComponent(appUrl.replace(/^https?:\/\//, ""))) : null,
    appAddress: appUrl.replace(/^https?:\/\//, ""),
    lastError: lastFailed?.error ?? builds[0]?.error ?? null,
  };
}

export const overviewInScope = (companyId: string) => runAsCompany(companyId, () => getAppsOverview(companyId));
