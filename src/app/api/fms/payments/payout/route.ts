import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getCurrentFmsUser } from "@/lib/fms-auth";

export async function POST(req: Request) {
  try {
    const currUser = await getCurrentFmsUser();
    if (!currUser) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { payeeName, payeeAccount, amount, channel, sourceModule, refNotes, sourceTransactionId } = body;

    if (!payeeName || !amount || amount <= 0) {
      return NextResponse.json({ ok: false, error: "Invalid payee or amount" }, { status: 400 });
    }

    const db = await getDb();
    const txnId = `TXN-PAY-${Date.now().toString().slice(-6)}`;
    const utrNo = `UTR${Date.now()}`;
    const paidAt = new Date();

    const paymentMethodLabel =
      channel === "razorpayx"
        ? "RazorpayX Payout API"
        : channel === "neft"
        ? "NEFT Bank Transfer"
        : channel === "rtgs"
        ? "RTGS Bank Transfer"
        : channel === "imps"
        ? "IMPS Instant Transfer"
        : channel === "upi"
        ? "UPI Transfer"
        : "Direct Transfer";

    const newDoc: Record<string, unknown> = {
      _id: txnId,
      transactionNumber: txnId,
      type: "expense",
      sourceModule: (sourceModule || "fms").toLowerCase(),
      sourceRecordId: refNotes || "DIRECT-PAYOUT",
      payee: payeeName,
      accountNumber: payeeAccount || "Direct Transfer",
      amount: Number(amount),
      currency: "INR",
      paymentMethod: paymentMethodLabel,
      referenceNumber: utrNo,
      utrNumber: utrNo,
      paidAt,
      status: "completed",
      transactionDate: paidAt,
      createdBy: currUser.id,
      createdAt: paidAt,
      updatedAt: paidAt,
      deletedAt: null,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.collection("fms_transactions").insertOne(newDoc as any);

    // ── Update the source transaction row (mark paid + store UTR) ──
    if (sourceTransactionId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await db.collection("fms_transactions").updateOne(
        { _id: sourceTransactionId } as any,
        {
          $set: {
            status: "completed",
            utrNumber: utrNo,
            paidAt,
            payoutTxnId: txnId,
            paymentMethod: paymentMethodLabel,
            updatedAt: paidAt,
          },
        }
      );
    }

    // Auto debit active company bank account
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.collection("fms_bank_accounts").updateOne(
      { status: "active", deletedAt: null } as any,
      { $inc: { currentBalance: -Number(amount) }, $set: { updatedAt: paidAt } }
    );

    return NextResponse.json({ ok: true, txnId, referenceNumber: utrNo });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error }, { status: 500 });
  }
}
