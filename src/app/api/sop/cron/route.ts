import { NextRequest, NextResponse } from "next/server";
import { hasBearer } from "@/lib/security/bearer";
import { runSopReminders } from "@/lib/sop/reminders";
import { forEachCompany } from "@/lib/platform/tenancy/context";

/**
 * Daily SOP housekeeping (date-driven status changes + reminders). Vercel Cron
 * calls this with `Authorization: Bearer $CRON_SECRET`; without a configured
 * secret the route refuses to run, so it can never be triggered anonymously.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !hasBearer(req, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Once per company, each in its own scope.
  return NextResponse.json({ ok: true, companies: await forEachCompany(() => runSopReminders()) });
}
