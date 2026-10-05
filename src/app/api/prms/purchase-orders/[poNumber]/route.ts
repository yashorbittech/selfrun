import { NextRequest, NextResponse } from "next/server";
import { getCurrentPrmsUser } from "@/lib/prms-auth";
import { canManageProcurement, canManageFinance } from "@/lib/prms-roles";
import { getPurchaseOrderByNumber } from "@/lib/prms/purchase-orders";
import { getPrmsSettings } from "@/lib/prms/settings";
import { renderPurchaseOrderPdf } from "@/components/prms/PurchaseOrderPdf";

type Context = { params: Promise<{ poNumber: string }> };

export async function GET(_req: NextRequest, { params }: Context) {
  const user = await getCurrentPrmsUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageProcurement(user) && !canManageFinance(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { poNumber } = await params;
  const po = await getPurchaseOrderByNumber(poNumber);
  if (!po) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const settings = await getPrmsSettings();
  const buffer = await renderPurchaseOrderPdf(po, settings.company);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${po.poNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
