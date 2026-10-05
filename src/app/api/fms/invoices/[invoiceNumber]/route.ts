import { NextRequest, NextResponse } from "next/server";
import { getCurrentFmsUser } from "@/lib/fms-auth";
import { getInvoiceByNumber } from "@/lib/fms/invoices";
import { renderInvoicePdf } from "@/components/fms/InvoicePdf";

type Context = { params: Promise<{ invoiceNumber: string }> };

export async function GET(_req: NextRequest, { params }: Context) {
  const user = await getCurrentFmsUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { invoiceNumber } = await params;
  const invoice = await getInvoiceByNumber(invoiceNumber);
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const buffer = await renderInvoicePdf(invoice);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
