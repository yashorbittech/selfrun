import { NextRequest, NextResponse } from "next/server";
import { hasBearer } from "@/lib/security/bearer";
import { runTrialSweep } from "@/lib/platform/billing/trials";

/**
 * Daily free-trial sweep across every company — reminder emails at the
 * platform's trial-reminder days, ended trials move to grace then read-only
 * (see `billing/trials.ts`). Vercel Cron, `Authorization: Bearer $CRON_SECRET`.
 * Refuses to run without a configured secret.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !hasBearer(req, secret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ ok: true, ...(await runTrialSweep(new Date())) });
}
