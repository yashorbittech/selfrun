import { redirect } from "next/navigation";
import { PageHeader, SectionCard } from "@/components/products/agentos/AibotsUi";
import CallSettingsForm from "@/components/products/agentos/calls/CallSettingsForm";
import InboundNumbersPanel from "@/components/products/agentos/calls/InboundNumbersPanel";
import PhoneNav from "@/components/products/agentos/calls/PhoneNav";
import PublicCallOverview from "@/components/products/agentos/calls/PublicCallOverview";
import PublicCallSettingsForm from "@/components/products/agentos/calls/PublicCallSettingsForm";
import { companyTimeZone } from "@/lib/products/agentos/calls/guards";
import { getPublicOverview } from "@/lib/products/agentos/calls/public";
import { listInboundNumbers } from "@/lib/products/agentos/calls/public-inbound";
import { CALL_SETTING_LIMITS, PUBLIC_SETTING_LIMITS, getCallSettings, getPublicCallSettings } from "@/lib/products/agentos/calls/settings";
import { can, getViewer } from "@/lib/products/agentos/viewer";

export const dynamic = "force-dynamic";

export default async function CallSettingsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/agentos/login");
  if (!can(viewer, "VOICE_CALL_MANAGE")) redirect("/agentos");
  const [settings, timeZone, publicSettings, overview, inbound] = await Promise.all([getCallSettings(), companyTimeZone(), getPublicCallSettings(), getPublicOverview(viewer), listInboundNumbers(viewer)]);
  return (
    <div className="space-y-4">
      <PageHeader title="Call settings" crumbs={[{ label: "Phone", href: "/agentos/phone" }, { label: "Call settings" }]} description="The rules every outbound call is checked against before it is dialed." />
      <PhoneNav />
      <SectionCard title="Calling rules" description="Changes apply to the next call. Scheduled calls are checked again when they are dialed.">
        <CallSettingsForm initial={settings} timeZone={timeZone} limits={{ duplicateMax: CALL_SETTING_LIMITS.duplicateMax, capMax: CALL_SETTING_LIMITS.capMax }} />
      </SectionCard>
      <SectionCard title="Website calls" description="Limits on calls that visitors start from a website, and how callers' numbers show in lists.">
        <PublicCallSettingsForm initial={publicSettings} limits={PUBLIC_SETTING_LIMITS} />
      </SectionCard>
      {overview && (
        <SectionCard title="Website calls today" description="Read-only. What website visitors have used so far today and what was refused.">
          <PublicCallOverview overview={overview} />
        </SectionCard>
      )}
      <SectionCard title="Incoming calls" description="Numbers that answer with an agent, and the latest calls on each.">
        <InboundNumbersPanel numbers={inbound} timeZone={timeZone} />
      </SectionCard>
    </div>
  );
}
