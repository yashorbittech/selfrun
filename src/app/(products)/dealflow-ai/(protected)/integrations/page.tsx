import { requireLmsPage } from "@/lib/lms-auth";
import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { getIntegrationsStatus } from "@/lib/dealflow-ai/integrations";
import DealFlowIntegrationsClient from "./DealFlowIntegrationsClient";

export const dynamic = "force-dynamic";

export default async function DealFlowIntegrationsPage() {
  await requireLmsPage("VIEW_LEADS");

  const integrations = await getIntegrationsStatus();

  return (
    <div className="relative flex h-full min-h-0 flex-col gap-4">
      <PanelPageHeader
        title={<>Integrations</>}
        description={<>See which sources feed DealFlow AI and whether their connections are active.</>}
      />
      <DealFlowIntegrationsClient integrations={integrations} />
    </div>
  );
}
