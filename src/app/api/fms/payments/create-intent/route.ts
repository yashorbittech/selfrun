import { NextResponse } from "next/server";
import { limitOr429 } from "@/lib/security/rate-limit";
import { createPaymentIntent, CreatePaymentIntentData } from "@/lib/fms/payments/intents";
import { acquireIdempotencyLock, releaseIdempotencyLock } from "@/lib/fms/payments/idempotency";
import { getCurrentFmsUser } from "@/lib/fms-auth";
import { getPaymentLinkByToken } from "@/lib/fms/payments/links";
import { simulatedPaymentsAllowed, SIMULATED_PAYMENTS_MESSAGE } from "@/lib/fms/payments/guard";
import { readSafeJson, UnsafeBodyError } from "@/lib/security/safe-json";

const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/**
 * Creates a payment intent. Two callers only:
 *  - signed-in FMS staff (any detail they choose, as before, with types enforced), or
 *  - a payer on a public payment link — identified by the link's secret TOKEN. For them everything that matters
 *    (amount, currency, invoice, customer) is read from the stored link, never from the request, discounts and wallet
 *    credits are not accepted, and a simulated gateway is refused outside development.
 */
export async function POST(req: Request) {
  const limited = await limitOr429(req, "pay-intent", 20, 600);
  if (limited) return limited;
  try {
    let body: Record<string, unknown>;
    try {
      body = await readSafeJson(req);
    } catch (err) {
      if (err instanceof UnsafeBodyError) return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
      throw err;
    }
    const staff = await getCurrentFmsUser();
    const idempotencyKey = str(req.headers.get("x-idempotency-key") || body.idempotencyKey, 120) || undefined;

    let input: CreatePaymentIntentData;
    if (staff) {
      input = {
        sourceModule: body.sourceModule as CreatePaymentIntentData["sourceModule"],
        sourceType: str(body.sourceType),
        sourceId: str(body.sourceId),
        customerId: body.customerId ? str(body.customerId) : undefined,
        customerName: str(body.customerName) || "Customer",
        customerEmail: str(body.customerEmail) || "customer@example.com",
        customerPhone: body.customerPhone ? str(body.customerPhone, 40) : undefined,
        invoiceId: body.invoiceId ? str(body.invoiceId) : undefined,
        amount: Number(body.amount),
        walletCreditsUsed: body.walletCreditsUsed ? Number(body.walletCreditsUsed) : 0,
        offerDiscountAmount: body.offerDiscountAmount ? Number(body.offerDiscountAmount) : 0,
        currency: str(body.currency, 8) || "INR",
        paymentMethod: (str(body.paymentMethod, 20) || "UPI") as CreatePaymentIntentData["paymentMethod"],
        paymentProvider: (str(body.paymentProvider, 30) || "mock") as CreatePaymentIntentData["paymentProvider"],
        idempotencyKey,
        metadata: body.metadata && typeof body.metadata === "object" ? (body.metadata as Record<string, unknown>) : undefined,
      };
    } else {
      const link = await getPaymentLinkByToken(str(body.linkToken, 64));
      if (!link || link.status === "PAID" || link.status === "EXPIRED" || link.status === "CANCELLED" || link.status === "DRAFT") {
        return NextResponse.json({ ok: false, error: "This payment link isn't available." }, { status: 403 });
      }
      if (!simulatedPaymentsAllowed()) return NextResponse.json({ ok: false, error: SIMULATED_PAYMENTS_MESSAGE }, { status: 403 });
      input = {
        sourceModule: link.sourceModule,
        sourceType: "DIRECT_LINK",
        sourceId: link._id,
        customerId: link.customerId ?? undefined,
        customerName: link.customerName,
        customerEmail: link.customerEmail,
        customerPhone: link.customerPhone ?? undefined,
        invoiceId: link.invoiceId ?? undefined,
        amount: link.amount,
        walletCreditsUsed: 0,
        offerDiscountAmount: 0,
        currency: link.currency,
        paymentMethod: "UPI",
        paymentProvider: "mock",
        idempotencyKey,
      };
    }

    if (idempotencyKey) {
      const lock = await acquireIdempotencyLock(idempotencyKey, "create_payment_intent");
      if (!lock.acquired && lock.cachedResponse) {
        return NextResponse.json(lock.cachedResponse);
      }
    }

    if (!input.sourceModule || !input.sourceType || !input.sourceId || !Number.isFinite(input.amount) || input.amount <= 0) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields: sourceModule, sourceType, sourceId, amount" },
        { status: 400 }
      );
    }

    const res = await createPaymentIntent(input);
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.reason }, { status: 400 });
    }

    const responseData = {
      ok: true,
      paymentIntent: res.intent,
      checkoutUrl: res.intent.checkoutUrl,
      clientSecret: res.intent.paymentSessionId,
      gatewayOrderId: res.intent.gatewayOrderId,
    };

    if (idempotencyKey) {
      await releaseIdempotencyLock(idempotencyKey, responseData);
    }

    return NextResponse.json(responseData);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
