import { NextRequest, NextResponse } from "next/server";
import { hasBearer } from "@/lib/security/bearer";
import { runDueSweep } from "@/lib/smms/publishing";
import { forEachCompany } from "@/lib/platform/tenancy/context";

export const maxDuration = 300;

/**
 * Publishes APPROVED scheduled posts that are due, and reminds publishers about
 * unapproved due posts and ads due to go live (Vercel Cron,
 * `Authorization: Bearer $CRON_SECRET`). Page loads in the panel also run the
 * sweep (throttled), so schedules keep working on a once-a-day cron plan.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !hasBearer(req, secret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ ok: true, companies: await forEachCompany(() => runDueSweep()) });
}
