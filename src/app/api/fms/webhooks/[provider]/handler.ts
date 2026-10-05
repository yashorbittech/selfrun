import { NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { processPaymentWebhook } from "@/lib/fms/payments/webhooks";
import type { PaymentProviderId } from "@/lib/fms/payments/provider";

/**
 * Shared by the host-based route (`/api/fms/webhooks/<provider>`) and the
 * per-company one (`/api/fms/webhooks/<provider>/<companyId>`). The caller
 * decides which company this runs for; the signature is then checked with
 * that company's webhook secret.
 */
export async function handlePaymentWebhook(req: Request, provider: string): Promise<Response> {
  try {
    const providerId = provider as PaymentProviderId;
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || req.headers.get("stripe-signature") || "";
    const eventId = req.headers.get("x-razorpay-event-id");

    const res = await processPaymentWebhook(providerId, rawBody, signature, eventId);
    return NextResponse.json({ ok: res.ok, message: res.message }, { status: res.status });
  } catch (err: unknown) {
    // notFound() from an unknown host must stay a 404, not become a 500.
    unstable_rethrow(err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
