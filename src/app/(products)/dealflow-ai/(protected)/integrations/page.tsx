import { requireLmsPage } from "@/lib/lms-auth";
import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { getIntegrationsStatus } from "@/lib/dealflow-ai/store";
import DealFlowIntegrationsClient from "./DealFlowIntegrationsClient";

export const dynamic = "force-dynamic";

export default async function DealFlowIntegrationsPage() {
  await requireLmsPage("VIEW_LEADS");

  const integrations = getIntegrationsStatus();

  return (
    <div className="relative flex h-full min-h-0 flex-col gap-4">
      <PanelPageHeader
        title={<>External Platform Integrations & Automated Sync</>}
        description={<>Connect Meta Lead Ads, Upwork Opportunity Feed, Website Careers Portal Webhook, and WhatsApp Business API into one unified engine.</>}
      />
      <DealFlowIntegrationsClient initialIntegrations={integrations} />
    </div>
  );
}
