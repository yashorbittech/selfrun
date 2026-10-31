import { NextResponse } from "next/server";
import { syncUpworkOpportunities, getIntegrationsStatus } from "@/lib/dealflow-ai/store";

export async function POST() {
  try {
    const result = syncUpworkOpportunities();
    const status = getIntegrationsStatus();
    return NextResponse.json({
      ok: true,
      message: `Successfully synchronized ${result.fetchedCount} relevant opportunity(ies) from Upwork API.`,
      fetchedCount: result.fetchedCount,
      newLeads: result.newLeads,
      upworkStatus: status.upwork,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
