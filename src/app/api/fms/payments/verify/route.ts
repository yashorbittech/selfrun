import { NextResponse } from "next/server";
import { limitOr429 } from "@/lib/security/rate-limit";
import type { PaymentMethod } from "@/lib/fms/payments/intents";
import { getPaymentIntent, getPaymentIntentByGatewayPayment, markPaymentIntentSuccessful, markPaymentIntentFailed } from "@/lib/fms/payments/intents";
import { getPaymentProvider } from "@/lib/fms/payments/provider";
import { getCurrentFmsUser } from "@/lib/fms-auth";
import { simulatedPaymentsAllowed, SIMULATED_PAYMENTS_MESSAGE } from "@/lib/fms/payments/guard";
import { readSafeJson, UnsafeBodyError } from "@/lib/security/safe-json";

export async function POST(req: Request) {
  const limited = await limitOr429(req, "pay-verify", 40, 600);
  if (limited) return limited;
  try {
    let body: Record<string, unknown>;
    try {
      body = await readSafeJson(req);
    } catch (err) {
      if (err instanceof UnsafeBodyError) return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
      throw err;
    }
    const intentId = typeof body.intentId === "string" ? body.intentId : "";
    const gatewayPaymentId = typeof body.gatewayPaymentId === "string" ? body.gatewayPaymentId : undefined;
    const gatewaySignature = typeof body.gatewaySignature === "string" ? body.gatewaySignature : undefined;
    const utr = typeof body.utr === "string" ? body.utr.slice(0, 80) : undefined;
    const paymentMethod = typeof body.paymentMethod === "string" ? body.paymentMethod.slice(0, 20) : undefined;

    if (!intentId) {
      return NextResponse.json({ ok: false, error: "Missing intentId" }, { status: 400 });
    }

    const intent = await getPaymentIntent(intentId);
    if (!intent) {
      return NextResponse.json({ ok: false, error: "Payment intent not found" }, { status: 404 });
    }

    if (intent.status === "SUCCESS") {
      return NextResponse.json({ ok: true, intent, message: "Payment already verified as successful" });
    }

    const provider = getPaymentProvider(intent.paymentProvider);
    if (gatewayPaymentId && typeof gatewayPaymentId === "string") {
      const statusRes = await provider.getPaymentStatus(gatewayPaymentId);
      // This route is public, so the gateway payment must be THIS intent's payment:
      // made against this intent's gateway order (the gateway fixes the order's
      // amount) and not already used to settle another intent. Otherwise any
      // captured payment on the account could mark any intent paid.
      if (statusRes.ok && intent.paymentProvider !== "mock" && intent.paymentProvider !== "offline") {
        const paidOrder = statusRes.providerOrderId ?? null;
        const reused = await getPaymentIntentByGatewayPayment(gatewayPaymentId);
        if (!intent.gatewayOrderId || paidOrder !== intent.gatewayOrderId || (reused && reused._id !== intent._id)) {
          return NextResponse.json({ ok: false, error: "That payment doesn't belong to this payment request" }, { status: 400 });
        }
      }
      if (statusRes.ok && statusRes.status === "SUCCESS") {
        const markRes = await markPaymentIntentSuccessful(intentId, {
          gatewayPaymentId,
          gatewaySignature,
          utr: utr || statusRes.utr,
          paymentMethod: (paymentMethod || statusRes.paymentMethod) as PaymentMethod | undefined,
        });
        return NextResponse.json({ ok: markRes.ok, intent: markRes.intent });
      } else if (statusRes.ok && statusRes.status === "FAILED") {
        await markPaymentIntentFailed(intentId, statusRes.failureReason || "Payment verification failed");
        return NextResponse.json({ ok: false, error: "Payment failed at gateway" });
      }
    }

    if (intent.paymentProvider === "mock" || intent.paymentProvider === "offline") {
      // A simulated payment moves no money — only signed-in staff may settle one, or the operator must opt in (staging demos).
      if (!(await getCurrentFmsUser()) && !simulatedPaymentsAllowed()) {
        return NextResponse.json({ ok: false, error: SIMULATED_PAYMENTS_MESSAGE }, { status: 403 });
      }
      const markRes = await markPaymentIntentSuccessful(intentId, {
        gatewayPaymentId: gatewayPaymentId || `mock_${Date.now()}`,
        utr: utr || `UTR_MOCK_${Date.now()}`,
        paymentMethod: (paymentMethod || "UPI") as PaymentMethod,
      });
      return NextResponse.json({ ok: markRes.ok, intent: markRes.intent });
    }

    return NextResponse.json({ ok: false, status: intent.status, message: "Payment pending completion" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
