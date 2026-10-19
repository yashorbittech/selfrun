import { NextResponse } from "next/server";
import { hasBearer } from "@/lib/security/bearer";
import { runBuildCron } from "@/lib/apps/enqueue";

/** Daily (Vercel Cron, `Authorization: Bearer $CRON_SECRET`): hands over builds that were requested while no build service was connected, and fails builds that never finished. Never starts a build by itself. */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!hasBearer(req, process.env.CRON_SECRET)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ ok: true, ...(await runBuildCron()) });
}
