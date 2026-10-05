import { NextRequest, NextResponse } from "next/server";
import { hasBearer } from "@/lib/security/bearer";
import { runSweep } from "@/lib/ots/sweep";
import { ensureOtsIndexes } from "@/lib/ots/db";
import { forEachCompany } from "@/lib/platform/tenancy/context";

export const maxDuration = 300;

/**
 * Finalises timed-out attempts, expires missed assignments, sends
 * "opens soon" / "due soon" / "expired" notices and releases after-close
 * results (Vercel Cron, `Authorization: Bearer $CRON_SECRET`). OTS page loads
 * also run the sweep (throttled), so it works on a once-a-day cron plan.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !hasBearer(req, secret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companies = await forEachCompany(async () => {
    await ensureOtsIndexes();
    return runSweep();
  });
  return NextResponse.json({ ok: true, companies });
}
