import "server-only";
import { NextResponse } from "next/server";
import { currentCompanyIdOrNull } from "@/lib/platform/tenancy/context";
import { onAppSurface, onSaasHost } from "@/lib/saas/request";
import { rateLimit } from "@/lib/push/rate-limit";

/**
 * Guard for /api/web-push/*: only a company's public WEBSITE host (never a panels host, never the product's own site),
 * and a per-IP rate limit because these endpoints are public.
 */
export async function siteGuard(req: Request, bucket: string, max: number): Promise<NextResponse | null> {
  if ((await onAppSurface()) || (await onSaasHost()) || (await currentCompanyIdOrNull()) === null) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
  if (!rateLimit(`${bucket}:${ip}`, max, 60_000)) return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  return null;
}
