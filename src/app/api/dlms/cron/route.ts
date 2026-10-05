import { NextRequest, NextResponse } from "next/server";
import { hasBearer } from "@/lib/security/bearer";
import { runExpirySweep } from "@/lib/dlms/alerts";
import { forEachCompany } from "@/lib/platform/tenancy/context";

/**
 * Daily DLMS expiry alerts (Vercel Cron, `Authorization: Bearer $CRON_SECRET`).
 * Refuses to run without a configured secret.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !hasBearer(req, secret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ ok: true, companies: await forEachCompany(() => runExpirySweep()) });
}
