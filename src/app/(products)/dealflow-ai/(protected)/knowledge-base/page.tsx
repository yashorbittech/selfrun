import { requireLmsPage } from "@/lib/lms-auth";
import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { getKnowledgeBase } from "@/lib/dealflow-ai/knowledge-base";
import KnowledgeBaseClient from "./KnowledgeBaseClient";

export const dynamic = "force-dynamic";

export default async function DealFlowKnowledgeBasePage() {
  await requireLmsPage("VIEW_LEADS");

  const items = await getKnowledgeBase();

  return (
    <div className="relative flex h-full min-h-0 flex-col gap-4">
      <PanelPageHeader
        title={<>DealFlow AI Central Knowledge Base</>}
        description={<>The single source of truth used by AI Chat, AI Email, AI WhatsApp, and AI Voice Calls to generate accurate, company-aligned responses.</>}
      />
      <KnowledgeBaseClient initialItems={items} />
    </div>
  );
}
