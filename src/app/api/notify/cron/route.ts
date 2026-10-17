import { NextRequest, NextResponse } from "next/server";
import { hasBearer } from "@/lib/security/bearer";
import { runAllSweeps } from "@/lib/notify/sweeps";

export const maxDuration = 300;

/**
 * Daily time-based notifications for every company (overdue invoices, stale leads, expiring documents, ending offers, HR / project /
 * procurement / training deadlines …) so people are told even if nobody opens the product. Vercel Cron, `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !hasBearer(req, secret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ ok: true, companies: await runAllSweeps() });
}
