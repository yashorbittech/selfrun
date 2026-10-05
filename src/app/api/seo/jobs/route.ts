import { NextRequest, NextResponse } from "next/server";
import { getViewer, can } from "@/lib/seo-panel/viewer";
import type { SeoPermission } from "@/lib/seo-roles";
import { recordAudit } from "@/lib/seo-panel/audit";
import { syncSearchConsole, inspectIndexStatus } from "@/lib/seo-panel/integrations/gsc";
import { syncAnalytics } from "@/lib/seo-panel/integrations/ga4";
import { runPageSpeed } from "@/lib/seo-panel/integrations/pagespeed";
import { verifyBacklinks } from "@/lib/seo-panel/backlinks";
import { snapshotCompetitorSitemap } from "@/lib/seo-panel/competitors";
import { discoverSitemaps, saveSitemapRecords } from "@/lib/seo-panel/sitemaps";
import { getSettings } from "@/lib/seo-panel/settings";
import { invalidateSite } from "@/lib/seo-panel/pages";
import { companySiteUrl } from "@/lib/platform/tenancy/site-url";

/**
 * Long-running SEO jobs (external API calls / fetch loops) run through this
 * route rather than server actions so they get a five-minute budget. Each job
 * names the permission it needs; the session is re-checked on every call.
 */
export const maxDuration = 300;

const JOBS: Record<string, { permission: SeoPermission; label: string; run: (body: Record<string, unknown>) => Promise<unknown> }> = {
  "gsc-sync": { permission: "MANAGE_RANKINGS", label: "Search Console sync", run: () => syncSearchConsole() },
  "ga4-sync": { permission: "MANAGE_RANKINGS", label: "Analytics sync", run: () => syncAnalytics() },
  "index-status": { permission: "MANAGE_TECHNICAL_SEO", label: "Index status check", run: (b) => inspectIndexStatus(Array.isArray(b.paths) ? (b.paths as string[]).filter((p) => typeof p === "string") : []) },
  pagespeed: { permission: "RUN_AUDIT", label: "PageSpeed check", run: (b) => runPageSpeed(Array.isArray(b.paths) ? (b.paths as string[]).filter((p) => typeof p === "string") : []) },
  "verify-backlinks": { permission: "MANAGE_BACKLINKS", label: "Backlink verification", run: (b) => verifyBacklinks(Array.isArray(b.ids) ? (b.ids as string[]).filter((p) => typeof p === "string") : undefined) },
  "competitor-sitemap": { permission: "MANAGE_COMPETITORS", label: "Competitor sitemap snapshot", run: (b) => snapshotCompetitorSitemap(String(b.id ?? "")) },
  "sitemap-discover": {
    permission: "MANAGE_SITEMAP",
    label: "Sitemap discovery",
    run: async () => {
      invalidateSite("/sitemap.xml");
      const s = await getSettings();
      const d = await discoverSitemaps(s.siteOrigin, { primaryHost: new URL(await companySiteUrl()).host });
      await saveSitemapRecords(d.records);
      return { sitemaps: d.records.length, urls: d.urls.length };
    },
  },
};

export async function POST(req: NextRequest) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Your session has expired — please sign in again." }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const job = JOBS[String(body.job ?? "")];
  if (!job) return NextResponse.json({ error: "Unknown job." }, { status: 400 });
  if (!can(viewer, job.permission)) return NextResponse.json({ error: "You don't have permission for this action." }, { status: 403 });
  try {
    const result = await job.run(body);
    await recordAudit({
      actorId: viewer.userId,
      actorEmail: viewer.email,
      action: job.label.includes("sync") ? "sync" : job.label.includes("verif") ? "verify" : "run",
      entity: body.job === "verify-backlinks" ? "backlink" : body.job === "competitor-sitemap" ? "competitor" : body.job === "sitemap-discover" ? "sitemap" : "integration",
      entityId: String(body.job),
      entityLabel: job.label,
      summary: JSON.stringify(result)?.slice(0, 300) ?? null,
    });
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error(`[seo job ${String(body.job)}]`, err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "The job failed." }, { status: 500 });
  }
}
