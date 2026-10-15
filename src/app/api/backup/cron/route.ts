import { NextRequest, NextResponse } from "next/server";
import { hasBearer } from "@/lib/security/bearer";
import { runLifecycleJobs } from "@/lib/workspace/data-lifecycle";

export const maxDuration = 300;

/**
 * Daily, with `Authorization: Bearer $CRON_SECRET`: weekly backups for the companies that are due (one per company a week), the clean-up of
 * old backups, and the deletion of companies whose 30 days have ended. It stops before the time limit and carries on the next day.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !hasBearer(req, secret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ ok: true, ...(await runLifecycleJobs()) });
}
