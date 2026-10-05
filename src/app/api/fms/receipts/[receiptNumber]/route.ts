import { NextRequest, NextResponse } from "next/server";
import { getCurrentFmsUser } from "@/lib/fms-auth";
import { getReceiptByNumber } from "@/lib/fms/receipts";
import { renderReceiptPdf } from "@/components/fms/ReceiptPdf";

type Context = { params: Promise<{ receiptNumber: string }> };

export async function GET(_req: NextRequest, { params }: Context) {
  const user = await getCurrentFmsUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { receiptNumber } = await params;
  const receipt = await getReceiptByNumber(receiptNumber);
  if (!receipt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const buffer = await renderReceiptPdf(receipt);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${receipt.receiptNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
