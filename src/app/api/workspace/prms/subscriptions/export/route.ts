import { NextRequest, NextResponse } from "next/server";
import { authorizeWorkspaceApi } from "@/lib/workspace/access";
import { searchSubscriptions } from "@/lib/prms/software-subscriptions";
import { getResourceStatusMeta, isValidResourceStatus } from "@/lib/prms/constants";
import { toCsv } from "@/lib/csv";

export async function GET(req: NextRequest) {
  const auth = await authorizeWorkspaceApi("manage.prms.subscriptions");
  if (!auth.ok) return auth.response;

  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");

  const { items } = await searchSubscriptions({
    search: sp.get("search") ?? undefined,
    filters: { status: status && isValidResourceStatus(status) ? status : undefined },
    page: 1,
    pageSize: 5000,
  });

  const csv = toCsv(items, [
    { header: "Service", value: (r) => r.serviceName },
    { header: "Provider", value: (r) => r.provider },
    { header: "Licenses", value: (r) => String(r.licenseCount) },
    { header: "Monthly Cost", value: (r) => String(r.monthlyCost) },
    { header: "Annual Cost", value: (r) => String(r.annualCost) },
    { header: "Currency", value: (r) => r.currency },
    { header: "Billing Cycle", value: (r) => r.billingCycle },
    { header: "Renewal Date", value: (r) => r.renewalDate ?? "" },
    { header: "Auto Renew", value: (r) => (r.autoRenew ? "Yes" : "No") },
    { header: "Owner", value: (r) => r.ownerName ?? "" },
    { header: "Vendor", value: (r) => r.vendorName ?? "" },
    { header: "Status", value: (r) => getResourceStatusMeta(r.status).label },
  ]);

  const filename = `admin-prms-subscriptions-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
