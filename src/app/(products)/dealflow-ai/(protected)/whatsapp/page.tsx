import { requireLmsPage } from "@/lib/lms-auth";
import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import {
  listAllMessages,
  listWhatsAppNotifications,
  listDealLeads,
  listDealJobApplications,
  getIntegrationsStatus,
} from "@/lib/dealflow-ai/store";
import DealFlowWhatsAppClient from "./DealFlowWhatsAppClient";

export const dynamic = "force-dynamic";

export default async function DealFlowWhatsAppPage() {
  await requireLmsPage("VIEW_LEADS");

  const whatsappMessages = listAllMessages("whatsapp");
  const notifications = listWhatsAppNotifications();
  const leads = listDealLeads();
  const applications = listDealJobApplications();
  const integrations = getIntegrationsStatus();

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <DealFlowWhatsAppClient
        initialMessages={whatsappMessages}
        initialNotifications={notifications}
        leads={leads}
        applications={applications}
        integrationStatus={integrations.whatsapp}
      />
    </div>
  );
}
