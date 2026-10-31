import { NextResponse } from "next/server";
import { syncWebsiteJobApplications, getIntegrationsStatus } from "@/lib/dealflow-ai/store";

export async function POST() {
  try {
    const result = syncWebsiteJobApplications();
    const status = getIntegrationsStatus();
    return NextResponse.json({
      ok: true,
      message: `Successfully received ${result.fetchedCount} new job application(s) from website careers portal.`,
      fetchedCount: result.fetchedCount,
      newApplications: result.newApplications,
      websiteStatus: status.website,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
