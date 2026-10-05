import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/push/rate-limit";
import { onAppSurface } from "@/lib/saas/request";
import { buildAssetPack, type AssetGroup } from "@/lib/apps/assets";
import { getCompanyBrand } from "@/lib/platform/branding";

/**
 * The ZIP of every generated asset of one kind of app (`pwa`, `android`, `ios`, `desktop`, or `all`). Public on panels hosts like the
 * single assets (they are the company's own branding), because the mobile and desktop builds download it; rate limited.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const KINDS = new Set(["pwa", "android", "ios", "desktop", "all"]);

export async function GET(req: Request, { params }: { params: Promise<{ kind: string }> }) {
  if (!(await onAppSurface())) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (!rateLimit(`pack:${ip}`, 10, 60_000)) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const kind = (await params).kind.replace(/\.zip$/, "");
  if (!KINDS.has(kind)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const brand = await getCompanyBrand();
  const slug = brand.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "app";
  const zip = await buildAssetPack(kind as AssetGroup | "all");
  return new Response(new Uint8Array(zip), { headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${slug}-${kind}-assets.zip"`, "Cache-Control": "public, max-age=60, s-maxage=300" } });
}
