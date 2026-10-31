import { NextResponse } from "next/server";
import { syncMetaLeads, getIntegrationsStatus } from "@/lib/dealflow-ai/store";

export async function POST() {
  try {
    const result = syncMetaLeads();
    const status = getIntegrationsStatus();
    return NextResponse.json({
      ok: true,
      message: `Successfully synchronized ${result.fetchedCount} new lead(s) from Meta Lead Forms & Ad Campaigns.`,
      fetchedCount: result.fetchedCount,
      newLeads: result.newLeads,
      metaStatus: status.meta,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
