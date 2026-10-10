import "server-only";
import type { MetadataRoute } from "next";
import { MODULE_COPY } from "@/lib/saas/content";
import { DOCS } from "@/lib/saas/docs";
import { TUTORIALS } from "@/lib/saas/tutorials";
import { FEATURE_LISTS, featuresOf } from "@/lib/saas/feature-lists";
import { listPanels } from "@/lib/platform/panels/store";

const PAGES = ["", "/features", "/pricing", "/docs", "/about", "/contact", "/demo", "/gallery", "/offers", "/privacy", "/terms", "/cookies", "/data-policy", "/refund-policy"];

export async function saasSitemap(origin: string): Promise<MetadataRoute.Sitemap> {
  const plans = ["free", "starter", "growth", "business", "enterprise"];
  const panels = (await listPanels().catch(() => [])).filter((p) => p.active && MODULE_COPY[p.key]);
  const paths = [
    ...PAGES,
    ...panels.map((p) => `/features/${p.key}`),
    ...DOCS.map((r) => `/docs/${r.slug}`),
    ...TUTORIALS.map((t) => `/docs/walkthroughs/${t.slug}`),
    ...Object.keys(FEATURE_LISTS).flatMap((k) => featuresOf(k).map((f) => `/docs/${k}/${f.slug}`)),
    ...plans.map((p) => `/pricing/${p}`),
  ];
  const now = new Date();
  return paths.map((p) => ({ url: `${origin}${p}`, lastModified: now, changeFrequency: p === "" || p === "/pricing" ? "weekly" : "monthly", priority: p === "" ? 1 : p === "/pricing" || p === "/features" ? 0.9 : 0.7 }));
}

export function saasRobots(origin: string): string {
  return ["User-agent: *", "Allow: /", "Disallow: /platform/", "Disallow: /api/", "Disallow: /workspace/", "Disallow: /signup/verify", "", `Sitemap: ${origin}/sitemap.xml`, ""].join("\n");
}
