import { getSeoSiteState } from "@/lib/seo-panel/public";
import { defaultRobots } from "@/lib/seo-panel/robots-store";
import { onSaasHost, saasOrigin } from "@/lib/saas/request";
import { saasRobots } from "@/lib/saas/seo";

/**
 * robots.txt is managed in the SEO panel (/seo/robots), per company. Until a
 * version is published there, this serves the code default (`defaultRobots()`:
 * for the platform owner exactly what the old code-defined robots.ts produced,
 * for any other company the same rules pointing at its own sitemap). The content is cached under the SEO site tag, so a publish from
 * the panel reaches the live file without a deploy.
 */
export async function GET() {
  // The SaaS product's own host serves the product's robots.txt, never a customer's.
  if (await onSaasHost()) return new Response(saasRobots(await saasOrigin()), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const { robotsTxt } = await getSeoSiteState();
  return new Response(robotsTxt ?? (await defaultRobots()), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
