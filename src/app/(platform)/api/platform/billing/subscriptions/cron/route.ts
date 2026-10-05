import { NextRequest, NextResponse } from "next/server";
import { hasBearer } from "@/lib/security/bearer";
import { runDunningSweep } from "@/lib/platform/billing/subscriptions";

/**
 * Daily subscription dunning (Vercel Cron, `Authorization: Bearer $CRON_SECRET`):
 * past_due → grace → suspended, expired trials, missed renewals.
 * Refuses to run without a configured secret.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !hasBearer(req, secret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ ok: true, ...(await runDunningSweep()) });
}
