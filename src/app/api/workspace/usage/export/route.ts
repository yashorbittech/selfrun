import { NextRequest, NextResponse } from "next/server";
import { authorizeWorkspaceApi } from "@/lib/workspace/access";
import { peopleUsageCsv, usageEventsCsv } from "@/lib/platform/billing/usage-history";
import { isUsageMetricKey } from "@/lib/platform/billing/usage-history-shared";

export const dynamic = "force-dynamic";

/** GET /api/workspace/usage/export?metric=ai|storage|emails|voice|sms|seats|domains&period=YYYY-MM — the itemised history as CSV. */
export async function GET(req: NextRequest) {
  const auth = await authorizeWorkspaceApi("company.usage");
  if (!auth.ok) return auth.response;
  const metric = req.nextUrl.searchParams.get("metric");
  const wanted = req.nextUrl.searchParams.get("period");
  const period0 = wanted && /^\d{4}-\d{2}$/.test(wanted) ? wanted : undefined;
  if (metric === "people") {
    const { filename, csv } = await peopleUsageCsv(period0);
    return new NextResponse(`\uFEFF${csv}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "private, no-store" } });
  }
  if (!isUsageMetricKey(metric)) return NextResponse.json({ error: "Unknown meter." }, { status: 400 });
  const period = req.nextUrl.searchParams.get("period") ?? undefined;
  const { filename, csv } = await usageEventsCsv(metric, period && /^\d{4}-\d{2}$/.test(period) ? period : undefined);
  return new NextResponse(`﻿${csv}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "private, no-store" } });
}
