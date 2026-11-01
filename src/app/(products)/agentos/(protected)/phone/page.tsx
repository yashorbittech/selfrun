import Link from "next/link";
import { redirect } from "next/navigation";
import { Notice, PageHeader, SectionCard } from "@/components/products/agentos/AibotsUi";
import LiveCallsSetup from "@/components/products/agentos/calls/LiveCallsSetup";
import PhoneNav from "@/components/products/agentos/calls/PhoneNav";
import PhoneNumbers from "@/components/products/agentos/calls/PhoneNumbers";
import WebhookPanel from "@/components/products/agentos/calls/WebhookPanel";
import { getConferenceSetup } from "@/lib/products/agentos/calls/conference-setup";
import { listPhoneNumbers, ownTwilio } from "@/lib/products/agentos/calls/numbers";
import { getWebhookSetup } from "@/lib/products/agentos/calls/webhook";
import { listAgentsForViewer } from "@/lib/products/agentos/picker";
import { workspaceAgentClient } from "@/lib/products/agentos/voice/connection";
import { can, getViewer } from "@/lib/products/agentos/viewer";

export const dynamic = "force-dynamic";

/** Phone numbers, who answers them, and how call results reach AgentOS. Calls managers only. */
export default async function PhoneNumbersPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/agentos/login");
  if (!can(viewer, "VOICE_CALL_MANAGE")) redirect("/agentos");
  const [numbers, agents, twilio, eleven, webhook, liveSetup] = await Promise.all([
    listPhoneNumbers(viewer),
    listAgentsForViewer(viewer, { kind: "voice" }),
    ownTwilio().catch(() => null),
    workspaceAgentClient().catch(() => null),
    getWebhookSetup(viewer),
    getConferenceSetup(viewer),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader title="Phone" crumbs={[{ label: "Phone" }]} description="The numbers your voice agents call from and answer, the calling rules, and the do-not-call list." />
      <PhoneNav />

      {!twilio && (
        <Notice tone="warn">
          Twilio isn&apos;t connected. Phone numbers come from your own Twilio account. <Link href="/commandos/settings/integrations" className="font-semibold underline">Connect Twilio in Settings → Integrations</Link>, then come back to add a number.
        </Notice>
      )}
      {!eleven && (
        <Notice tone="warn">
          ElevenLabs isn&apos;t connected, so numbers can&apos;t be added and agents can&apos;t call. <Link href="/commandos/settings/integrations" className="font-semibold underline">Add your ElevenLabs key in Settings → Integrations</Link>.
        </Notice>
      )}

      <SectionCard title="Phone numbers" description="Calls go out from these numbers. Choose which voice agent answers incoming calls on each.">
        <PhoneNumbers numbers={numbers} agents={agents} canImport={Boolean(twilio && eleven)} />
      </SectionCard>

      <SectionCard title="Live calls setup" description="What it takes to listen in on a phone call and take it over from the AI. Each step says what to do and where.">
        <LiveCallsSetup setup={liveSetup} />
      </SectionCard>

      <SectionCard title="Call results" description="ElevenLabs tells AgentOS when a call ends so the transcript, summary and collected answers are saved straight away.">
        <WebhookPanel setup={webhook} />
      </SectionCard>
    </div>
  );
}
