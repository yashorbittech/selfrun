import { NextResponse } from "next/server";
import { onAppSurface } from "@/lib/saas/request";
import { pushConfigured, vapidPublicKey } from "@/lib/push/vapid";

/** Whether push is available on this host and the public key a browser needs to subscribe. */
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await onAppSurface())) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ enabled: pushConfigured(), publicKey: pushConfigured() ? vapidPublicKey() : null }, { headers: { "Cache-Control": "no-store" } });
}
