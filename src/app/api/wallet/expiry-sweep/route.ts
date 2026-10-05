import { NextRequest, NextResponse } from "next/server";
import { getCurrentLmsUser } from "@/lib/lms-auth";
import { runExpirySweep } from "@/lib/wallet/expiry";
import { forEachCompany } from "@/lib/platform/tenancy/context";

/**
 * Expiry sweep + expiring-soon warnings. Authorised by an LMS session or the
 * `WALLET_CRON_SECRET` bearer token, so an external scheduler (Vercel Cron,
 * GitHub Actions, cron-job.org) can call it hourly/daily — same pattern as
 * the chatbot reindex route. Wallet correctness never depends on this running
 * (expiry is also reconciled on every read/spend); it just makes it timely
 * and sends the warnings.
 */
function isScheduler(req: NextRequest): boolean {
  // Vercel Cron sends `Authorization: Bearer $CRON_SECRET`; other schedulers can use WALLET_CRON_SECRET.
  const header = req.headers.get("authorization");
  return [process.env.CRON_SECRET, process.env.WALLET_CRON_SECRET].some((secret) => secret && header === `Bearer ${secret}`);
}

export async function POST(req: NextRequest) {
  // The scheduler sweeps every company; a signed-in LMS user sweeps only their own.
  if (isScheduler(req)) return NextResponse.json({ companies: await forEachCompany(() => runExpirySweep()) });
  if (!(await getCurrentLmsUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await runExpirySweep());
}
export const GET = POST;
