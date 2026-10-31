import { requireLmsPage } from "@/lib/lms-auth";
import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { listAllMessages, listDealLeads, listDealJobApplications } from "@/lib/dealflow-ai/store";
import DealFlowEmailClient from "./DealFlowEmailClient";

export const dynamic = "force-dynamic";

export default async function DealFlowEmailsPage() {
  await requireLmsPage("VIEW_LEADS");

  const emailMessages = listAllMessages("email");
  const leads = listDealLeads();
  const applications = listDealJobApplications();

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <DealFlowEmailClient
        initialMessages={emailMessages}
        leads={leads}
        applications={applications}
      />
    </div>
  );
}
