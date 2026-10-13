import { NextResponse } from "next/server";
import { resolveUsageActor } from "@/lib/platform/billing/usage-actor";
import { recordUsage } from "@/lib/platform/billing/usage";
import { recordAiUsage } from "@/lib/platform/billing/ai-usage-log";
export async function GET() {
  const a = await resolveUsageActor();
  await recordUsage("emails", 1, new Date(), { source: "ZZ test", detail: "actor test" });
  await recordAiUsage({ usage: { total_tokens: 77, input_tokens: 70, output_tokens: 7 }, model: "zz", endpoint: "zz", feature: "ZZ test" });
  return NextResponse.json(a);
}
