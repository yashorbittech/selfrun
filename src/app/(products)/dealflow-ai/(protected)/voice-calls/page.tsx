import { requireLmsPage } from "@/lib/lms-auth";
import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { listVoiceCalls, listDealLeads, listDealJobApplications } from "@/lib/dealflow-ai/store";
import DealFlowVoiceClient from "./DealFlowVoiceClient";

export const dynamic = "force-dynamic";

export default async function DealFlowVoiceCallsPage() {
  await requireLmsPage("VIEW_LEADS");

  const calls = listVoiceCalls();
  const leads = listDealLeads();
  const applications = listDealJobApplications();

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <DealFlowVoiceClient
        initialCalls={calls}
        leads={leads}
        applications={applications}
      />
    </div>
  );
}
