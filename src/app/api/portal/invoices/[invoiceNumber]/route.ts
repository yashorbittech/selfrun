import { NextRequest, NextResponse } from "next/server";
import { getCurrentPortalUser } from "@/lib/portal-auth";
import { getInvoiceByNumber } from "@/lib/fms/invoices";
import { renderInvoicePdf } from "@/components/fms/InvoicePdf";

type Context = { params: Promise<{ invoiceNumber: string }> };

/**
 * Portal-gated counterpart to `/api/fms/invoices/[invoiceNumber]` — a
 * portal client has no FMS staff session, so that route's
 * `getCurrentFmsUser()` check can never pass for them. Mirrors
 * `/api/portal/download/[type]/[id]` exactly: auth, then an explicit
 * ownership check before returning anything — a client must never be able
 * to fetch another client's invoice by guessing/enumerating numbers.
 */
export async function GET(_req: NextRequest, { params }: Context) {
  const user = await getCurrentPortalUser();
  if (!user || user.role !== "client" || !user.clientId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { invoiceNumber } = await params;
  const invoice = await getInvoiceByNumber(invoiceNumber);
  if (!invoice || invoice.customerId !== user.clientId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = await renderInvoicePdf(invoice);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
