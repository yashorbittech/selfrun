import "server-only";
import type { MetadataRoute } from "next";
import { INDUSTRIES, MODULE_COPY, RESOURCES, USE_CASES } from "@/lib/saas/content";
import { listPanels } from "@/lib/platform/panels/store";

const PAGES = ["", "/features", "/modules", "/ai", "/automation", "/use-cases", "/industries", "/how-it-works", "/integrations", "/security", "/pricing", "/about", "/contact", "/faq", "/demo", "/resources", "/privacy", "/terms"];

export async function saasSitemap(origin: string): Promise<MetadataRoute.Sitemap> {
  const panels = (await listPanels().catch(() => [])).filter((p) => p.active && MODULE_COPY[p.key] && p.key !== "website");
  const paths = [
    ...PAGES,
    ...panels.map((p) => `/modules/${p.key}`),
    ...USE_CASES.map((u) => `/use-cases/${u.slug}`),
    ...INDUSTRIES.map((i) => `/industries/${i.slug}`),
    ...RESOURCES.map((r) => `/resources/${r.slug}`),
  ];
  const now = new Date();
  return paths.map((p) => ({ url: `${origin}${p}`, lastModified: now, changeFrequency: p === "" || p === "/pricing" ? "weekly" : "monthly", priority: p === "" ? 1 : p === "/pricing" || p === "/features" ? 0.9 : 0.7 }));
}

export function saasRobots(origin: string): string {
  return ["User-agent: *", "Allow: /", "Disallow: /platform/", "Disallow: /api/", "Disallow: /workspace/", "Disallow: /signup/verify", "", `Sitemap: ${origin}/sitemap.xml`, ""].join("\n");
}
