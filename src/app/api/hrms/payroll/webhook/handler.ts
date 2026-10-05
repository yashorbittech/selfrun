import { NextResponse } from "next/server";
import { getPayoutProvider } from "@/lib/hrms/payout-provider";
import { applyWebhookResult } from "@/lib/hrms/salary-payouts";

/**
 * Payout-provider webhook (RazorpayX), shared by the host-based and the
 * per-company route; the caller decides which company this runs for. The
 * signature is checked with that company's webhook secret; a company without
 * payouts connected gets 404, a bad/missing signature 400. The raw body is
 * needed for signature verification, so it is read as text before parsing.
 */
export async function handlePayoutWebhook(req: Request): Promise<Response> {
  const provider = await getPayoutProvider();
  if (provider.key === "manual") {
    return NextResponse.json({ error: "No payout provider configured." }, { status: 404 });
  }

  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  if (!provider.verifyWebhook(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad JSON." }, { status: 400 });
  }

  const result = provider.parseWebhook(json);
  if (result) {
    await applyWebhookResult(result);
  }
  // Always 200 so the provider stops retrying handled events.
  return NextResponse.json({ ok: true });
}
